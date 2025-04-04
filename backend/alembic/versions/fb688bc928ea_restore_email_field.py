"""restore_email_field

Revision ID: fb688bc928ea
Revises: ddcca7ee2533
Create Date: 2025-04-01 21:22:13.655296

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fb688bc928ea'
down_revision: Union[str, None] = 'ddcca7ee2533'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('users', sa.Column('email', sa.String(), nullable=False))
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index('ix_users_email', table_name='users')
    op.drop_column('users', 'email')
    # ### end Alembic commands ###
