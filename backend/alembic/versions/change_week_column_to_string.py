"""change week column to string

Revision ID: change_week_column_to_string
Revises: add_m_constant_table
Create Date: 2025-01-27 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'change_week_column_to_string'
down_revision = 'add_m_constant_table'
branch_labels = None
depends_on = None


def upgrade():
    # Change week column from Integer to String in t_contractor_hours table
    op.alter_column('t_contractor_hours', 'week',
                    existing_type=sa.Integer(),
                    type_=sa.String(),
                    schema='app')


def downgrade():
    # Change week column back from String to Integer in t_contractor_hours table
    op.alter_column('t_contractor_hours', 'week',
                    existing_type=sa.String(),
                    type_=sa.Integer(),
                    schema='app')
