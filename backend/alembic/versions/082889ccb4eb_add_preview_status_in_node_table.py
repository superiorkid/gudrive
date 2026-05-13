"""add preview_status in node table

Revision ID: 082889ccb4eb
Revises: 88af978a3489
Create Date: 2026-05-13 11:22:50.025952

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "082889ccb4eb"
down_revision: Union[str, Sequence[str], None] = "88af978a3489"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

preview_status_enum = sa.Enum(
    "PENDING", "PROCESSING", "READY", "FAILED", name="previewstatus"
)


def upgrade() -> None:
    preview_status_enum.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "nodes",
        sa.Column(
            "preview_status",
            preview_status_enum,
            nullable=False,
            server_default="PENDING",
        ),
    )

    op.alter_column("nodes", "preview_status", server_default=None)


def downgrade() -> None:
    op.drop_column("nodes", "preview_status")

    preview_status_enum.drop(op.get_bind(), checkfirst=True)
