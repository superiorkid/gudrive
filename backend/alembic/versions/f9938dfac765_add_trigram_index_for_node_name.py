"""add trigram index for node name

Revision ID: f9938dfac765
Revises: 46ae97f6a68a
Create Date: 2026-05-14 17:27:04.303593

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f9938dfac765"
down_revision: Union[str, Sequence[str], None] = "46ae97f6a68a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")
    op.execute("""
        CREATE INDEX idx_nodes_name_trgm
        ON nodes USING gin (name gin_trgm_ops);
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_nodes_name_trgm;")
