"""Remove virtual tour columns from properties table

Revision ID: f593e4a39ba6
Revises: 20d7b234b368
Create Date: 2025-04-24 17:50:53.505723

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f593e4a39ba6'
down_revision: Union[str, None] = '20d7b234b368'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
