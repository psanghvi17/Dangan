"""add m_constant table

Revision ID: add_m_constant_table
Revises: fix_tables
Create Date: 2025-01-27 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_m_constant_table'
down_revision = 'fix_tables'
branch_labels = None
depends_on = None


def upgrade():
    # Create m_constant table
    op.create_table('m_constant',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('constant', sa.String(), nullable=False),
        sa.Column('use_for', sa.String(), nullable=False),
        sa.Column('created_on', sa.DateTime(timezone=False), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_on', sa.DateTime(timezone=False), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['app.m_user.user_id'], ),
        sa.ForeignKeyConstraint(['updated_by'], ['app.m_user.user_id'], ),
        sa.PrimaryKeyConstraint('id'),
        schema='app'
    )
    
    # Insert the initial invoice number constant
    op.execute("""
        INSERT INTO app.m_constant (id, constant, use_for)
        VALUES (1, '1200000', 'Sales');
    """)


def downgrade():
    # Drop m_constant table
    op.drop_table('m_constant', schema='app')
