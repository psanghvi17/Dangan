"""add timesheet entries table

Revision ID: add_timesheet_entries
Revises: 8b64a60057ef
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_timesheet_entries'
down_revision = '8b64a60057ef'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to existing t_timesheet table
    op.add_column('t_timesheet', sa.Column('week', sa.String(), nullable=True), schema='app')
    op.add_column('t_timesheet', sa.Column('date_range', sa.String(), nullable=True), schema='app')
    
    # Create new t_timesheet_entry table
    op.create_table('t_timesheet_entry',
        sa.Column('entry_id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('timesheet_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('employee_name', sa.String(), nullable=False),
        sa.Column('employee_code', sa.String(), nullable=False),
        sa.Column('client_name', sa.String(), nullable=False),
        sa.Column('filled', sa.Boolean(), nullable=True),
        sa.Column('standard_hours', sa.Float(), nullable=True),
        sa.Column('rate2_hours', sa.Float(), nullable=True),
        sa.Column('rate3_hours', sa.Float(), nullable=True),
        sa.Column('rate4_hours', sa.Float(), nullable=True),
        sa.Column('rate5_hours', sa.Float(), nullable=True),
        sa.Column('rate6_hours', sa.Float(), nullable=True),
        sa.Column('holiday_hours', sa.Float(), nullable=True),
        sa.Column('bank_holiday_hours', sa.Float(), nullable=True),
        sa.Column('created_on', sa.DateTime(timezone=False), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_on', sa.DateTime(timezone=False), nullable=True),
        sa.ForeignKeyConstraint(['timesheet_id'], ['app.t_timesheet.timesheet_id'], ),
        sa.PrimaryKeyConstraint('entry_id'),
        schema='app'
    )


def downgrade():
    op.drop_table('t_timesheet_entry', schema='app')
    op.drop_column('t_timesheet', 'date_range', schema='app')
    op.drop_column('t_timesheet', 'week', schema='app')
