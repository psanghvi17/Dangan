import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { timesheetsAPI, TimesheetDetailDTO, TimesheetEntryDTO, candidatesAPI, CandidateDTO } from '../services/api';
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

// Helper function to calculate date range for a given week and month
const calculateDateRange = (week: string, month: string): string => {
  if (!week || !month) return '';
  
  try {
    const [monthName, year] = month.split(' ');
    const monthIndex = new Date(Date.parse(monthName + ' 1, 2000')).getMonth();
    const yearNum = parseInt(year);
    
    // Get the first day of the month
    const firstDay = new Date(yearNum, monthIndex, 1);
    
    // Find the first Monday of the month (or before if month doesn't start on Monday)
    const firstMonday = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    firstMonday.setDate(firstDay.getDate() - daysToMonday);
    
    // Calculate which week we want (Week 1, Week 2, etc.)
    const weekNumber = parseInt(week.replace('Week ', ''));
    const weekStart = new Date(firstMonday);
    weekStart.setDate(firstMonday.getDate() + ((weekNumber - 1) * 7));
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const startDate = weekStart.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short' 
    });
    const endDate = weekEnd.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short' 
    });
    
    return `${startDate} - ${endDate}`;
  } catch (error) {
    console.error('Error calculating date range:', error);
    return '';
  }
};

const Timesheet: React.FC = () => {
  const { timesheetId } = useParams<{ timesheetId?: string }>();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'edit'; // Default to edit mode
  const [timesheetData, setTimesheetData] = useState<TimesheetDetailDTO | null>(null);
  const [candidates, setCandidates] = useState<CandidateDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [week, setWeek] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [clientFilter, setClientFilter] = useState('All Client');
  const [candidateFilter, setCandidateFilter] = useState('All Candidate');
  const [showFilled, setShowFilled] = useState<'filled' | 'notfilled' | 'all'>('all');

  // Load candidates and timesheet data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Load candidates
        const candidatesData = await candidatesAPI.list();
        setCandidates(candidatesData);
        
        // Load timesheet data if editing
        if (timesheetId) {
          const data = await timesheetsAPI.getDetail(timesheetId);
          setTimesheetData(data);
          setWeek(data.week || '');
          // Calculate date range from week and month
          const calculatedDateRange = calculateDateRange(data.week || '', data.month || '');
          setDateRange(calculatedDateRange);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timesheetId]);

  const rows = useMemo(() => {
    if (!timesheetData) return [];
    
    const convertedRows = timesheetData.entries.map(convertEntryToRow);
    const filtered = convertedRows.filter((r) => {
      // Filter by filled status
      if (showFilled === 'filled' && !r.filled) return false;
      if (showFilled === 'notfilled' && r.filled) return false;
      
      // Filter by candidate (if not "All Candidate")
      if (candidateFilter !== 'All Candidate') {
        const candidate = candidates.find(c => c.candidate_id === r.code);
        if (!candidate || candidate.invoice_contact_name !== candidateFilter) {
          return false;
        }
      }
      
      return true;
    });
    // Keep alphabetical order by employee name (case-insensitive)
    return filtered.sort((a, b) => a.employee.localeCompare(b.employee, undefined, { sensitivity: 'base' }));
  }, [timesheetData, showFilled, candidateFilter, candidates]);

  // Determine if this is editing an existing timesheet or creating a new one
  const isEditing = Boolean(timesheetId);
  const isViewMode = mode === 'view';
  const pageTitle = isViewMode ? 'View Timesheet' : (isEditing ? 'Edit Timesheet' : 'Create New Timesheet');

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
                <MenuItem value="All Candidate">All Candidate</MenuItem>
                {candidates.map((candidate) => (
                  <MenuItem key={candidate.candidate_id} value={candidate.invoice_contact_name || 'Unknown'}>
                    {candidate.invoice_contact_name || 'Unknown'}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item sx={{ flexGrow: 1 }} />
            <Grid item>
              <Button variant="contained">Upload CSV</Button>
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
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        {isViewMode ? 'View sheet' : 'Edit sheet'}
                      </Typography>
                    </TableCell>
                    {r.hours.map((h, i) => (
                      <TableCell key={i} align="center">
                        {isViewMode ? (
                          <Typography variant="body2" sx={{ textAlign: 'center', minWidth: 60 }}>
                            {h}
                          </Typography>
                        ) : (
                          <TextField
                            size="small"
                            value={h}
                            onChange={(e) => onHourChange(r.id, i, e.target.value)}
                            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', style: { textAlign: 'center', width: 60 } }}
                          />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {!isViewMode && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button variant="contained">Save</Button>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default Timesheet;

