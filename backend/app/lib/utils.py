import errno
import logging
import os
import re
import shutil
import uuid
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models import Node

logger = logging.getLogger(__name__)


async def _find_descendant_conflict(
    db: AsyncSession,
    owner_id: uuid.UUID,
    folder_ids: list[uuid.UUID],
    target_id: uuid.UUID,
) -> uuid.UUID | None:
    """
    Walks UP from target_id via parent_id. Returns the first ancestor that
    appears in folder_ids, else None. O(tree depth), not O(subtree size).
    """
    if not folder_ids:
        return None

    folder_set = set(folder_ids)

    # Recurse upward: anchor = target itself, step = parent of current.
    anchor = (
        select(
            Node.id.label("node_id"),
            Node.parent_id.label("parent_id"),
        )
        .where(
            Node.id == target_id,
            Node.owner_id == owner_id,
            Node.deleted_at.is_(None),
        )
        .cte(name="ancestors", recursive=True)
    )

    cte = anchor.union_all(
        select(Node.id, Node.parent_id).where(
            Node.id == anchor.c.parent_id,
            Node.owner_id == owner_id,
            Node.deleted_at.is_(None),
        )
    )

    # Pull the ancestor chain (small) and intersect in Python. Avoids a second
    # round-trip and lets us preserve "closest ancestor" semantics if needed.
    result = await db.execute(select(cte.c.node_id))
    for (node_id,) in result.all():
        if node_id in folder_set and node_id != target_id:
            return node_id
    return None


async def _fetch_subtree(
    db: AsyncSession,
    owner_id: uuid.UUID,
    root_ids: list[uuid.UUID],
    *,
    include_deleted: bool = False,
) -> list[Node]:
    """
    Two-phase: recurse on (id) only to collect the id set, then one bulk
    fetch. Keeps the recursive working table tiny.
    """
    if not root_ids:
        return []

    filters = [Node.owner_id == owner_id]
    if not include_deleted:
        filters.append(Node.deleted_at.is_(None))

    anchor = (
        select(Node.id.label("id"))
        .where(Node.id.in_(root_ids), *filters)
        .cte(name="subtree_ids", recursive=True)
    )

    cte = anchor.union_all(
        select(Node.id).where(Node.parent_id == anchor.c.id, *filters)
    )

    result = await db.execute(
        select(Node).where(Node.id.in_(select(cte.c.id)), *filters)
    )
    return list(result.scalars().all())


_NUMBERED_RE = re.compile(r"^(?P<stem>.*) \((?P<n>\d+)\)$")


def _resolve_unique_name(filename: str, taken: set[str]) -> str:
    """
    O(len(taken)) worst case but skips ahead past existing 'name (k).ext'
    siblings instead of probing 1..k linearly.
    """
    if filename not in taken:
        return filename

    path = Path(filename)
    stem, suffix = path.stem, path.suffix

    # Find the highest existing counter for this stem+suffix in `taken`.
    max_n = 0
    for name in taken:
        p = Path(name)
        if p.suffix != suffix:
            continue
        m = _NUMBERED_RE.match(p.stem)
        if m and m.group("stem") == stem:
            n = int(m.group("n"))
            if n > max_n:
                max_n = n
        elif p.stem == stem:
            max_n = max(max_n, 0)

    counter = max_n + 1
    while True:
        candidate = f"{stem} ({counter}){suffix}"
        if candidate not in taken:
            return candidate
        counter += 1


def _build_new_storage_path(old_path: str) -> str:
    p = Path(old_path)
    return f"{p.parent}{os.sep}{uuid.uuid7()}{p.suffix}"


def _stage_files(ops: list[tuple[str, str]], staged: list[str]) -> None:
    """
    Hardlink first; fall back to copy across filesystems. Caches created
    parent dirs to skip redundant mkdir syscalls on bulk operations.
    """
    made_dirs: set[str] = set()
    for src, dst in ops:
        parent = os.path.dirname(dst)
        if parent and parent not in made_dirs:
            os.makedirs(parent, exist_ok=True)
            made_dirs.add(parent)
        try:
            os.link(src, dst)
        except OSError as exc:
            if exc.errno != errno.EXDEV:
                raise
            shutil.copy2(src, dst)
        staged.append(dst)


def _cleanup_files(paths: list[str]) -> None:
    for p in paths:
        try:
            os.unlink(p)
        except FileNotFoundError:
            pass
        except OSError:
            logger.warning("failed to cleanup staged file: %s", p, exc_info=True)
