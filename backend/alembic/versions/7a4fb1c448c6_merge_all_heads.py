"""merge_all_heads

Revision ID: 7a4fb1c448c6
Revises: add_cost_center_table, add_holiday_count_to_candidate, add_payroll_tables, add_pcc_id_to_contractor_hours, add_timesheet_entries, change_week_column_to_string
Create Date: 2025-10-18 14:02:53.105112

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7a4fb1c448c6'
down_revision = ('add_cost_center_table', 'add_holiday_count_to_candidate', 'add_payroll_tables', 'add_pcc_id_to_contractor_hours', 'add_timesheet_entries', 'change_week_column_to_string')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
