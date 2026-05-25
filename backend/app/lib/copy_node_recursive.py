import shutil
import uuid
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.generate_unique_filename import generate_unique_filename
from app.models import Node, User
from app.models.node import NodeType


async def copy_node_recursive(
    db: AsyncSession,
    current_user: User,
    node: Node,
    target_parent_id: uuid.UUID | None,
):
    resolved_name = await generate_unique_filename(
        db=db,
        owner_id=current_user.id,
        parent_id=target_parent_id,
        filename=node.name,
    )

    new_storage_path = None

    # duplicate physical file
    if node.type == NodeType.FILE and node.storage_path:
        old_path = Path(node.storage_path)

        extension = old_path.suffix

        new_filename = f"{uuid.uuid7()}{extension}"

        new_storage_path = str(old_path.parent / new_filename)

        shutil.copy2(
            node.storage_path,
            new_storage_path,
        )

    copied_node = Node(
        name=resolved_name,
        type=node.type,
        parent_id=target_parent_id,
        owner_id=current_user.id,
        size=node.size,
        mime_type=node.mime_type,
        storage_path=new_storage_path,
        preview_url=node.preview_url,
        preview_status=node.preview_status,
    )

    db.add(copied_node)

    await db.flush()

    # recursively copy folder children
    if node.type == NodeType.FOLDER:
        children_query = select(Node).where(
            Node.parent_id == node.id,
            Node.owner_id == current_user.id,
            Node.deleted_at.is_(None),
        )

        children_result = await db.execute(children_query)
        children = children_result.scalars().all()

        for child in children:
            await copy_node_recursive(
                db=db,
                current_user=current_user,
                node=child,
                target_parent_id=copied_node.id,
            )

    return copied_node
