import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.node import Node


async def is_descendant(
    db: AsyncSession,
    node_id: uuid.UUID,
    target_id: uuid.UUID,
) -> bool:
    """
    Returns True if target_id is a descendant of node_id
    """
    descendants_cte = (
        select(Node.id)
        .where(Node.parent_id == node_id)
        .cte(name="descendants", recursive=True)
    )

    descendants_alias = aliased(descendants_cte)
    descendants_cte = descendants_cte.union_all(
        select(Node.id).where(Node.parent_id == descendants_alias.c.id)
    )

    result = await db.execute(
        select(descendants_cte.c.id).where(descendants_cte.c.id == target_id)
    )

    return result.scalar_one_or_none() is not None
