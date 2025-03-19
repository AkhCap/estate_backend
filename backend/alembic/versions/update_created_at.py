"""update created_at for existing properties

Revision ID: update_created_at
Revises: 82dd5a408a17
Create Date: 2024-03-19 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic.
revision = 'update_created_at_123'
down_revision = '82dd5a408a17'
branch_labels = None
depends_on = None


def upgrade():
    # Используем raw SQL для обновления существующих записей
    op.execute("""
        UPDATE properties 
        SET created_at = NOW() 
        WHERE created_at IS NULL
    """)


def downgrade():
    pass 