import logging
import os
import shutil
import uuid
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models import Node


async def _find_descendant_conflict(
    db: AsyncSession,
    owner_id: uuid.UUID,
    folder_ids: list[uuid.UUID],
    target_id: uuid.UUID,
) -> uuid.UUID | None:
    """
    Returns the folder id (from folder_ids) whose subtree contains target_id,
    or None if no conflict. Single recursive CTE covering all candidates.
    """
    anchor = (
        select(
            Node.id.label("descendant_id"),
            Node.parent_id.label("root_id"),
        )
        .where(
            Node.parent_id.in_(folder_ids),
            Node.owner_id == owner_id,
            Node.deleted_at.is_(None),
        )
        .cte(name="subtree", recursive=True)
    )

    parent_alias = aliased(anchor)
    subtree = anchor.union_all(
        select(Node.id, parent_alias.c.root_id).where(
            Node.parent_id == parent_alias.c.descendant_id,
            Node.owner_id == owner_id,
            Node.deleted_at.is_(None),
        )
    )

    result = await db.execute(
        select(subtree.c.root_id).where(subtree.c.descendant_id == target_id).limit(1)
    )
    return result.scalar_one_or_none()


def _resolve_unique_name(filename: str, taken: set[str]) -> str:
    if filename not in taken:
        return filename
    path = Path(filename)
    stem, suffix = path.stem, path.suffix
    counter = 1
    while True:
        candidate = f"{stem} ({counter}){suffix}"
        if candidate not in taken:
            return candidate
        counter += 1


async def _fetch_subtree(
    db: AsyncSession,
    owner_id: uuid.UUID,
    root_ids: list[uuid.UUID],
    *,
    include_deleted: bool = False,
) -> list[Node]:
    filters = [Node.owner_id == owner_id]
    if not include_deleted:
        filters.append(Node.deleted_at.is_(None))

    anchor = (
        select(Node)
        .where(Node.id.in_(root_ids), *filters)
        .cte(name="subtree", recursive=True)
    )
    parent_alias = aliased(anchor)
    cte = anchor.union_all(
        select(Node).where(Node.parent_id == parent_alias.c.id, *filters)
    )
    result = await db.execute(select(Node).join(cte, Node.id == cte.c.id))
    return list(result.scalars().all())


def _build_new_storage_path(old_path: str) -> str:
    p = Path(old_path)
    return str(p.parent / f"{uuid.uuid7()}{p.suffix}")


def _stage_files(ops: list[tuple[str, str]], staged: list[str]) -> None:
    """
    Hardlink first (instant, same inode). Fall back to copy if the source and
    destination are on different filesystems. Mutates `staged` so caller can
    clean up on failure.
    """
    for src, dst in ops:
        Path(dst).parent.mkdir(parents=True, exist_ok=True)
        try:
            os.link(src, dst)
        except OSError as exc:
            # EXDEV = cross-device, fall back to real copy
            if exc.errno != 18:  # errno.EXDEV
                raise
            shutil.copy2(src, dst)
        staged.append(dst)


logger = logging.getLogger(__name__)


def _cleanup_files(paths: list[str]) -> None:
    for p in paths:
        try:
            os.unlink(p)
        except FileNotFoundError:
            pass
        except OSError:
            logger.warning(f"failed to cleanup staged file: {p}", exc_info=True)
