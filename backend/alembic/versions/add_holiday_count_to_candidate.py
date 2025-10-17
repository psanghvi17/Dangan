"""add_holiday_count_to_candidate

Revision ID: add_holiday_count_to_candidate
Revises: add_m_constant_table
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_holiday_count_to_candidate'
down_revision = 'add_m_constant_table'
branch_labels = None
depends_on = None


def upgrade():
    # Add holiday_count column to m_candidate table
    op.add_column('m_candidate', sa.Column('holiday_count', sa.Float(), nullable=True, default=0.0), schema='app')


def downgrade():
    # Remove holiday_count column from m_candidate table
    op.drop_column('m_candidate', 'holiday_count', schema='app')
