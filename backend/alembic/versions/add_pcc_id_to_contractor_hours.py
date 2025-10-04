"""add pcc_id to contractor hours

Revision ID: add_pcc_id_to_contractor_hours
Revises: fix_tables
Create Date: 2025-01-27 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_pcc_id_to_contractor_hours'
down_revision = 'fix_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add pcc_id column to t_contractor_hours table
    op.add_column('t_contractor_hours', 
                  sa.Column('pcc_id', postgresql.UUID(as_uuid=True), nullable=True), 
                  schema='app')
    
    # Add foreign key constraint
    op.create_foreign_key('fk_contractor_hours_pcc_id', 
                         't_contractor_hours', 'p_candidate_client', 
                         ['pcc_id'], ['pcc_id'], 
                         source_schema='app', referent_schema='app')


def downgrade() -> None:
    # Drop foreign key constraint
    op.drop_constraint('fk_contractor_hours_pcc_id', 't_contractor_hours', schema='app')
    
    # Drop pcc_id column
    op.drop_column('t_contractor_hours', 'pcc_id', schema='app')
