import asyncio
import logging
import uuid
from math import ceil
from pathlib import Path
from types import CoroutineType
from typing import Any, Optional

from sqlalchemy import and_, delete, func, insert, or_, select, tuple_, update
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, joinedload

from app.common.exceptions import (
    AlreadyExistsException,
    AppException,
    BadRequestException,
    NotFoundException,
)
from app.lib.generate_unique_filename import (
    generate_unique_filename,
)
from app.lib.is_descendant import is_descendant
from app.lib.utils import (
    _build_new_storage_path,
    _cleanup_files,
    _fetch_subtree,
    _find_descendant_conflict,
    _resolve_unique_name,
    _stage_files,
)
from app.models import UploadSession
from app.models.node import Node, NodeType
from app.models.starred_node import StarredNode
from app.models.user import User
from app.schemas.node import (
    BulkDeleteNodeSchema,
    BulkForceDeleteNodeSchema,
    BulkRestoreNodeSchema,
    BulkToggleStarNodeSchema,
    CopyNodeSchema,
    CreateNodeSchema,
    MoveNodeSchema,
    RenameNodeSchema,
    UpdateNodeSchema,
)
from app.services.cache import CacheService
from app.services.node_query import (
    apply_file_filter,
    apply_modified_filter,
    apply_sort,
    apply_status_filter,
    normalize_sort,
)

logger = logging.getLogger(__name__)


async def create_node_service(
    payload: CreateNodeSchema, db: AsyncSession, current_user: User, cache: CacheService
):
    name = payload.name

    if payload.parent_id is not None:
        query = select(Node.type).where(
            Node.id == payload.parent_id,
            Node.owner_id == current_user.id,
            Node.deleted_at.is_(None),
        )
        result = await db.execute(query)
        parent_type = result.scalar_one_or_none()

        if parent_type is None:
            raise NotFoundException("Node", str(payload.parent_id))

        if parent_type != NodeType.FOLDER:
            raise BadRequestException(
                "Parent must be a folder", details={"parent_type": parent_type}
            )

    node = Node(
        name=name,
        type=NodeType.FOLDER,
        parent_id=payload.parent_id,
        owner_id=current_user.id,
        mime_type="inode/directory",
    )

    db.add(node)

    try:
        await db.commit()
    except IntegrityError as e:
        await db.rollback()
        if "uq_node_name_per_parent" in str(e.orig):
            raise AlreadyExistsException("Node", "name", name) from e

    await db.refresh(node, ["created_at", "updated_at", "preview_status"])

    invalidation_tasks: list[CoroutineType[Any, Any, Any]] = [
        cache.flush_pattern(
            f"nodes:user={current_user.id}:parent={payload.parent_id}:*"
        ),
        cache.flush_pattern(f"nodes:user={current_user.id}:*keyword=*"),
    ]

    if payload.parent_id is not None:
        invalidation_tasks.append(
            cache.delete(f"node:detail:user={current_user.id}:node={payload.parent_id}")
        )

    results = await asyncio.gather(*invalidation_tasks, return_exceptions=True)
    for r in results:
        if isinstance(r, Exception):
            logger.warning(f"Cache invalidation failed: {r}")

    return node


