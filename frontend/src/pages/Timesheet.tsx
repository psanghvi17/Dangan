import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { timesheetsAPI, TimesheetDetailDTO, TimesheetEntryDTO, candidatesAPI, CandidateDTO, ContractRateOutDTO, RateTypeDTO, RateFrequencyDTO, ContractorHoursCreateDTO, ContractorHoursDTO, ContractorHoursUpsertDTO, ContractorRateHoursCreateDTO, ContractorRateHoursOutDTO, MultipleRateHoursCreateDTO } from '../services/api';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
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
  candidateId?: string; // full UUID for contractor_id
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
  const [candidatePccInfo, setCandidatePccInfo] = useState<Record<string, { client_name: string; pcc_id: string }>>({});
  const [loading, setLoading] = useState(true);
  const [week, setWeek] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [saving, setSaving] = useState(false);
  const [contractorHoursMap, setContractorHoursMap] = useState<Record<string, ContractorHoursDTO>>({});

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
              const [ratesMatrix, clientInfo, pccInfo] = await Promise.all([
                candidatesAPI.getCandidateRatesMatrix(candidateIds),
                candidatesAPI.getCandidateClientInfo(candidateIds),
                candidatesAPI.getCandidatePccInfo(candidateIds)
              ]);
              setCandidateRatesMatrix(ratesMatrix);
              setCandidateClientInfo(clientInfo);
              setCandidatePccInfo(pccInfo);
              console.log('✅ Fetched rates matrix:', ratesMatrix);
              console.log('✅ Fetched client info:', clientInfo);
              console.log('✅ Fetched pcc info:', pccInfo);
              console.log('🔍 Client info keys:', Object.keys(clientInfo));
              console.log('🔍 Client info values:', Object.values(clientInfo));
            } catch (error) {
              console.error('❌ Error fetching candidate data:', error);
              setCandidateRatesMatrix({});
              setCandidateClientInfo({});
              setCandidatePccInfo({});
            }
          }

          // Fetch existing contractor hours for this timesheet and map by contractor_id
          try {
            const tchList = await timesheetsAPI.listContractorHours(timesheetId);
            const map: Record<string, ContractorHoursDTO> = {};
            tchList.forEach(t => { if (t.contractor_id) map[t.contractor_id] = t; });
            setContractorHoursMap(map);
            console.log('✅ Loaded contractor hours count:', tchList.length);
          } catch (err) {
            console.error('❌ Error loading contractor hours:', err);
            setContractorHoursMap({});
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
      const existingTch = contractorHoursMap[candidateId];
      
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
          // Map rate type to the corresponding database field and get the current value
          let currentValue = 0;
          const rateTypeId = column.rateTypeId;
          
          if (rateTypeId === 1) { // Standard rate
            // Prefer the live edited entry value over previously saved contractor-hours
            currentValue = (entry.standard_hours ?? existingTch?.standard_hours ?? 0);
          } else if (rateTypeId === 2) { // Rate 2
            currentValue = entry.rate2_hours || 0;
          } else if (rateTypeId === 3) { // Rate 3
            currentValue = entry.rate3_hours || 0;
          } else if (rateTypeId === 4) { // Rate 4
            currentValue = entry.rate4_hours || 0;
          } else if (rateTypeId === 5) { // Rate 5
            currentValue = entry.rate5_hours || 0;
          } else if (rateTypeId === 6) { // Rate 6
            currentValue = entry.rate6_hours || 0;
          } else if (rateTypeId === 7) { // Holiday
            // Prefer entry.holiday_hours the user edits; fallback to saved weekend_hours
            currentValue = (entry.holiday_hours ?? existingTch?.weekend_hours ?? 0);
          } else if (rateTypeId === 8) { // Bank Holiday
            // Prefer entry.bank_holiday_hours; fallback to saved bank_holiday_hours
            currentValue = (entry.bank_holiday_hours ?? existingTch?.bank_holiday_hours ?? 0);
          }
          
          hours[rateKey] = currentValue;
        }
      });
      
      return {
        id: entry.entry_id,
        employee: entry.employee_name,
        code: entry.employee_code,
        client: clientName,
        filled: entry.filled,
        hours,
        candidateRates,
        candidateId
      };
    });
    
    // Keep alphabetical order by employee name (case-insensitive)
    return convertedRows.sort((a, b) => a.employee.localeCompare(b.employee, undefined, { sensitivity: 'base' }));
  }, [timesheetData, candidates, candidateRatesMatrix, candidateClientInfo, candidatePccInfo, rateColumns]);

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
    
    // Immediately update local state for instant UI feedback
    if (timesheetData) {
      const updatedEntries = timesheetData.entries.map(entry => {
        if (entry.entry_id === rowId) {
          // Find the rate column to get the rate type
          const rateColumn = rateColumns.find(col => col.key === columnKey);
          if (rateColumn) {
            const rateTypeId = rateColumn.rateTypeId;
            
            // Create a new entry object with updated hours
            const updatedEntry = { ...entry };
            
            // Update the appropriate field based on rate type
            if (rateTypeId === 1) { // Standard rate
              updatedEntry.standard_hours = v;
            } else if (rateTypeId === 2) { // Rate 2
              updatedEntry.rate2_hours = v;
            } else if (rateTypeId === 3) { // Rate 3
              updatedEntry.rate3_hours = v;
            } else if (rateTypeId === 4) { // Rate 4
              updatedEntry.rate4_hours = v;
            } else if (rateTypeId === 5) { // Rate 5
              updatedEntry.rate5_hours = v;
            } else if (rateTypeId === 6) { // Rate 6
              updatedEntry.rate6_hours = v;
            } else if (rateTypeId === 7) { // Holiday
              updatedEntry.holiday_hours = v;
            } else if (rateTypeId === 8) { // Bank Holiday
              updatedEntry.bank_holiday_hours = v;
            }
            
            return updatedEntry;
          }
        }
        return entry;
      });
      
      // Update the timesheet data immediately
      setTimesheetData({
        ...timesheetData,
        entries: updatedEntries
      });
    }
    
    // Debounced server update (update after 1 second of no changes)
    const updateServer = async () => {
      try {
        const updateData: Record<string, number> = {};
        const rateColumn = rateColumns.find(col => col.key === columnKey);
        
        if (rateColumn) {
          const rateTypeId = rateColumn.rateTypeId;
          
          // Map to the appropriate database field
          if (rateTypeId === 1) {
            updateData.standard_hours = v;
          } else if (rateTypeId === 2) {
            updateData.rate2_hours = v;
          } else if (rateTypeId === 3) {
            updateData.rate3_hours = v;
          } else if (rateTypeId === 4) {
            updateData.rate4_hours = v;
          } else if (rateTypeId === 5) {
            updateData.rate5_hours = v;
          } else if (rateTypeId === 6) {
            updateData.rate6_hours = v;
          } else if (rateTypeId === 7) {
            updateData.holiday_hours = v;
          } else if (rateTypeId === 8) {
            updateData.bank_holiday_hours = v;
          }
          
          if (Object.keys(updateData).length > 0) {
            await timesheetsAPI.updateEntry(rowId, updateData);
            console.log(`✅ Server updated: ${columnKey} = ${v}`);
          }
        }
      } catch (error) {
        console.error('Error updating timesheet entry:', error);
        // Optionally show error message to user
      }
    };
    
    // Clear any existing timeout for this field
    const timeoutKey = `${rowId}-${columnKey}`;
    if ((window as any).updateTimeouts) {
      clearTimeout((window as any).updateTimeouts[timeoutKey]);
    } else {
      (window as any).updateTimeouts = {};
    }
    
    // Set new timeout for server update
    (window as any).updateTimeouts[timeoutKey] = setTimeout(updateServer, 1000);
  };


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

  // Helper to derive a work_date (YYYY-MM-DD) from current week/dateRange
  const getWeekStartDateISO = (): string => {
    // dateRange looks like "7 Apr - 13 Apr" or similar; fallback to today
    try {
      if (dateRange) {
        const part = dateRange.split('-')[0].trim();
        const withYear = `${part} ${new Date().getFullYear()}`;
        const d = new Date(withYear);
        if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
      }
    } catch {}
    const today = new Date();
    return today.toISOString().slice(0, 10);
  };

  const getWeekEndDateISO = (): string => {
    try {
      if (dateRange && dateRange.includes('-')) {
        const parts = dateRange.split('-');
        const endPart = parts[parts.length - 1].trim();
        const withYear = `${endPart} ${new Date().getFullYear()}`;
        const d = new Date(withYear);
        if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
      }
    } catch {}
    const today = new Date();
    return today.toISOString().slice(0, 10);
  };

  // Helper function to calculate ISO week number (1-52)
  const getISOWeekNumber = (date: Date): number => {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  };

  const getWeekNumber = (): number | null => {
    console.log('🔍 DEBUG: getWeekNumber called with week:', week);
    console.log('🔍 DEBUG: dateRange:', dateRange);
    console.log('🔍 DEBUG: timesheetData month:', timesheetData?.month);
    
    // Calculate ISO week number based on the work date
    try {
      const workDate = getWeekStartDateISO();
      console.log('🔍 DEBUG: Work date for week calculation:', workDate);
      
      if (workDate) {
        const date = new Date(workDate);
        if (!isNaN(date.getTime())) {
          const isoWeekNumber = getISOWeekNumber(date);
          console.log('🔍 DEBUG: Calculated ISO week number:', isoWeekNumber);
          return isoWeekNumber;
        }
      }
    } catch (error) {
      console.error('Error calculating ISO week number:', error);
    }
    
    // Fallback: try to extract from week string if available
    if (week) {
      const m = week.match(/Week\s+(\d+)/);
      if (m) {
        const weekNumber = Number(m[1]);
        console.log('🔍 DEBUG: Extracted week number from string as fallback:', weekNumber);
        return weekNumber;
      }
    }
    
    console.log('🔍 DEBUG: Could not calculate week number, returning null');
    return null;
  };

  const refreshContractorHoursData = async () => {
    if (!timesheetData?.timesheet_id) return;
    
    try {
      const tchList = await timesheetsAPI.listContractorHours(timesheetData.timesheet_id);
      const map: Record<string, ContractorHoursDTO> = {};
      tchList.forEach(t => { if (t.contractor_id) map[t.contractor_id] = t; });
      setContractorHoursMap(map);
      console.log('✅ Refreshed contractor hours data, count:', tchList.length);
    } catch (err) {
      console.error('❌ Failed to refresh contractor hours:', err);
    }
  };

  const handleSave = async () => {
    if (!timesheetData) return;
    setSaving(true);
    try {
      const workDate = getWeekStartDateISO();
      const weekEnd = getWeekEndDateISO();
      const weekNumber = getWeekNumber();
      
      console.log('🔍 DEBUG: Save data - workDate:', workDate, 'weekEnd:', weekEnd, 'weekNumber:', weekNumber);
      
      // Build upsert payload for contractor hours (include tch_id if exists)
      const payload: ContractorHoursUpsertDTO[] = rows.map((row) => {
        // contractor_id is candidate_id; in our rows, `code` holds candidate_id when available
        const contractorId = row.candidateId || '';
        const existingTch = contractorHoursMap[contractorId];
        // Sum all enabled hours for this row
        const total = Object.values(row.hours).reduce((a, b) => a + (b || 0), 0);
        
        // Build rate hours data for this contractor
        let rateHours: ContractorRateHoursCreateDTO[] = [];
        if (row.candidateRates && row.candidateRates.length > 0) {
          console.log(`🔍 DEBUG: Building rate hours for contractor ${contractorId}, candidateRates:`, row.candidateRates);
          rateHours = row.candidateRates.map((rate: any) => {
            // Fix: Use the correct field names from backend
            const rateTypeId = rate.rate_type_id || rate.rate_type;
            const rateFrequencyId = rate.rate_frequency_id || rate.rate_frequency;
            const quantity = row.hours[`${rateTypeId}-${rateFrequencyId}`] || 0;
            console.log(`🔍 DEBUG: Rate ${rateTypeId}-${rateFrequencyId}: quantity=${quantity}, hours object:`, row.hours);
            return {
              tch_id: existingTch?.tch_id || '', // Will be updated after tch is created
              rate_frequency_id: rateFrequencyId,
              rate_type_id: rateTypeId,
              tcr_id: rate.rate_id || rate.id, // Using the correct contract rate ID field
              quantity: quantity,
              pay_rate: rate.pay_rate,
              bill_rate: rate.bill_rate,
            };
          }).filter(entry => entry.quantity > 0); // Only save entries with hours > 0
          console.log(`🔍 DEBUG: Filtered rate hours for contractor ${contractorId}:`, rateHours);
        } else {
          console.log(`🔍 DEBUG: No candidate rates found for contractor ${contractorId}`);
        }
        
        // Get pcc_id for this contractor
        const pccInfo = candidatePccInfo[contractorId];
        const pccId = pccInfo?.pcc_id;
        
        const payloadItem = {
          tch_id: existingTch?.tch_id,
          contractor_id: contractorId,
          work_date: workDate,
          timesheet_id: timesheetData.timesheet_id,
          pcc_id: pccId,
          standard_hours: row.hours["1-1"] ?? 0,
          weekend_hours: row.hours["1-3"] ?? undefined,
          bank_holiday_hours: row.hours["8-1"] ?? undefined,
          total_hours: total,
          day: weekEnd,
          week: weekNumber ?? undefined,
          rate_hours: rateHours.length > 0 ? rateHours : undefined,
        };
        
        console.log(`🔍 DEBUG: Built payload item for contractor ${contractorId}:`, payloadItem);
        return payloadItem;
      }).filter(p => !!p.contractor_id);

      if (payload.length > 0) {
        console.log('🔍 DEBUG: Sending payload to backend:', JSON.stringify(payload, null, 2));
        const savedContractorHours = await timesheetsAPI.upsertContractorHours(timesheetData.timesheet_id, payload);
        console.log(`✅ Saved contractor hours and rate hours for ${savedContractorHours.length} contractors`);
      }
      
      // Refresh the contractor hours data to get the latest tch_ids
      await refreshContractorHoursData();
      
      console.log('✅ Contractor hours and rate hours saved');
    } catch (e) {
      console.error('❌ Failed to save contractor hours and rate hours', e);
    } finally {
      setSaving(false);
    }
  };

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
            <Grid item sx={{ flexGrow: 1 }} />
            <Grid item>
              <Button variant="contained">Upload CSV</Button>
            </Grid>
          </Grid>
        </Paper>


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
                        
                        return (
                          <TableCell key={column.key} align="center">
                            {isViewMode ? (
                              <Typography variant="body2" sx={{ textAlign: 'center', minWidth: 60 }}>
                                {isEnabled ? value : '-'}
                              </Typography>
                            ) : (
                              <TextField
                                size="small"
                                value={value}
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
            <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default Timesheet;

