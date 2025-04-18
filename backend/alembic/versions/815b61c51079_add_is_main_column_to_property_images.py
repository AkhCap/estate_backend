"""add is_main column to property_images

Revision ID: 815b61c51079
Revises: 45c2358caab2
Create Date: 2025-04-15 21:20:57.829708

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '815b61c51079'
down_revision: Union[str, None] = '45c2358caab2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('property_images', sa.Column('is_main', sa.Boolean(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('property_images', 'is_main')
    # ### end Alembic commands ###