async def get_nodes_service(
    db: AsyncSession,
    current_user: User,
    cache: CacheService,
    parent_id: Optional[uuid.UUID],
    type: Optional[str],
    modified: Optional[str],
    sort_by: Optional[str],
    sort_direction: Optional[str],
    folder_group: Optional[str],
    status: Optional[str],
    keyword: Optional[str],
    scope: Optional[str],
    page: Optional[int],
    limit: Optional[int],
):
    status = status if status else "active"
    page = max(page or 1, 1)
    limit = min(max(limit or 25, 1), 100)

    offset = (page - 1) * limit

    cache_key = (
        f"nodes:"
        f"user={current_user.id}:"
        f"parent={parent_id}:"
        f"type={type}:"
        f"modified={modified}:"
        f"sort_by={sort_by}:"
        f"sort_direction={sort_direction}:"
        f"folder_group={folder_group}:"
        f"status={status}:"
        f"keyword={keyword}:"
        f"scope={scope}:"
        f"page={page}:"
        f"limit={limit}"
    )

    try:
        cached = await cache.get(cache_key)
        if cached is not None:
            return cached
    except Exception as e:
        logger.warning(f"cache.get failed: {e}")

    if parent_id:
        parent_query = select(Node).where(
            Node.id == parent_id,
            Node.owner_id == current_user.id,
        )

        result = await db.execute(parent_query)
        parent = result.scalar_one_or_none()

        if not parent:
            raise NotFoundException("Node", str(parent_id))

        if parent.type != NodeType.FOLDER:
            raise BadRequestException(
                "Parent must be a folder",
                details={"parent_type": parent.type},
            )

    if status == "trashed":
        Parent = aliased(Node)

        query = (
            select(Node)
            .outerjoin(Parent, Node.parent_id == Parent.id)
            .where(
                Node.owner_id == current_user.id,
                Node.deleted_at.is_not(None),
                or_(
                    Node.parent_id.is_(None),
                    Parent.deleted_at.is_(None),
                ),
            )
        )
    else:
        query = select(Node).where(
            Node.owner_id == current_user.id,
        )

    if scope == "starred":
        query = query.join(
            StarredNode,
            StarredNode.node_id == Node.id,
        ).where(StarredNode.user_id == current_user.id)

    if status != "trashed":
        if scope != "starred":
            if not keyword:
                query = query.where(Node.parent_id == parent_id)
            elif parent_id:
                query = query.where(Node.parent_id == parent_id)

    query = query.options(joinedload(Node.parent))

    query = apply_status_filter(query, status)

    if type:
        query = apply_file_filter(query=query, type=type)

    if modified:
        query = apply_modified_filter(query=query, modified=modified)

    if keyword:
        ts_query = func.websearch_to_tsquery("simple", keyword)

        query = query.where(
            or_(
                Node.search_vector.op("@@")(ts_query),
                Node.name.op("%")(keyword),
                Node.name.ilike(f"%{keyword}%"),
            )
        )

        query = query.order_by(
            func.ts_rank(Node.search_vector, ts_query).desc(),
            func.similarity(Node.name, keyword).desc(),
            func.lower(Node.name).asc(),
        )
    else:
        sort_by, sort_direction, folder_group = normalize_sort(
            sort_by=sort_by or "",
            sort_direction=sort_direction or "",
            folder_group=folder_group or "",
        )

        query = apply_sort(
            query,
            sort_by,
            sort_direction,
            folder_group,
            type,
            status,
        )

    is_starred_subquery = (
        select(1)
        .select_from(StarredNode)
        .where(
            StarredNode.user_id == current_user.id,
            StarredNode.node_id == Node.id,
        )
        .correlate(Node)
        .exists()
    )

    query = query.add_columns(is_starred_subquery.label("is_starred"))

    #
    # COUNT QUERY
    #
    count_subquery = query.order_by(None).subquery()

    total_query = select(func.count()).select_from(count_subquery)

    total_result = await db.execute(total_query)
    total = total_result.scalar() or 0

    #
    # PAGINATION
    #
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    rows = result.all()

    data = [
        {
            "id": str(node.id),
            "name": node.name,
            "type": node.type.value,
            "parent_id": node.parent_id,
            "parent": (
                {
                    "id": str(node.parent.id),
                    "name": node.parent.name,
                    "type": node.parent.type.value,
                }
                if node.parent
                else None
            ),
            "size": node.size,
            "mime_type": node.mime_type,
            "preview_url": node.preview_url,
            "preview_status": node.preview_status,
            "is_starred": is_starred,
            "created_at": node.created_at,
            "updated_at": node.updated_at,
            "deleted_at": node.deleted_at,
        }
        for node, is_starred in rows
    ]

    response = {
        "items": data,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": ceil(total / limit) if total > 0 else 1,
            "has_next_page": page * limit < total,
            "has_prev_page": page > 1,
        },
    }

    ttl_seconds = 15 if keyword else 60
    try:
        await cache.set(
            cache_key,
            response,
            ttl=ttl_seconds,
        )
    except Exception as e:
        logger.warning(f"cache.set failed: {e}")

    return response


