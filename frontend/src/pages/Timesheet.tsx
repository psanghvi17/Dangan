import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { timesheetsAPI, TimesheetDetailDTO, TimesheetEntryDTO, candidatesAPI, CandidateDTO, ContractRateOutDTO } from '../services/api';
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
  hours: number[]; // Dynamic: Standard, Rate columns based on contract rates, Holiday, Bank Holiday
  contractRates?: ContractRateOutDTO[]; // Store contract rates for this row
}

// Dynamic hour columns will be generated based on contract rates
const getHourColumns = (rates: ContractRateOutDTO[]): string[] => {
  const columns = ['Standard\nHours'];
  
  // Add rate columns based on contract rates
  rates.forEach((rate, index) => {
    columns.push(`Hours\nRate ${index + 2}`);
  });
  
  // Always add holiday columns at the end
  columns.push('Holiday\nHours', 'Bank Holiday\nHours');
  
  return columns;
};

// Helper function to convert TimesheetEntryDTO to TimesheetRow
const convertEntryToRow = (entry: TimesheetEntryDTO, contractRates: ContractRateOutDTO[] = []): TimesheetRow => {
  const hours = [entry.standard_hours];
  
  // Add rate hours based on contract rates (up to 6 rate columns as per current structure)
  const rateHours = [
    entry.rate2_hours,
    entry.rate3_hours,
    entry.rate4_hours,
    entry.rate5_hours,
    entry.rate6_hours,
  ];
  
  // Add rate hours for the number of contract rates (up to 6)
  for (let i = 0; i < Math.min(contractRates.length, 6); i++) {
    hours.push(rateHours[i] || 0);
  }
  
  // Always add holiday hours at the end
  hours.push(entry.holiday_hours, entry.bank_holiday_hours);
  
  return {
    id: entry.entry_id,
    employee: entry.employee_name,
    code: entry.employee_code,
    client: entry.client_name,
    filled: entry.filled,
    hours,
  };
};

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
  const [contractRates, setContractRates] = useState<Map<string, ContractRateOutDTO[]>>(new Map());
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
        const candidatesData = await candidatesAPI.listAll();
        setCandidates(candidatesData);
        
        // Load timesheet data if editing
        if (timesheetId) {
          const data = await timesheetsAPI.getDetail(timesheetId);
          setTimesheetData(data);
          setWeek(data.week || '');
          // Calculate date range from week and month
          const calculatedDateRange = calculateDateRange(data.week || '', data.month || '');
          setDateRange(calculatedDateRange);
          
          // For now, we'll use a simplified approach since we don't have client_id in timesheet entries
          // We'll fetch contract rates for each candidate using their first available client relationship
          const ratesMap = new Map<string, ContractRateOutDTO[]>();
          const uniqueCandidates = new Set<string>();
          
          // Get unique candidates from timesheet entries
          data.entries.forEach(entry => {
            const candidate = candidatesData.find(c => c.candidate_id === entry.employee_code);
            if (candidate) {
              uniqueCandidates.add(candidate.candidate_id);
            }
          });
          
          // For each candidate, try to get their contract rates
          // Since we don't have client_id in the timesheet entries, we'll use a placeholder approach
          // This is a temporary solution - in a real implementation, you'd need to modify the backend
          // to either include client_id in timesheet entries or create a new API endpoint
          Array.from(uniqueCandidates).forEach(candidateId => {
            try {
              // For now, we'll use an empty array as we don't have client_id
              // In a real implementation, you'd need to:
              // 1. Add client_id to timesheet entries, or
              // 2. Create a new API endpoint to get all contract rates for a candidate, or
              // 3. Modify the existing API to work without client_id
              ratesMap.set(candidateId, []);
            } catch (error) {
              console.error(`Error fetching rates for candidate ${candidateId}:`, error);
              ratesMap.set(candidateId, []);
            }
          });
          
          setContractRates(ratesMap);
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
    
    const convertedRows = timesheetData.entries.map(entry => {
      const candidate = candidates.find(c => c.candidate_id === entry.employee_code);
      const key = candidate ? candidate.candidate_id : '';
      const rates = contractRates.get(key) || [];
      
      return {
        ...convertEntryToRow(entry, rates),
        contractRates: rates
      };
    });
    
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
  }, [timesheetData, showFilled, candidateFilter, candidates, contractRates]);

  // Get the maximum number of rate columns needed across all rows
  const maxRateColumns = useMemo(() => {
    if (rows.length === 0) return 0;
    return Math.max(...rows.map(r => r.contractRates?.length || 0));
  }, [rows]);

  // Generate consistent hour columns for the table
  const tableHourColumns = useMemo(() => {
    const columns = ['Standard\nHours'];
    
    // Add rate columns based on the maximum number of rates
    for (let i = 0; i < maxRateColumns; i++) {
      columns.push(`Hours\nRate ${i + 2}`);
    }
    
    // Always add holiday columns at the end
    columns.push('Holiday\nHours', 'Bank Holiday\nHours');
    
    return columns;
  }, [maxRateColumns]);

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
    
    // Find the row to get contract rates
    const row = rows.find(r => r.id === rowId);
    if (!row) return;
    
    // Create update object based on column index
    const hourFields = ['standard_hours'];
    
    // Add rate fields based on contract rates (up to 6)
    const rateFields = ['rate2_hours', 'rate3_hours', 'rate4_hours', 'rate5_hours', 'rate6_hours'];
    for (let i = 0; i < Math.min(row.contractRates?.length || 0, 6); i++) {
      hourFields.push(rateFields[i]);
    }
    
    // Always add holiday fields at the end
    hourFields.push('holiday_hours', 'bank_holiday_hours');
    
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
                  {tableHourColumns.map((c) => (
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

