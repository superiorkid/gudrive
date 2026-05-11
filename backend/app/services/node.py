import uuid
from typing import Optional

from sqlalchemy import asc, case, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import BadRequestException, NotFoundException
from app.models.node import Node, NodeType
from app.models.user import User


def apply_file_filter(query, type: str):
    if type == "folders":
        return query.where(Node.type == NodeType.FOLDER)

    if type == "documents":
        return query.where(Node.mime_type.like("application/%"))

    if type == "images":
        return query.where(Node.mime_type.like("image/%"))

    if type == "videos":
        return query.where(Node.mime_type.like("video/%"))

    if type == "audios":
        return query.where(Node.mime_type.like("audio/%"))

    if type == "pdfs":
        return query.where(Node.mime_type == "application/pdf")

    if type == "spreadsheets":
        return query.where(
            or_(
                Node.mime_type.like("application/vnd.ms-excel%"),
                Node.mime_type.like(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml%"
                ),
            )
        )

    if type == "presentations":
        return query.where(
            Node.mime_type.like(
                "application/vnd.openxmlformats-officedocument.presentationml%"
            )
        )

    if type == "archives":
        return query.where(
            or_(
                Node.mime_type.like("application/zip%"),
                Node.mime_type.like("application/x-rar%"),
            )
        )

    return query


async def get_nodes_service(
    db: AsyncSession,
    current_user: User,
    parent_id: Optional[uuid.UUID],
    type: Optional[str],
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

    query = query.order_by(
        case((Node.type == NodeType.FOLDER, 0), else_=1), asc(Node.name)
    )

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