async def detail_node_service(
    node_id: uuid.UUID, db: AsyncSession, current_user: User, cache: CacheService
):
    cache_key = f"node:detail:" f"user={current_user.id}:" f"node={node_id}"

    cached = await cache.get(cache_key)
    if cached is not None:
        return cached

    query = select(Node).where(
        Node.id == node_id,
        Node.owner_id == current_user.id,
    )
    result = await db.execute(query)
    node = result.scalar_one_or_none()

    if not node:
        raise NotFoundException("Node", str(node_id))

    response = {
        "id": str(node.id),
        "name": node.name,
        "type": node.type.value,
        "parent_id": node.parent_id,
        "mime_type": node.mime_type,
        "size": node.size,
        "preview_url": node.preview_url,
        "preview_status": node.preview_status,
        "created_at": node.created_at,
        "updated_at": node.updated_at,
    }

    if node.type == NodeType.FOLDER:
        count_result = await db.execute(
            select(func.count()).where(
                Node.parent_id == node.id,
                Node.owner_id == current_user.id,
                Node.deleted_at.is_(None),
            )
        )
        children_count = count_result.scalar_one()

        response["children_count"] = children_count

    await cache.set(
        cache_key,
        response,
        ttl=300 * 60 * 60,
    )

    return response


async def update_node_service(
    db: AsyncSession,
    current_user: User,
    node_id: uuid.UUID,
    payload: UpdateNodeSchema,
    cache: CacheService,
):
    query = select(Node).where(
        Node.id == node_id,
        Node.owner_id == current_user.id,
        Node.deleted_at.is_(None),
    )
    result = await db.execute(query)
    node = result.scalar_one_or_none()

    if not node:
        raise NotFoundException("Node", str(node_id))

    new_name = node.name
    if payload.name is not None:
        new_name = payload.name.strip()
        if not new_name:
            raise BadRequestException(
                "Name cannot be empty", details={"new_name": payload.name}
            )

    new_parent_id = (
        payload.parent_id if payload.parent_id is not None else node.parent_id
    )
    if payload.parent_id is not None:
        if payload.parent_id == node.id:
            raise BadRequestException(
                "Cannot move node into itself",
                details={"new_parent_id": str(payload.parent_id)},
            )

        # preventing moving to descendant
        is_invalid = await is_descendant(
            db=db, node_id=node_id, target_id=payload.parent_id
        )
        if is_invalid:
            raise BadRequestException("Cannot move a folder into its own subfolder")

        query = select(Node).where(
            Node.id == payload.parent_id,
            Node.owner_id == current_user.id,
            Node.deleted_at.is_(None),
        )
        result = await db.execute(query)
        parent = result.scalar_one_or_none()

        if not parent:
            raise NotFoundException("Node", str(payload.parent_id))

        if parent.type != NodeType.FOLDER:
            raise BadRequestException(
                "Target must be a folder", details={"parent_type": parent.type}
            )

    query = select(Node).where(
        Node.parent_id == new_parent_id,
        Node.owner_id == current_user.id,
        Node.name == new_name,
        Node.id != node.id,
        Node.deleted_at.is_(None),
    )
    result = await db.execute(query)
    existing = result.scalar_one_or_none()

    if existing:
        raise AlreadyExistsException("Node", "name", new_name)

    old_parent_id = node.parent_id
    node.name = new_name
    node.parent_id = new_parent_id

    await db.commit()
    await db.refresh(node)

    await cache.flush_pattern(f"node:detail:user={current_user.id}:node={node_id}")
    # invalidate old folder
    await cache.flush_pattern(f"nodes:user={current_user.id}:parent={old_parent_id}:*")
    if old_parent_id != new_parent_id:
        # invalidate new folder
        await cache.flush_pattern(
            f"nodes:user={current_user.id}:parent={new_parent_id}:*"
        )
    # invalidate search cache
    await cache.flush_pattern(f"nodes:user={current_user.id}:keyword=*")

    return node


