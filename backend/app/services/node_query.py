from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import asc, case, desc, or_

from app.models.node import Node, NodeType


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


def apply_modified_filter(query, modified: str):
    now = datetime.now(timezone.utc)

    if modified == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=1)
        return query.where(Node.updated_at >= start, Node.updated_at < end)

    if modified == "last-7-days":
        start = now - timedelta(days=7)
        return query.where(Node.updated_at >= start)

    if modified == "last-30-days":
        start = now - timedelta(days=30)
        return query.where(Node.updated_at >= start)

    if modified.isdigit() and len(modified) == 4:
        year = int(modified)
        start = datetime(year, 1, 1, tzinfo=timezone.utc)
        end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
        return query.where(Node.updated_at >= start, Node.updated_at < end)

    if "~" in modified:
        from_str, to_str = modified.split("~")
        start = datetime.fromisoformat(from_str).replace(tzinfo=timezone.utc)

        if to_str:
            end = datetime.fromisoformat(to_str).replace(
                tzinfo=timezone.utc
            ) + timedelta(days=1)
            return query.where(Node.updated_at >= start, Node.updated_at < end)

        return query.where(Node.updated_at >= start)

    return query


def normalize_sort(sort_by: str, sort_direction: str, folder_group: str):
    sort_by = (
        sort_by if sort_by in {"name", "date-modified", "date-trashed"} else "name"
    )
    sort_direction = sort_direction if sort_direction in {"asc", "desc"} else "asc"
    folder_group = folder_group if folder_group in {"top", "mixed"} else "top"

    return sort_by, sort_direction, folder_group


def apply_sort(
    query,
    sort_by: str,
    sort_direction: str,
    folder_group: str,
    type: Optional[str],
    status: Optional[str],
):
    direction = asc if sort_direction == "asc" else desc

    if status == "trashed":
        folder_group = "mixed"

    if sort_by == "name":
        primary_sort = direction(Node.name)
    elif sort_by == "date-modified":
        primary_sort = direction(Node.updated_at)
    elif sort_by == "date-trashed":
        primary_sort = direction(Node.deleted_at)
    else:
        primary_sort = asc(Node.name)

    if type and type != "folders" and folder_group == "top":
        folder_group = "mixed"

    if folder_group == "top":
        folder_order = case(
            (Node.type == NodeType.FOLDER, 0),
            else_=1,
        )
        return query.order_by(folder_order, primary_sort)

    return query.order_by(primary_sort)


def apply_status_filter(query, status: str):
    if status == "active":
        return query.where(Node.deleted_at.is_(None))
    elif status == "trashed":
        return query.where(Node.deleted_at.is_not(None))
    return query
