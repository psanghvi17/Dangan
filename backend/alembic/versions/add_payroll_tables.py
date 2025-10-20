"""Add payroll tables

Revision ID: add_payroll_tables
Revises: add_m_constant_table
Create Date: 2025-01-27 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_payroll_tables'
down_revision = 'add_m_constant_table'
branch_labels = None
depends_on = None


def upgrade():
    # Create payroll period table
    op.create_table('t_payroll_period',
        sa.Column('period_id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('period_name', sa.String(), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(), nullable=True, default='draft'),
        sa.Column('created_on', sa.DateTime(timezone=False), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_on', sa.DateTime(timezone=False), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('processed_on', sa.DateTime(timezone=False), nullable=True),
        sa.Column('processed_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['app.m_user.user_id'], ),
        sa.ForeignKeyConstraint(['processed_by'], ['app.m_user.user_id'], ),
        sa.ForeignKeyConstraint(['updated_by'], ['app.m_user.user_id'], ),
        sa.PrimaryKeyConstraint('period_id'),
        schema='app'
    )

    # Create payroll run table
    op.create_table('t_payroll_run',
        sa.Column('run_id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('period_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('contractor_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('total_hours', sa.Float(), nullable=True, default=0.0),
        sa.Column('standard_hours', sa.Float(), nullable=True, default=0.0),
        sa.Column('overtime_hours', sa.Float(), nullable=True, default=0.0),
        sa.Column('holiday_hours', sa.Float(), nullable=True, default=0.0),
        sa.Column('bank_holiday_hours', sa.Float(), nullable=True, default=0.0),
        sa.Column('weekend_hours', sa.Float(), nullable=True, default=0.0),
        sa.Column('oncall_hours', sa.Float(), nullable=True, default=0.0),
        sa.Column('standard_pay', sa.Float(), nullable=True, default=0.0),
        sa.Column('overtime_pay', sa.Float(), nullable=True, default=0.0),
        sa.Column('holiday_pay', sa.Float(), nullable=True, default=0.0),
        sa.Column('bank_holiday_pay', sa.Float(), nullable=True, default=0.0),
        sa.Column('weekend_pay', sa.Float(), nullable=True, default=0.0),
        sa.Column('oncall_pay', sa.Float(), nullable=True, default=0.0),
        sa.Column('gross_pay', sa.Float(), nullable=True, default=0.0),
        sa.Column('tax_deduction', sa.Float(), nullable=True, default=0.0),
        sa.Column('prsi_deduction', sa.Float(), nullable=True, default=0.0),
        sa.Column('usc_deduction', sa.Float(), nullable=True, default=0.0),
        sa.Column('pension_deduction', sa.Float(), nullable=True, default=0.0),
        sa.Column('other_deductions', sa.Float(), nullable=True, default=0.0),
        sa.Column('total_deductions', sa.Float(), nullable=True, default=0.0),
        sa.Column('net_pay', sa.Float(), nullable=True, default=0.0),
        sa.Column('status', sa.String(), nullable=True, default='pending'),
        sa.Column('created_on', sa.DateTime(timezone=False), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_on', sa.DateTime(timezone=False), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('approved_on', sa.DateTime(timezone=False), nullable=True),
        sa.Column('approved_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('paid_on', sa.DateTime(timezone=False), nullable=True),
        sa.Column('paid_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(['approved_by'], ['app.m_user.user_id'], ),
        sa.ForeignKeyConstraint(['contractor_id'], ['app.m_user.user_id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['app.m_user.user_id'], ),
        sa.ForeignKeyConstraint(['paid_by'], ['app.m_user.user_id'], ),
        sa.ForeignKeyConstraint(['period_id'], ['app.t_payroll_period.period_id'], ),
        sa.ForeignKeyConstraint(['updated_by'], ['app.m_user.user_id'], ),
        sa.PrimaryKeyConstraint('run_id'),
        schema='app'
    )

    # Create payroll deduction table
    op.create_table('m_payroll_deduction',
        sa.Column('deduction_id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('deduction_name', sa.String(), nullable=False),
        sa.Column('deduction_type', sa.String(), nullable=False),
        sa.Column('is_percentage', sa.Boolean(), nullable=True, default=False),
        sa.Column('percentage_rate', sa.Float(), nullable=True),
        sa.Column('fixed_amount', sa.Float(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('created_on', sa.DateTime(timezone=False), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_on', sa.DateTime(timezone=False), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['app.m_user.user_id'], ),
        sa.ForeignKeyConstraint(['updated_by'], ['app.m_user.user_id'], ),
        sa.PrimaryKeyConstraint('deduction_id'),
        schema='app'
    )

    # Create payroll summary table
    op.create_table('t_payroll_summary',
        sa.Column('summary_id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('period_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('total_contractors', sa.Integer(), nullable=True, default=0),
        sa.Column('total_hours', sa.Float(), nullable=True, default=0.0),
        sa.Column('total_gross_pay', sa.Float(), nullable=True, default=0.0),
        sa.Column('total_deductions', sa.Float(), nullable=True, default=0.0),
        sa.Column('total_net_pay', sa.Float(), nullable=True, default=0.0),
        sa.Column('total_tax', sa.Float(), nullable=True, default=0.0),
        sa.Column('total_prsi', sa.Float(), nullable=True, default=0.0),
        sa.Column('total_usc', sa.Float(), nullable=True, default=0.0),
        sa.Column('created_on', sa.DateTime(timezone=False), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_on', sa.DateTime(timezone=False), nullable=True),
        sa.ForeignKeyConstraint(['period_id'], ['app.t_payroll_period.period_id'], ),
        sa.PrimaryKeyConstraint('summary_id'),
        schema='app'
    )


def downgrade():
    op.drop_table('t_payroll_summary', schema='app')
    op.drop_table('m_payroll_deduction', schema='app')
    op.drop_table('t_payroll_run', schema='app')
    op.drop_table('t_payroll_period', schema='app')