async def delete_node_service(
    payload: BulkDeleteNodeSchema,
    db: AsyncSession,
    current_user: User,
    cache: CacheService,
):
    roots = (
        (
            await db.execute(
                select(Node)
                .where(
                    Node.id.in_(payload.node_ids),
                    Node.owner_id == current_user.id,
                    Node.deleted_at.is_(None),
                )
                .with_for_update()
            )
        )
        .scalars()
        .all()
    )

    if len(roots) != len(payload.node_ids):
        found_ids = {n.id for n in roots}
        missing_ids = [str(nid) for nid in payload.node_ids if nid not in found_ids]
        raise NotFoundException("Node(s)", ", ".join(missing_ids))

    parent_ids = {node.parent_id for node in roots}
    anchor = (
        select(Node.id)
        .where(
            Node.id.in_(payload.node_ids),
            Node.owner_id == current_user.id,
            Node.deleted_at.is_(None),
        )
        .cte(name="to_delete", recursive=True)
    )
    parent_alias = aliased(anchor)
    cte = anchor.union_all(
        select(Node.id).where(
            Node.parent_id == parent_alias.c.id,
            Node.owner_id == current_user.id,
            Node.deleted_at.is_(None),
        )
    )

    affected_ids = (await db.execute(select(cte.c.id))).scalars().all()
    if not affected_ids:
        return

    now = func.now()
    try:
        await db.execute(
            update(Node)
            .where(
                Node.id.in_(affected_ids),
                Node.owner_id == current_user.id,
                Node.deleted_at.is_(None),
            )
            .values(deleted_at=now)
            .execution_options(synchronize_session=False)
        )
        await db.commit()
    except SQLAlchemyError as e:
        await db.rollback()
        logger.exception("delete_node_service commit failed")
        raise AppException(
            error_code="DELETED_FILES",
            message="Failed to delete nodes",
            details={"reason": str(e)},
        )

    invalidation_tasks: list[CoroutineType[Any, Any, Any]] = [
        cache.flush_pattern(f"nodes:user={current_user.id}:*status=trashed*"),
        cache.flush_pattern(f"nodes:user={current_user.id}:*keyword=*"),
    ]

    for nid in payload.node_ids:
        invalidation_tasks.append(
            cache.delete(f"node:detail:user={current_user.id}:node={nid}")
        )

    for pid in parent_ids:
        invalidation_tasks.extend(
            [
                cache.flush_pattern(f"nodes:user={current_user.id}:parent={pid}:*"),
                cache.delete(f"node:detail:user={current_user.id}:node={pid}"),
            ]
        )

    results = await asyncio.gather(*invalidation_tasks, return_exceptions=True)
    for r in results:
        if isinstance(r, Exception):
            logger.warning(f"Cache invalidation failed: {r}")

    return {"success": True}


async def restore_node_service(
    payload: BulkRestoreNodeSchema,
    db: AsyncSession,
    current_user: User,
    cache: CacheService,
):
    if not payload.node_ids:
        return {"success": True}

    nodes = (
        (
            await db.execute(
                select(Node).where(
                    Node.id.in_(payload.node_ids),
                    Node.owner_id == current_user.id,
                    Node.deleted_at.is_not(None),
                )
            )
        )
        .scalars()
        .all()
    )

    if len(nodes) != len(payload.node_ids):
        found_ids = {n.id for n in nodes}
        missing_ids = [str(nid) for nid in payload.node_ids if nid not in found_ids]
        raise NotFoundException("Node(s)", ", ".join(missing_ids))

    seen: set[tuple[uuid.UUID | None, str]] = set()
    for n in nodes:
        key = (n.parent_id, n.name)
        if key in seen:
            raise AlreadyExistsException("Node", "name", n.name)
        seen.add(key)

    parent_ids_needed = {n.parent_id for n in nodes if n.parent_id is not None}
    if parent_ids_needed:
        alive = await db.execute(
            select(Node.id).where(
                Node.id.in_(parent_ids_needed),
                Node.owner_id == current_user.id,
                Node.deleted_at.is_(None),
            )
        )
        alive_set = set(alive.scalars().all())
        for n in nodes:
            if n.parent_id is not None and n.parent_id in alive_set:
                raise BadRequestException(
                    f"Cannot restore '{n.name}': parent folder no longer exists or is deleted"
                )

    null_names = [n.name for n in nodes if n.parent_id is not None]
    keyed = [(n.parent_id, n.name) for n in nodes if n.parent_id is not None]
    clauses = []

    if null_names:
        clauses.append(and_(Node.parent_id.is_(None), Node.name.in_(null_names)))
    if keyed:
        clauses.append(tuple_(Node.parent_id, Node.name).in_(keyed))

    conflict = await db.execute(
        select(Node.name)
        .where(
            Node.owner_id == current_user.id, Node.deleted_at.is_(None), or_(*clauses)
        )
        .limit(1)
    )
    if (clash := conflict.scalar_one_or_none()) is not None:
        raise AlreadyExistsException("Node", "name", clash)

    descendant_ids = await _fetch_subtree(
        db=db,
        owner_id=current_user.id,
        root_ids=list(payload.node_ids),
        include_deleted=True,
    )
    await db.execute(
        update(Node)
        .where(Node.id.in_(descendant_ids))
        .values(deleted_at=None)
        .execution_options(synchronize_session=False)
    )
    await db.commit()

    invalidation_tasks = [
        cache.flush_pattern(f"node:detail:user={current_user.id}:*"),
        cache.flush_pattern(f"nodes:user={current_user.id}:*status=trashed*"),
        cache.flush_pattern(f"nodes:user={current_user.id}:*keyword=*"),
    ]

    parent_scopes = {n.parent_id for n in nodes}
    for p in parent_scopes:
        invalidation_tasks.append(
            cache.flush_pattern(f"nodes:user={current_user.id}:parent={p}:*")
        )

    results = await asyncio.gather(*invalidation_tasks, return_exceptions=True)
    for r in results:
        if isinstance(r, Exception):
            logger.warning(f"Cache invalidation failed: {r}")

    return {"success": True}


