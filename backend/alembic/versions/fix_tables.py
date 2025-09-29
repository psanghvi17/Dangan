"""Fix tables

Revision ID: fix_tables
Revises: 38e55f9b1254
Create Date: 2025-09-29 23:25:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'fix_tables'
down_revision = '38e55f9b1254'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create app schema if it doesn't exist
    op.execute("CREATE SCHEMA IF NOT EXISTS app")
    
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('username', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    # Create items table
    op.create_table('items',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_items_id'), 'items', ['id'], unique=False)
    op.create_index(op.f('ix_items_title'), 'items', ['title'], unique=False)

    # Create clients table
    op.create_table('m_client',
        sa.Column('client_id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('client_name', sa.String(), nullable=True),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('contact_email', sa.String(), nullable=True),
        sa.Column('contact_name', sa.String(), nullable=True),
        sa.Column('contact_phone', sa.String(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('created_on', sa.DateTime(timezone=False), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_on', sa.DateTime(timezone=False), nullable=True),
        sa.Column('deleted_on', sa.DateTime(timezone=False), nullable=True),
        sa.Column('deleted_by', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('client_id'),
        schema='app'
    )

    # Create candidates table
    op.create_table('m_candidate',
        sa.Column('candidate_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_on', sa.DateTime(timezone=False), server_default=sa.text('now()'), nullable=True),
        sa.Column('address1', sa.String(), nullable=True),
        sa.Column('address2', sa.String(), nullable=True),
        sa.Column('town', sa.String(), nullable=True),
        sa.Column('county', sa.String(), nullable=True),
        sa.Column('eircode', sa.String(), nullable=True),
        sa.Column('pps_number', sa.String(), nullable=True),
        sa.Column('date_of_birth', sa.Date(), nullable=True),
        sa.Column('bank_account_number', sa.String(), nullable=True),
        sa.Column('bank_name', sa.String(), nullable=True),
        sa.Column('invoice_contact_name', sa.String(), nullable=True),
        sa.Column('invoice_email', sa.String(), nullable=True),
        sa.Column('invoice_phone', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('candidate_id'),
        schema='app'
    )

    # Create timesheet table
    op.create_table('t_timesheet',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('week_label', sa.String(), nullable=False),
        sa.Column('month_label', sa.String(), nullable=False),
        sa.Column('filled_count', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.Column('not_filled_count', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.Column('status', sa.String(), server_default=sa.text("'Open'"), nullable=False),
        sa.Column('created_on', sa.DateTime(timezone=False), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_on', sa.DateTime(timezone=False), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        schema='app'
    )


def downgrade() -> None:
    op.drop_table('t_timesheet', schema='app')
    op.drop_table('m_candidate', schema='app')
    op.drop_table('m_client', schema='app')
    op.drop_index(op.f('ix_items_title'), table_name='items')
    op.drop_index(op.f('ix_items_id'), table_name='items')
    op.drop_table('items')
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
