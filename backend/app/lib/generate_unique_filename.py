import uuid
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Node


async def generate_unique_filename(
    db: AsyncSession,
    owner_id: uuid.UUID,
    parent_id: uuid.UUID | None,
    filename: str,
) -> str:
    path = Path(filename)

    stem = path.stem
    suffix = path.suffix

    query = select(Node.name).where(
        Node.owner_id == owner_id,
        Node.parent_id == parent_id,
        Node.deleted_at.is_(None),
        Node.name.like(f"{stem}%{suffix}"),
    )

    result = await db.execute(query)
    existing_names = set(result.scalars().all())

    if filename not in existing_names:
        return filename

    counter = 1

    while True:
        candidate = f"{stem} ({counter}){suffix}"

        if candidate not in existing_names:
            return candidate

        counter += 1
