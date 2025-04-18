"""initial chat migration

Revision ID: 8415133250d0
Revises: 
Create Date: 2025-04-15 20:33:21.911815

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '8415133250d0'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('chats',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('property_id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.Column('is_archived', sa.Boolean(), nullable=True),
    sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_chats_id'), 'chats', ['id'], unique=False)
    op.create_table('chat_participants',
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('chat_id', sa.String(), nullable=False),
    sa.Column('joined_at', sa.DateTime(), nullable=True),
    sa.Column('last_read_at', sa.DateTime(), nullable=True),
    sa.Column('is_muted', sa.Boolean(), nullable=True),
    sa.ForeignKeyConstraint(['chat_id'], ['chats.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('user_id', 'chat_id')
    )
    op.create_table('messages',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('chat_id', sa.String(), nullable=False),
    sa.Column('sender_id', sa.Integer(), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('is_read', sa.Boolean(), nullable=True),
    sa.Column('attachments', sa.JSON(), nullable=True),
    sa.ForeignKeyConstraint(['chat_id'], ['chats.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_messages_id'), 'messages', ['id'], unique=False)
    op.drop_index('ix_history_id', table_name='history')
    op.drop_table('history')
    op.drop_index('ix_price_history_id', table_name='price_history')
    op.drop_table('price_history')
    op.drop_index('ix_property_images_id', table_name='property_images')
    op.drop_table('property_images')
    op.drop_index('ix_property_views_id', table_name='property_views')
    op.drop_table('property_views')
    op.drop_index('ix_user_reviews_id', table_name='user_reviews')
    op.drop_table('user_reviews')
    op.drop_index('ix_favorites_id', table_name='favorites')
    op.drop_table('favorites')
    op.drop_column('properties', 'connectivity')
    op.drop_column('properties', 'prepayment')
    op.drop_column('properties', 'area')
    op.drop_column('properties', 'bath_type')
    op.drop_column('properties', 'lifts_passenger')
    op.drop_column('properties', 'landlord_contact')
    op.drop_column('properties', 'furniture')
    op.drop_column('properties', 'contact_method')
    op.drop_column('properties', 'deal_type')
    op.drop_column('properties', 'bathroom')
    op.drop_column('properties', 'window_view')
    op.drop_column('properties', 'has_balcony')
    op.drop_column('properties', 'latitude')
    op.drop_column('properties', 'longitude')
    op.drop_column('properties', 'appliances')
    op.drop_column('properties', 'who_rents')
    op.drop_column('properties', 'total_floors')
    op.drop_column('properties', 'ceiling_height')
    op.drop_column('properties', 'property_type')
    op.drop_column('properties', 'floor')
    op.drop_column('properties', 'image_url')
    op.drop_column('properties', 'renovation')
    op.drop_column('properties', 'deposit')
    op.drop_column('properties', 'heating')
    op.drop_column('properties', 'lifts_freight')
    op.drop_column('properties', 'property_condition')
    op.drop_column('properties', 'rooms')
    op.drop_column('properties', 'build_year')
    op.drop_column('properties', 'living_conditions')
    op.drop_column('properties', 'parking')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('properties', sa.Column('parking', postgresql.ARRAY(sa.VARCHAR()), autoincrement=False, nullable=True))
    op.add_column('properties', sa.Column('living_conditions', postgresql.ARRAY(sa.VARCHAR()), autoincrement=False, nullable=True))
    op.add_column('properties', sa.Column('build_year', sa.INTEGER(), autoincrement=False, nullable=True))
    op.add_column('properties', sa.Column('rooms', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('properties', sa.Column('property_condition', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('properties', sa.Column('lifts_freight', sa.INTEGER(), autoincrement=False, nullable=True))
    op.add_column('properties', sa.Column('heating', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('properties', sa.Column('deposit', sa.DOUBLE_PRECISION(precision=53), autoincrement=False, nullable=True))
    op.add_column('properties', sa.Column('renovation', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('properties', sa.Column('image_url', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('properties', sa.Column('floor', sa.INTEGER(), autoincrement=False, nullable=True))
    op.add_column('properties', sa.Column('property_type', sa.VARCHAR(), autoincrement=False, nullable=False))
    op.add_column('properties', sa.Column('ceiling_height', sa.DOUBLE_PRECISION(precision=53), autoincrement=False, nullable=True))
    op.add_column('properties', sa.Column('total_floors', sa.INTEGER(), autoincrement=False, nullable=True))
    op.add_column('properties', sa.Column('who_rents', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('properties', sa.Column('appliances', postgresql.ARRAY(sa.VARCHAR()), autoincrement=False, nullable=True))
    op.add_column('properties', sa.Column('longitude', sa.DOUBLE_PRECISION(precision=53), autoincrement=False, nullable=True))
    op.add_column('properties', sa.Column('latitude', sa.DOUBLE_PRECISION(precision=53), autoincrement=False, nullable=True))
    op.add_column('properties', sa.Column('has_balcony', sa.BOOLEAN(), autoincrement=False, nullable=True))
    op.add_column('properties', sa.Column('window_view', postgresql.ARRAY(sa.VARCHAR()), autoincrement=False, nullable=True))
    op.add_column('properties', sa.Column('bathroom', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('properties', sa.Column('deal_type', postgresql.ENUM('SALE', 'RENT', name='deal_type_enum'), autoincrement=False, nullable=False))
    op.add_column('properties', sa.Column('contact_method', postgresql.JSON(astext_type=sa.Text()), autoincrement=False, nullable=True))
    op.add_column('properties', sa.Column('furniture', postgresql.ARRAY(sa.VARCHAR()), autoincrement=False, nullable=True))
    op.add_column('properties', sa.Column('landlord_contact', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('properties', sa.Column('lifts_passenger', sa.INTEGER(), autoincrement=False, nullable=True))
    op.add_column('properties', sa.Column('bath_type', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('properties', sa.Column('area', sa.DOUBLE_PRECISION(precision=53), autoincrement=False, nullable=True))
    op.add_column('properties', sa.Column('prepayment', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('properties', sa.Column('connectivity', postgresql.ARRAY(sa.VARCHAR()), autoincrement=False, nullable=True))
    op.create_table('favorites',
    sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('property_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('created_at', postgresql.TIMESTAMP(), server_default=sa.text('now()'), autoincrement=False, nullable=True),
    sa.ForeignKeyConstraint(['property_id'], ['properties.id'], name='favorites_property_id_fkey', ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='favorites_user_id_fkey', ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name='favorites_pkey')
    )
    op.create_index('ix_favorites_id', 'favorites', ['id'], unique=False)
    op.create_table('user_reviews',
    sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('reviewer_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('reviewed_user_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('rating', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('comment', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('created_at', postgresql.TIMESTAMP(), server_default=sa.text('now()'), autoincrement=False, nullable=True),
    sa.Column('updated_at', postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
    sa.ForeignKeyConstraint(['reviewed_user_id'], ['users.id'], name='user_reviews_reviewed_user_id_fkey', ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['reviewer_id'], ['users.id'], name='user_reviews_reviewer_id_fkey', ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name='user_reviews_pkey'),
    sa.UniqueConstraint('reviewer_id', 'reviewed_user_id', name='unique_user_review')
    )
    op.create_index('ix_user_reviews_id', 'user_reviews', ['id'], unique=False)
    op.create_table('property_views',
    sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('property_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('viewed_at', postgresql.TIMESTAMP(), server_default=sa.text('now()'), autoincrement=False, nullable=True),
    sa.ForeignKeyConstraint(['property_id'], ['properties.id'], name='property_views_property_id_fkey', ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='property_views_user_id_fkey', ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name='property_views_pkey')
    )
    op.create_index('ix_property_views_id', 'property_views', ['id'], unique=False)
    op.create_table('property_images',
    sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('property_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('image_url', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('uploaded_at', postgresql.TIMESTAMP(), server_default=sa.text('now()'), autoincrement=False, nullable=True),
    sa.ForeignKeyConstraint(['property_id'], ['properties.id'], name='property_images_property_id_fkey', ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name='property_images_pkey')
    )
    op.create_index('ix_property_images_id', 'property_images', ['id'], unique=False)
    op.create_table('price_history',
    sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('property_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('price', sa.DOUBLE_PRECISION(precision=53), autoincrement=False, nullable=False),
    sa.Column('change_date', postgresql.TIMESTAMP(), server_default=sa.text('now()'), autoincrement=False, nullable=True),
    sa.ForeignKeyConstraint(['property_id'], ['properties.id'], name='price_history_property_id_fkey', ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name='price_history_pkey')
    )
    op.create_index('ix_price_history_id', 'price_history', ['id'], unique=False)
    op.create_table('history',
    sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('property_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('viewed_at', postgresql.TIMESTAMP(), server_default=sa.text('now()'), autoincrement=False, nullable=True),
    sa.ForeignKeyConstraint(['property_id'], ['properties.id'], name='history_property_id_fkey', ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='history_user_id_fkey', ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name='history_pkey')
    )
    op.create_index('ix_history_id', 'history', ['id'], unique=False)
    op.drop_index(op.f('ix_messages_id'), table_name='messages')
    op.drop_table('messages')
    op.drop_table('chat_participants')
    op.drop_index(op.f('ix_chats_id'), table_name='chats')
    op.drop_table('chats')
    # ### end Alembic commands ###