async def toggle_star_service(
    db: AsyncSession,
    current_user: User,
    payload: BulkToggleStarNodeSchema,
    cache: CacheService,
):
    if not payload.node_ids:
        return {"node_ids": [], "is_starred": False}

    rows = (
        await db.execute(
            select(
                Node.id,
                Node.parent_id,
                StarredNode.node_id.label("starred_id"),
            )
            .outerjoin(
                StarredNode,
                and_(
                    StarredNode.node_id == Node.id,
                    StarredNode.user_id == current_user.id,
                ),
            )
            .where(
                Node.id.in_(payload.node_ids),
                Node.owner_id == current_user.id,
                Node.deleted_at.is_(None),
            )
        )
    ).all()

    if len(rows) != len(payload.node_ids):
        found = {r.id for r in rows}
        missing = [str(nid) for nid in payload.node_ids if nid not in found]
        raise NotFoundException("Node(s)", ", ".join(missing))

    parent_ids = {r.parent_id for r in rows}
    already_starred = {r.id for r in rows if r.starred_id is not None}

    target_star_state = len(already_starred) < len(rows)
    if target_star_state:
        unique_payload_ids = set(payload.node_ids)
        to_star = [nid for nid in unique_payload_ids if nid not in already_starred]

        if to_star:
            stmt = insert(StarredNode).values(
                [{"user_id": current_user.id, "node_id": nid} for nid in to_star]
            )
            await db.execute(stmt)
    else:
        await db.execute(
            delete(StarredNode).where(
                StarredNode.user_id == current_user.id,
                StarredNode.node_id.in_(payload.node_ids),
            )
        )

    await db.commit()

    invalidation_tasks: list[
        CoroutineType[Any, Any, Any] | CoroutineType[Any, Any, int]
    ] = [
        cache.delete(f"statistics:user={current_user.id}"),
        cache.flush_pattern(f"nodes:user={current_user.id}:*scope=starred*"),
        cache.flush_pattern(f"nodes:user={current_user.id}:*keyword=*"),
    ]

    for p_id in parent_ids:
        invalidation_tasks.append(
            cache.flush_pattern(f"nodes:user={current_user.id}:parent={p_id}:*")
        )

    for nid in payload.node_ids:
        invalidation_tasks.append(
            cache.delete(f"node:detail:user={current_user.id}:node={nid}")
        )

    results = await asyncio.gather(*invalidation_tasks, return_exceptions=True)
    for r in results:
        if isinstance(r, Exception):
            logger.warning(f"Cache invalidation failed: {r}")

    return {
        "node_ids": [str(nid) for nid in payload.node_ids],
        "is_starred": target_star_state,
    }


