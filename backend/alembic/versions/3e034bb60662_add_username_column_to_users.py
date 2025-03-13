"""Add username column to users

Revision ID: 3e034bb60662
Revises: 5cd39880f4b3
Create Date: 2025-03-12 23:12:18.231890

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '3e034bb60662'
down_revision: Union[str, None] = '5cd39880f4b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Добавляем новый столбец username как nullable (без NOT NULL)
    op.add_column('users', sa.Column('username', sa.String(), nullable=True))
    
    # 2. Обновляем существующие записи, устанавливая username уникальным значением
    # Здесь, например, устанавливаем username равным email (если email уникален)
    op.execute("UPDATE users SET username = email")
    
    # 3. Изменяем столбец, делая его NOT NULL
    op.alter_column('users', 'username', nullable=False)
    
    # 4. Создаем уникальный индекс на столбец username
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

def downgrade() -> None:
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_column('users', 'username')