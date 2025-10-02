import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { timesheetsAPI, TimesheetDetailDTO, TimesheetEntryDTO, candidatesAPI, CandidateDTO, ContractRateOutDTO, RateTypeDTO, RateFrequencyDTO } from '../services/api';
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
  hours: Record<string, number>; // Dynamic hours based on rate combinations
  candidateRates?: any[]; // Store candidate's specific rates
}

interface RateColumn {
  rateTypeId: number;
  rateTypeName: string;
  rateFrequencyId: number;
  rateFrequencyName: string;
  key: string; // Unique key for this rate combination
}

interface TableColumn {
  key: string;
  label: string;
  type: string;
  rateTypeId?: number;
  rateFrequencyId?: number;
}

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
  const [rateTypes, setRateTypes] = useState<RateTypeDTO[]>([]);
  const [rateFrequencies, setRateFrequencies] = useState<RateFrequencyDTO[]>([]);
  const [rateColumns, setRateColumns] = useState<RateColumn[]>([]);
  const [candidateRatesMatrix, setCandidateRatesMatrix] = useState<Record<string, any[]>>({});
  const [candidateClientInfo, setCandidateClientInfo] = useState<Record<string, string>>({});
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
        
        // Load all rate types and frequencies
        const [rateTypesData, rateFrequenciesData] = await Promise.all([
          candidatesAPI.getAllRateTypes(),
          candidatesAPI.getAllRateFrequencies()
        ]);
        
        setRateTypes(rateTypesData);
        setRateFrequencies(rateFrequenciesData);
        
        // Generate all possible rate combinations, excluding fixed frequency instances and rate types with ID >= 50
        const allRateColumns: RateColumn[] = [];
        const excludedFrequencies = ['Fixed']; // Add frequencies to exclude here
        
        rateTypesData.forEach(rateType => {
          // Skip if rate_type_id is >= 50
          if (rateType.rate_type_id >= 50) {
            return;
          }
          
          rateFrequenciesData.forEach(rateFrequency => {
            // Skip if this is a fixed frequency
            if (excludedFrequencies.includes(rateFrequency.rate_frequency_name || '')) {
              return;
            }
            
            allRateColumns.push({
              rateTypeId: rateType.rate_type_id,
              rateTypeName: rateType.rate_type_name || '',
              rateFrequencyId: rateFrequency.rate_frequency_id,
              rateFrequencyName: rateFrequency.rate_frequency_name || '',
              key: `${rateType.rate_type_id}-${rateFrequency.rate_frequency_id}`
            });
          });
        });
        
        setRateColumns(allRateColumns);
        console.log('🔍 Generated rate columns:', allRateColumns);
        
        // Load candidates
        const candidatesData = await candidatesAPI.listAll();
        setCandidates(candidatesData);
        console.log('🔍 Loaded candidates:', candidatesData);
        
        // Load timesheet data if editing
        if (timesheetId) {
          const data = await timesheetsAPI.getDetail(timesheetId);
          setTimesheetData(data);
          setWeek(data.week || '');
          // Calculate date range from week and month
          const calculatedDateRange = calculateDateRange(data.week || '', data.month || '');
          setDateRange(calculatedDateRange);
          
          // Get unique candidates from timesheet entries
          const uniqueCandidates = new Set<string>();
          data.entries.forEach(entry => {
            console.log(`🔍 Looking for candidate with employee_code: ${entry.employee_code}`);
            let candidate = candidatesData.find(c => c.candidate_id === entry.employee_code);
            
            // If not found, try to find by name (fallback)
            if (!candidate) {
              candidate = candidatesData.find(c => c.invoice_contact_name === entry.employee_name);
              console.log(`🔍 Fallback: Found candidate by name:`, candidate);
            }
            
            console.log(`🔍 Found candidate:`, candidate);
            if (candidate) {
              uniqueCandidates.add(candidate.candidate_id);
            } else {
              console.log(`❌ No candidate found for employee_code: ${entry.employee_code} or name: ${entry.employee_name}`);
            }
          });
          
          // Fetch rates matrix and client info for all candidates
          const candidateIds = Array.from(uniqueCandidates);
          console.log('🔍 Fetching rates matrix and client info for candidates:', candidateIds);
          console.log('🔍 Candidate ID types:', candidateIds.map(id => typeof id));
          console.log('🔍 Unique candidates set:', uniqueCandidates);
          
          if (candidateIds.length > 0) {
            try {
              const [ratesMatrix, clientInfo] = await Promise.all([
                candidatesAPI.getCandidateRatesMatrix(candidateIds),
                candidatesAPI.getCandidateClientInfo(candidateIds)
              ]);
              setCandidateRatesMatrix(ratesMatrix);
              setCandidateClientInfo(clientInfo);
              console.log('✅ Fetched rates matrix:', ratesMatrix);
              console.log('✅ Fetched client info:', clientInfo);
              console.log('🔍 Client info keys:', Object.keys(clientInfo));
              console.log('🔍 Client info values:', Object.values(clientInfo));
            } catch (error) {
              console.error('❌ Error fetching candidate data:', error);
              setCandidateRatesMatrix({});
              setCandidateClientInfo({});
            }
          }
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
    
    console.log('🔍 Converting timesheet entries to rows. Candidate rates matrix:', candidateRatesMatrix);
    
    const convertedRows = timesheetData.entries.map(entry => {
      // Try to find candidate by employee_code first
      let candidate = candidates.find(c => c.candidate_id === entry.employee_code);
      
      // If not found, try to find by name (fallback)
      if (!candidate) {
        candidate = candidates.find(c => c.invoice_contact_name === entry.employee_name);
        console.log(`🔍 Fallback: Found candidate by name:`, candidate);
      }
      
      const candidateId = candidate ? candidate.candidate_id : '';
      const candidateRates = candidateRatesMatrix[candidateId] || [];
      
      // Use dynamic client name from database, not from timesheet entry
      const dynamicClientName = candidateClientInfo[candidateId];
      const clientName = dynamicClientName || 'Unknown Client';
      
      console.log(`🔍 Entry ${entry.employee_name} (${entry.employee_code}): candidate=${candidateId}, rates=${candidateRates.length}`);
      console.log(`🔍 Dynamic client name for candidate ${candidateId}:`, dynamicClientName);
      console.log(`🔍 Final client name:`, clientName);
      console.log(`🔍 All client info:`, candidateClientInfo);
      
      // Create hours object with only dynamic rate combinations
      const hours: Record<string, number> = {};
      
      // Add hours for each rate combination
      rateColumns.forEach(column => {
        const rateKey = column.key;
        // Check if this candidate has this rate combination and it's not deleted
        const hasRate = candidateRates.some(rate => 
          rate.rate_type === column.rateTypeId && 
          rate.rate_frequency === column.rateFrequencyId &&
          rate.deleted_on === null // Only include non-deleted rates
        );
        
        if (hasRate) {
          // For now, use 0 as default - in a real implementation, you'd load existing values
          hours[rateKey] = 0;
        }
      });
      
      return {
        id: entry.entry_id,
        employee: entry.employee_name,
        code: entry.employee_code,
        client: clientName,
        filled: entry.filled,
        hours,
        candidateRates
      };
    });
    
    const filtered = convertedRows.filter((r) => {
      // Filter by filled status
      if (showFilled === 'filled' && !r.filled) return false;
      if (showFilled === 'notfilled' && r.filled) return false;
      
      // Filter by candidate (if not "All Candidate")
      if (candidateFilter !== 'All Candidate') {
        const candidate = candidates.find(c => c.candidate_id === r.code);
        console.log(`🔍 Filtering candidate: ${r.employee} (${r.code}), looking for: ${candidateFilter}, found: ${candidate?.invoice_contact_name}`);
        if (!candidate || candidate.invoice_contact_name !== candidateFilter) {
          return false;
        }
      }
      
      return true;
    });
    // Keep alphabetical order by employee name (case-insensitive)
    return filtered.sort((a, b) => a.employee.localeCompare(b.employee, undefined, { sensitivity: 'base' }));
  }, [timesheetData, showFilled, candidateFilter, candidates, candidateRatesMatrix, candidateClientInfo, rateColumns]);

  // Generate table columns based on all rate combinations (only dynamic columns)
  const tableColumns = useMemo((): TableColumn[] => {
    console.log('🔍 Generating table columns. Rate columns:', rateColumns);
    
    const columns: TableColumn[] = [
      { key: 'employee', label: 'Employee Details', type: 'employee' }
    ];
    
    // Add all rate combinations as columns (only dynamic rate combinations)
    rateColumns.forEach(column => {
      columns.push({
        key: column.key,
        label: `${column.rateTypeName}\n${column.rateFrequencyName}`,
        type: 'hours',
        rateTypeId: column.rateTypeId,
        rateFrequencyId: column.rateFrequencyId
      });
    });
    
    console.log('🔍 Final table columns:', columns);
    return columns;
  }, [rateColumns]);

  // Determine if this is editing an existing timesheet or creating a new one
  const isEditing = Boolean(timesheetId);
  const isViewMode = mode === 'view';
  const pageTitle = isViewMode ? 'View Timesheet' : (isEditing ? 'Edit Timesheet' : 'Create New Timesheet');

  const onHourChange = async (rowId: string, columnKey: string, value: string) => {
    const v = value === '' ? 0 : Number(value);
    if (Number.isNaN(v)) return;
    
    // Find the entry to update
    const entry = timesheetData?.entries.find(e => e.entry_id === rowId);
    if (!entry) return;
    
    // For dynamic rate combinations, we need to implement proper mapping
    // This is a simplified approach - in a real implementation, you'd need to
    // handle the mapping of rate combinations to the existing rate fields
    const updateData: Record<string, number> = {};
    
    // For rate combinations, we'll need to implement proper mapping
    // For now, we'll just log it
    console.log(`Rate combination ${columnKey} changed to ${v}`);
    
    try {
      if (Object.keys(updateData).length > 0) {
        await timesheetsAPI.updateEntry(rowId, updateData);
        // Refresh data after update
        if (timesheetId) {
          const updatedData = await timesheetsAPI.getDetail(timesheetId);
          setTimesheetData(updatedData);
        }
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
                {candidates.map((candidate) => {
                  console.log('🔍 Candidate for dropdown:', candidate);
                  return (
                    <MenuItem key={candidate.candidate_id} value={candidate.invoice_contact_name || 'Unknown'}>
                      {candidate.invoice_contact_name || 'Unknown'}
                    </MenuItem>
                  );
                })}
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
          <TableContainer component={Box} sx={{ maxHeight: 600, overflowX: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {tableColumns.map((column) => (
                    <TableCell 
                      key={column.key} 
                      align="center"
                      sx={{ 
                        width: column.type === 'employee' ? 250 : 100,
                        position: column.type === 'employee' ? 'sticky' : 'static',
                        left: column.type === 'employee' ? 0 : 'auto',
                        zIndex: column.type === 'employee' ? 2 : 1,
                        backgroundColor: 'background.paper'
                      }}
                    >
                      <Typography variant="caption" whiteSpace="pre-line">
                        {column.label}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} hover>
                    {tableColumns.map((column) => {
                      if (column.type === 'employee') {
                        return (
                          <TableCell 
                            key={column.key}
                            sx={{
                              position: 'sticky',
                              left: 0,
                              zIndex: 2,
                              backgroundColor: 'background.paper',
                              width: 250,
                              minWidth: 250
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {row.employee}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {row.client}
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                              {isViewMode ? 'View sheet' : 'Edit sheet'}
                            </Typography>
                          </TableCell>
                        );
                      } else {
                        const value = row.hours[column.key] || 0;
                        const isEnabled = row.candidateRates && row.candidateRates.some(rate => 
                          rate.rate_type === column.rateTypeId && 
                          rate.rate_frequency === column.rateFrequencyId &&
                          rate.deleted_on === null // Only enable if not deleted
                        );
                        
                        // Set disabled inputs to 0
                        const displayValue = isEnabled ? value : 0;
                        
                        return (
                          <TableCell key={column.key} align="center">
                            {isViewMode ? (
                              <Typography variant="body2" sx={{ textAlign: 'center', minWidth: 60 }}>
                                {isEnabled ? displayValue : '-'}
                              </Typography>
                            ) : (
                              <TextField
                                size="small"
                                value={isEnabled ? displayValue : 0}
                                disabled={!isEnabled}
                                onChange={(e) => onHourChange(row.id, column.key, e.target.value)}
                                inputProps={{ 
                                  inputMode: 'numeric', 
                                  pattern: '[0-9]*', 
                                  style: { textAlign: 'center', width: 60 } 
                                }}
                                sx={{
                                  '& .MuiInputBase-input:disabled': {
                                    color: 'text.disabled',
                                    backgroundColor: 'action.disabledBackground'
                                  }
                                }}
                              />
                            )}
                          </TableCell>
                        );
                      }
                    })}
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