async def force_delete_service(
    current_user: User,
    db: AsyncSession,
    payload: BulkForceDeleteNodeSchema,
    cache: CacheService,
):
    if not payload.node_ids:
        return {"deleted": 0, "node_ids": []}

    root_nodes = (
        (
            await db.execute(
                select(Node).where(
                    Node.id.in_(payload.node_ids),
                    Node.owner_id == current_user.id,
                    Node.deleted_at.is_not(None),
                )
            )
        )
        .scalars()
        .all()
    )

    if len(root_nodes) != len(payload.node_ids):
        found_ids = {n.id for n in root_nodes}
        missing_ids = [str(nid) for nid in payload.node_ids if nid not in found_ids]
        raise NotFoundException("Node(s) in Trash", ", ".join(missing_ids))

    folder_root_ids: list[uuid.UUID] = [
        n.id for n in root_nodes if n.type == NodeType.FOLDER
    ]
    nodes_to_delete: list[Node] = list(root_nodes)

    if folder_root_ids:
        root_id_set = {n.id for n in root_nodes}
        subtree = await _fetch_subtree(
            db=db,
            owner_id=current_user.id,
            root_ids=folder_root_ids,
            include_deleted=True,
        )
        nodes_to_delete.extend(n for n in subtree if n.id not in root_id_set)

    file_paths: list[str] = []
    for n in nodes_to_delete:
        if n.type != NodeType.FILE:
            continue
        if n.storage_path:
            file_paths.append(n.storage_path)
        if n.preview_url:
            file_paths.append(n.preview_url)

    all_deleted_ids = [n.id for n in nodes_to_delete]
    await db.execute(
        delete(UploadSession).where(UploadSession.parent_id.in_(all_deleted_ids))
    )
    await db.execute(delete(Node).where(Node.id.in_(all_deleted_ids)))
    await db.commit()

    if file_paths:
        await asyncio.to_thread(_cleanup_files, file_paths)

    invalidation_tasks = [
        cache.delete(f"statistics:user={current_user.id}"),
        cache.flush_pattern(f"nodes:user={current_user.id}:*"),
        cache.flush_pattern(f"node:detail:user={current_user.id}:*"),
    ]
    results = await asyncio.gather(
        *invalidation_tasks,
        return_exceptions=True,
    )
    for r in results:
        if isinstance(r, Exception):
            logger.warning(f"Cache invalidation failed: {r}")

    return {
        "deleted": len(nodes_to_delete),
        "node_ids": [str(nid) for nid in payload.node_ids],
    }


async def rename_node_service(
    db: AsyncSession,
    current_user: User,
    node_id: uuid.UUID,
    payload: RenameNodeSchema,
    cache: CacheService,
):
    result = await db.execute(
        select(Node).where(
            Node.id == node_id,
            Node.owner_id == current_user.id,
            Node.deleted_at.is_(None),
        )
    )
    node = result.scalar_one_or_none()
    if not node:
        raise NotFoundException("Node", str(node_id))

    new_name = payload.new_name.strip()
    if not new_name:
        raise BadRequestException(
            "Name cannot be empty",
            details={"new_name": payload.new_name},
        )

    if new_name == node.name:
        return {"success": True}

    if node.type == NodeType.FILE:
        old_suffix = Path(node.name).suffix
        new_suffix = Path(new_name).suffix

        if not new_suffix and old_suffix:
            new_name = f"{new_name}{old_suffix}"

    resolved_name = await generate_unique_filename(
        db=db, owner_id=current_user.id, parent_id=node.parent_id, filename=new_name
    )
    node.name = resolved_name

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise AlreadyExistsException(
            "Node",
            "name",
            resolved_name,
        )

    await db.refresh(node)
    # invalidate detail cache
    await cache.delete(f"node:detail:user={current_user.id}:node={node.id}")
    # invalidate folder listing
    await cache.flush_pattern(f"nodes:user={current_user.id}:parent={node.parent_id}:*")
    # invalidate search cache
    await cache.flush_pattern(f"nodes:user={current_user.id}:*keyword=*")

    return {"success": True}


