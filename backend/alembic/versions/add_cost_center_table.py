"""add_cost_center_table

Revision ID: add_cost_center_table
Revises: 8b64a60057ef
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_cost_center_table'
down_revision = '8b64a60057ef'
branch_labels = None
depends_on = None


def upgrade():
    # Create the cost center table
    op.create_table('t_cost_center',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('client_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('cc_name', sa.VARCHAR(), nullable=True),
        sa.Column('cc_number', sa.VARCHAR(), nullable=True),
        sa.Column('cc_address', sa.TEXT(), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_on', sa.TIMESTAMP(), nullable=True),
        sa.Column('deleted_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('deleted_on', sa.TIMESTAMP(), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_on', sa.TIMESTAMP(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['client_id'], ['app.m_client.client_id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['app.m_user.user_id'], ),
        sa.ForeignKeyConstraint(['deleted_by'], ['app.m_user.user_id'], ),
        sa.ForeignKeyConstraint(['updated_by'], ['app.m_user.user_id'], ),
        sa.PrimaryKeyConstraint('id'),
        schema='app'
    )


def downgrade():
    # Drop the cost center table
    op.drop_table('t_cost_center', schema='app')
