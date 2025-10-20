"""add address to client

Revision ID: add_address_to_client
Revises: 8b64a60057ef
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_address_to_client'
down_revision = '8b64a60057ef'
branch_labels = None
depends_on = None


def upgrade():
    # Add address column to m_client table
    op.add_column('m_client', sa.Column('address', sa.String(), nullable=True), schema='app')


def downgrade():
    # Remove address column from m_client table
    op.drop_column('m_client', 'address', schema='app')
