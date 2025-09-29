import React, { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { timesheetsAPI, TimesheetDetailDTO, TimesheetEntryDTO } from '../services/api';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

interface TimesheetRow {
  id: string;
  employee: string;
  code: string;
  client: string;
  filled: boolean;
  hours: number[]; // 8 columns: Standard, Rate2..Rate7, Holiday, Bank Holiday
}

const hourColumns = [
  'Standard\nHours',
  'Hours\nRate 2',
  'Hours\nRate 3',
  'Hours\nRate 4',
  'Hours\nRate 5',
  'Hours\nRate 6',
  'Holiday\nHours',
  'Bank Holiday\nHours',
];

// Helper function to convert TimesheetEntryDTO to TimesheetRow
const convertEntryToRow = (entry: TimesheetEntryDTO): TimesheetRow => ({
  id: entry.entry_id,
  employee: entry.employee_name,
  code: entry.employee_code,
  client: entry.client_name,
  filled: entry.filled,
  hours: [
    entry.standard_hours,
    entry.rate2_hours,
    entry.rate3_hours,
    entry.rate4_hours,
    entry.rate5_hours,
    entry.rate6_hours,
    entry.holiday_hours,
    entry.bank_holiday_hours,
  ],
});

const Timesheet: React.FC = () => {
  const { timesheetId } = useParams<{ timesheetId?: string }>();
  const [timesheetData, setTimesheetData] = useState<TimesheetDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [week, setWeek] = useState('Week 4');
  const [dateRange, setDateRange] = useState('7th-14th Apr 2025');
  const [clientFilter, setClientFilter] = useState('All Client');
  const [candidateFilter, setCandidateFilter] = useState('All Candidate');
  const [showFilled, setShowFilled] = useState<'filled' | 'notfilled' | 'all'>('all');
  const [editAll, setEditAll] = useState(false);

  // Load timesheet data
  useEffect(() => {
    const fetchTimesheetData = async () => {
      if (timesheetId) {
        try {
          setLoading(true);
          const data = await timesheetsAPI.getDetail(timesheetId);
          setTimesheetData(data);
          setWeek(data.week || 'Week 4');
          setDateRange(data.date_range || '7th-14th Apr 2025');
        } catch (error) {
          console.error('Error fetching timesheet data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchTimesheetData();
  }, [timesheetId]);

  const rows = useMemo(() => {
    if (!timesheetData) return [];
    
    const convertedRows = timesheetData.entries.map(convertEntryToRow);
    return convertedRows.filter((r) => {
      if (showFilled === 'filled') return r.filled;
      if (showFilled === 'notfilled') return !r.filled;
      return true;
    });
  }, [timesheetData, showFilled]);

  // Determine if this is editing an existing timesheet or creating a new one
  const isEditing = Boolean(timesheetId);
  const pageTitle = isEditing ? 'Edit Timesheet' : 'Create New Timesheet';

  const onHourChange = async (rowId: string, colIdx: number, value: string) => {
    const v = value === '' ? 0 : Number(value);
    if (Number.isNaN(v)) return;
    
    // Find the entry to update
    const entry = timesheetData?.entries.find(e => e.entry_id === rowId);
    if (!entry) return;
    
    // Create update object based on column index
    const hourFields = [
      'standard_hours', 'rate2_hours', 'rate3_hours', 'rate4_hours',
      'rate5_hours', 'rate6_hours', 'holiday_hours', 'bank_holiday_hours'
    ];
    
    const updateData = {
      [hourFields[colIdx]]: v
    };
    
    try {
      await timesheetsAPI.updateEntry(rowId, updateData);
      // Refresh data after update
      if (timesheetId) {
        const updatedData = await timesheetsAPI.getDetail(timesheetId);
        setTimesheetData(updatedData);
      }
    } catch (error) {
      console.error('Error updating timesheet entry:', error);
    }
  };

  const FilterButton: React.FC<{ active: boolean; onClick: () => void; label: string }>
    = ({ active, onClick, label }) => (
      <Button
        variant={active ? 'contained' : 'outlined'}
        color={active ? 'primary' : 'inherit'}
        onClick={onClick}
        sx={{ borderRadius: 999 }}
      >
        {label}
      </Button>
    );

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Loading...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {pageTitle}
        </Typography>

        <Paper elevation={0} sx={{ mb: 2, p: 1.5, bgcolor: 'background.default' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Button variant="outlined" sx={{ borderRadius: 999 }}>{week}</Button>
            </Grid>
            <Grid item>
              <Button variant="outlined" sx={{ borderRadius: 999 }}>{dateRange}</Button>
            </Grid>
            <Grid item>
              <TextField select size="small" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
                {['All Client', 'Client'].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item>
              <TextField select size="small" value={candidateFilter} onChange={(e) => setCandidateFilter(e.target.value)}>
                {['All Candidate', 'Candidate'].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item sx={{ flexGrow: 1 }} />
            <Grid item>
              <Button variant="contained">Upload CSV</Button>
            </Grid>
            <Grid item>
              <FormControlLabel control={<Checkbox checked={editAll} onChange={(e) => setEditAll(e.target.checked)} />} label="Edit All" />
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <FilterButton active={showFilled === 'filled'} onClick={() => setShowFilled('filled')} label="Filled" />
          <FilterButton active={showFilled === 'notfilled'} onClick={() => setShowFilled('notfilled')} label="Not Filled" />
        </Box>

        <Paper variant="outlined">
          <TableContainer component={Box}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 320 }}>Employee Details</TableCell>
                  {hourColumns.map((c) => (
                    <TableCell key={c} align="center">
                      <Typography variant="caption" whiteSpace="pre-line">{c}</Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.employee}</Typography>
                      <Typography variant="caption" color="text.secondary">{r.client}</Typography>
                      <Typography variant="caption" sx={{ display: 'block' }}>Edit sheet</Typography>
                    </TableCell>
                    {r.hours.map((h, i) => (
                      <TableCell key={i} align="center">
                        <TextField
                          size="small"
                          value={h}
                          onChange={(e) => onHourChange(r.id, i, e.target.value)}
                          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', style: { textAlign: 'center', width: 60 } }}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button variant="contained">Save</Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Timesheet;