async def cut_node_service(
    db: AsyncSession,
    current_user: User,
    payload: MoveNodeSchema,
    cache: CacheService,
):
    target_parent_id = payload.parent_id
    nodes = (
        (
            await db.execute(
                select(Node)
                .where(
                    Node.id.in_(payload.node_ids),
                    Node.owner_id == current_user.id,
                    Node.deleted_at.is_(None),
                )
                .with_for_update()
            )
        )
        .scalars()
        .all()
    )

    if len(nodes) != len(payload.node_ids):
        found_ids = {n.id for n in nodes}
        missing_ids = [str(nid) for nid in payload.node_ids if nid not in found_ids]
        raise NotFoundException("Node(s)", ", ".join(missing_ids))

    if target_parent_id is not None:
        parent = (
            await db.execute(
                select(Node).where(
                    Node.id == target_parent_id,
                    Node.owner_id == current_user.id,
                    Node.deleted_at.is_(None),
                )
            )
        ).scalar_one_or_none()

        if not parent:
            raise NotFoundException("Parent Node", str(target_parent_id))

        if parent.type != NodeType.FOLDER:
            raise BadRequestException(
                "Target must be a folder",
                details={"target_type": parent.type},
            )

    if target_parent_id is not None:
        for n in nodes:
            if n.id == target_parent_id:
                raise BadRequestException(
                    "Cannot move node into itself",
                    details={"target_parent_id": str(target_parent_id)},
                )

    folder_candidates = [
        n
        for n in nodes
        if n.type == NodeType.FOLDER
        and target_parent_id is not None
        and n.parent_id != target_parent_id
    ]

    if folder_candidates and target_parent_id is not None:
        offending_root_id = await _find_descendant_conflict(
            db=db,
            owner_id=current_user.id,
            folder_ids=[n.id for n in folder_candidates],
            target_id=target_parent_id,
        )

        if offending_root_id is not None:
            offending = next(n for n in folder_candidates if n.id == offending_root_id)
            raise BadRequestException(
                f"Cannot move folder '{offending.name}' into its own descendant"
            )

    existing_names = set(
        (
            await db.execute(
                select(Node.name).where(
                    Node.owner_id == current_user.id,
                    Node.parent_id == target_parent_id,
                    Node.deleted_at.is_(None),
                )
            )
        )
        .scalars()
        .all()
    )

    old_parent_ids: set[uuid.UUID | None] = set()
    updated_nodes: list[Node] = []

    for node in nodes:
        if node.parent_id == target_parent_id:
            updated_nodes.append(node)
            continue

        resolved = _resolve_unique_name(node.name, existing_names)
        existing_names.add(resolved)

        old_parent_ids.add(node.parent_id)
        node.parent_id = target_parent_id
        node.name = resolved
        updated_nodes.append(node)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise AlreadyExistsException(
            "Node",
            "name",
            "Conflict encountered during bulk move operation.",
        )

    invalidation_tasks: list[CoroutineType[Any, Any, Any]] = [
        cache.flush_pattern(
            f"nodes:user={current_user.id}:parent={target_parent_id}:*"
        ),
        cache.flush_pattern(f"nodes:user={current_user.id}:*keyword=*"),
    ]

    for n in updated_nodes:
        invalidation_tasks.append(
            cache.delete(f"node:detail:user={current_user.id}:node={n.id}")
        )

    for pid in old_parent_ids:
        invalidation_tasks.append(
            cache.flush_pattern(f"nodes:user={current_user.id}:parent={pid}:*")
        )

    results = await asyncio.gather(*invalidation_tasks, return_exceptions=True)
    for r in results:
        if isinstance(r, Exception):
            logger.warning(f"Cache invalidation failed: {r}")

    return updated_nodes


