import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import BadRequestException, NotFoundException
from app.models.node import Node, NodeType
from app.models.user import User
from app.services.node_query import (
    apply_file_filter,
    apply_modified_filter,
    apply_sort,
    normalize_sort,
)


async def get_nodes_service(
    db: AsyncSession,
    current_user: User,
    parent_id: Optional[uuid.UUID],
    type: Optional[str],
    modified: Optional[str],
    sort_by: Optional[str],
    sort_direction: Optional[str],
    folder_group: Optional[str],
):
    if parent_id:
        query = select(Node).where(
            Node.id == parent_id,
            Node.owner_id == current_user.id,
            Node.deleted_at.is_(None),
        )
        result = await db.execute(query)
        parent = result.scalar_one_or_none()
        if not parent:
            raise NotFoundException("Node", str(parent_id))

        if parent.type != NodeType.FOLDER:
            raise BadRequestException(
                "Parent must be a folder", details={"parent_type": parent.type}
            )

    query = select(Node).where(
        Node.owner_id == current_user.id,
        Node.parent_id == parent_id,
        Node.deleted_at.is_(None),
    )

    if type:
        query = apply_file_filter(query=query, type=type)

    if modified:
        query = apply_modified_filter(query=query, modified=modified)

    sort_by, sort_direction, folder_group = normalize_sort(
        sort_by=sort_by if sort_by else "",
        sort_direction=sort_direction if sort_direction else "",
        folder_group=folder_group if folder_group else "",
    )

    query = apply_sort(query, sort_by, sort_direction, folder_group, type)

    result = await db.execute(query)
    nodes = result.scalars().all()
    data = [
        {
            "id": str(node.id),
            "name": node.name,
            "type": node.type.value,
            "parent_id": node.parent_id,
            "size": node.size,
            "mime_type": node.mime_type,
            "created_at": node.created_at,
            "updated_at": node.updated_at,
        }
        for node in nodes
    ]
    return data
