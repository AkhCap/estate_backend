"""Добавлены роли пользователей

Revision ID: 1ad1a5ca1eb7
Revises: 38f8d1d5f8b5
Create Date: 2025-03-10 21:57:36.583555

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# Определяем ENUM вручную
userroleenum = sa.Enum('PRIVATE', 'AGENT', 'DEVELOPER', name='userroleenum')

# revision identifiers, used by Alembic.
revision = '1ad1a5ca1eb7'
down_revision = '38f8d1d5f8b5'
branch_labels = None
depends_on = None

def upgrade() -> None:
    """Upgrade schema."""
    # ✅ Создаем ENUM перед добавлением колонки
    userroleenum.create(op.get_bind(), checkfirst=True)
    
    # ✅ Добавляем колонку 'role' с ENUM
    op.add_column('users', sa.Column('role', userroleenum, nullable=False, server_default='PRIVATE'))

    # ✅ Исправляем foreign key constraints
    op.drop_constraint('favorites_user_id_fkey', 'favorites', type_='foreignkey')
    op.create_foreign_key('favorites_user_id_fkey', 'favorites', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    
    op.alter_column('properties', 'title', existing_type=sa.VARCHAR(), nullable=False)
    op.drop_constraint('properties_owner_id_fkey', 'properties', type_='foreignkey')
    op.create_foreign_key('properties_owner_id_fkey', 'properties', 'users', ['owner_id'], ['id'], ondelete='CASCADE')
    
    op.drop_constraint('reviews_user_id_fkey', 'reviews', type_='foreignkey')
    op.drop_constraint('reviews_property_id_fkey', 'reviews', type_='foreignkey')
    op.create_foreign_key('reviews_user_id_fkey', 'reviews', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('reviews_property_id_fkey', 'reviews', 'properties', ['property_id'], ['id'], ondelete='CASCADE')

def downgrade() -> None:
    """Downgrade schema."""
    # ✅ Удаляем колонку 'role'
    op.drop_column('users', 'role')
    
    # ✅ Удаляем ENUM
    userroleenum.drop(op.get_bind(), checkfirst=True)
    
    # ✅ Откатываем foreign key constraints
    op.drop_constraint('reviews_user_id_fkey', 'reviews', type_='foreignkey')
    op.drop_constraint('reviews_property_id_fkey', 'reviews', type_='foreignkey')
    op.create_foreign_key('reviews_property_id_fkey', 'reviews', 'properties', ['property_id'], ['id'])
    op.create_foreign_key('reviews_user_id_fkey', 'reviews', 'users', ['user_id'], ['id'])
    
    op.drop_constraint('properties_owner_id_fkey', 'properties', type_='foreignkey')
    op.create_foreign_key('properties_owner_id_fkey', 'properties', 'users', ['owner_id'], ['id'])
    
    op.alter_column('properties', 'title', existing_type=sa.VARCHAR(), nullable=True)
    
    op.drop_constraint('favorites_user_id_fkey', 'favorites', type_='foreignkey')
    op.create_foreign_key('favorites_user_id_fkey', 'favorites', 'users', ['user_id'], ['id'])