async def copy_node_service(
    db: AsyncSession,
    current_user: User,
    payload: CopyNodeSchema,
    cache: CacheService,
):
    target_parent_id = payload.parent_id
    nodes = (
        (
            await db.execute(
                select(Node)
                .where(
                    Node.id.in_(payload.node_ids),
                    Node.owner_id == current_user.id,
                    Node.deleted_at.is_(None),
                )
                .with_for_update(read=True)
            )
        )
        .scalars()
        .all()
    )

    if len(nodes) != len(payload.node_ids):
        found_ids = {n.id for n in nodes}
        missing_ids = [str(nid) for nid in payload.node_ids if nid not in found_ids]
        raise NotFoundException("Node(s)", ", ".join(missing_ids))

    if target_parent_id is not None:
        parent = (
            await db.execute(
                select(Node).where(
                    Node.id == target_parent_id,
                    Node.owner_id == current_user.id,
                    Node.deleted_at.is_(None),
                )
            )
        ).scalar_one_or_none()
        if not parent:
            raise NotFoundException("Node", str(target_parent_id))

        if parent.type != NodeType.FOLDER:
            raise BadRequestException(
                "Target must be a folder",
                details={"target_type": parent.type},
            )

    folder_sources = [n for n in nodes if n.type == NodeType.FOLDER]
    if folder_sources and target_parent_id is not None:
        for n in folder_sources:
            if n.id == target_parent_id:
                raise BadRequestException("Cannot copy folder into itself")

        offending = await _find_descendant_conflict(
            db=db,
            owner_id=current_user.id,
            folder_ids=[n.id for n in folder_sources],
            target_id=target_parent_id,
        )
        if offending is not None:
            src = next(n for n in folder_sources if n.id == offending)
            raise BadRequestException(
                f"Cannot copy folder '{src.name}' into its own descendant"
            )

    subtree = await _fetch_subtree(
        db=db, owner_id=current_user.id, root_ids=[n.id for n in nodes]
    )

    existing_names = set(
        (
            await db.execute(
                select(Node.name).where(
                    Node.owner_id == current_user.id,
                    Node.parent_id == target_parent_id,
                    Node.deleted_at.is_(None),
                )
            )
        )
        .scalars()
        .all()
    )

    root_ids = {n.id for n in nodes}
    id_map: dict[uuid.UUID, uuid.UUID] = {n.id: uuid.uuid7() for n in subtree}

    new_rows: list[dict] = []
    file_ops: list[tuple[str, str]] = []  # (src_path, dst_path)
    top_level_new_ids: list[uuid.UUID] = []

    for src in subtree:
        new_id = id_map[src.id]
        is_root = src.id in root_ids

        if is_root:
            new_name = _resolve_unique_name(src.name, existing_names)
            existing_names.add(new_name)
            new_parent = target_parent_id
            top_level_new_ids.append(new_id)
        else:
            new_name = src.name
            new_parent = (
                id_map.get(src.parent_id) if src.parent_id else target_parent_id
            )

        new_storage_path = None
        if src.type == NodeType.FILE and src.storage_path:
            new_storage_path = _build_new_storage_path(src.storage_path)
            file_ops.append((src.storage_path, new_storage_path))

        new_rows.append(
            {
                "id": new_id,
                "owner_id": current_user.id,
                "parent_id": new_parent,
                "name": new_name,
                "type": src.type,
                "size": src.size,
                "mime_type": src.mime_type,
                "storage_path": new_storage_path,
                "preview_url": src.preview_url,
                "preview_status": src.preview_status,
            }
        )

    staged: list[str] = []
    try:
        await asyncio.to_thread(_stage_files, file_ops, staged)
    except OSError as e:
        await asyncio.to_thread(_cleanup_files, staged)
        logger.exception("file staging failed during copy")
        raise AppException(
            message="Failed to stage file copies",
            error_code="INTERNAL_SERVER_ERROR",
            details={"reason": str(e)},
        )

    try:
        if new_rows:
            await db.execute(insert(Node), new_rows)
        await db.commit()
    except IntegrityError as e:
        await db.rollback()
        await asyncio.to_thread(_cleanup_files, staged)
        logger.warning("copy commit conflict", exc_info=e)
        raise AlreadyExistsException(
            "Node",
            "name",
            "Conflict encountered during bulk copy operation.",
        )
    except Exception:
        await db.rollback()
        await asyncio.to_thread(_cleanup_files, staged)
        raise

    copied_nodes = (
        (await db.execute(select(Node).where(Node.id.in_(top_level_new_ids))))
        .scalars()
        .all()
    )

    invalidation_tasks = [
        cache.flush_pattern(
            f"nodes:user={current_user.id}:parent={target_parent_id}:*"
        ),
        cache.flush_pattern(f"nodes:user={current_user.id}:*keyword=*"),
    ]
    results = await asyncio.gather(*invalidation_tasks, return_exceptions=True)
    for r in results:
        if isinstance(r, Exception):
            logger.warning(f"Cache invalidation failed: {r}")

    return list(copied_nodes)
