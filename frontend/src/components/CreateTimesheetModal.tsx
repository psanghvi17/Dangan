import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Box,
  Typography,
} from '@mui/material';
import { candidatesAPI, clientsAPI, timesheetsAPI, CandidateDTO } from '../services/api';

interface CreateTimesheetModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}


interface ClientDTO {
  client_id: string;
  client_name: string;
  email?: string;
  description?: string;
  contact_email?: string;
  contact_name?: string;
  contact_phone?: string;
  created_on?: string;
}

const CreateTimesheetModal: React.FC<CreateTimesheetModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [month, setMonth] = useState(''); // derived from selected week (kept for backend label)
  const [week, setWeek] = useState('');    // HTML week value like "2025-W42"
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [candidates, setCandidates] = useState<CandidateDTO[]>([]);
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateDTO[]>([]);

  // Convert ISO month (YYYY-MM) to label (e.g., "September 2025")
  const formatMonthLabel = (isoMonth: string) => {
    if (!isoMonth || !isoMonth.includes('-')) return '';
    const [y, m] = isoMonth.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // When week changes, derive month label from the selected ISO week (YYYY-W##)
  useEffect(() => {
    if (!week || !week.includes('W')) {
      setMonth('');
      return;
    }
    try {
      const [yearStr, w] = week.split('-W');
      const year = parseInt(yearStr);
      const weekNum = parseInt(w);
      // ISO week → approximate month from the Monday of the week
      const jan4 = new Date(year, 0, 4);
      const jan4Weekday = (jan4.getDay() + 6) % 7; // Monday=0
      const week1Monday = new Date(jan4);
      week1Monday.setDate(jan4.getDate() - jan4Weekday);
      const weekStart = new Date(week1Monday);
      weekStart.setDate(week1Monday.getDate() + (weekNum - 1) * 7);
      const isoMonth = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}`;
      setMonth(isoMonth);
    } catch (_) {
      setMonth('');
    }
  }, [week]);

  // Generate weeks for selected month with date ranges
  const generateWeeks = () => {
    if (!month) return [];
    
    // Support ISO (YYYY-MM). If not ISO, try legacy "Month YYYY".
    let monthIndex: number;
    let yearNum: number;
    if (month.includes('-')) {
      const [y, m] = month.split('-');
      yearNum = parseInt(y);
      monthIndex = parseInt(m) - 1;
    } else {
      const [monthName, year] = month.split(' ');
      monthIndex = new Date(Date.parse(monthName + ' 1, 2000')).getMonth();
      yearNum = parseInt(year);
    }
    
    // Get the first day of the month
    const firstDay = new Date(yearNum, monthIndex, 1);
    const firstMonday = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    firstMonday.setDate(firstDay.getDate() - daysToMonday);
    
    const weeks = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(firstMonday);
      weekStart.setDate(firstMonday.getDate() + (i * 7));
      
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
      
      weeks.push({
        label: `Week ${i + 1} (${startDate} - ${endDate})`,
        value: `Week ${i + 1}`
      });
    }
    
    return weeks;
  };

  // Load candidates and clients
  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      try {
        console.log('🔍 DEBUG: Fetching candidates and clients data...');
        const [candidatesData, clientsData] = await Promise.all([
          candidatesAPI.listAll(),
          clientsAPI.list()
        ]);
        console.log('🔍 DEBUG: Candidates data:', candidatesData);
        console.log('🔍 DEBUG: Clients data:', clientsData);
        setCandidates(candidatesData);
        setClients(clientsData.items || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorDetails = (error as any)?.response?.data || errorMessage;
        console.error('Error details:', errorDetails);
      } finally {
        setDataLoading(false);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  // Filter candidates based on selected clients and contract status
  useEffect(() => {
    console.log('🔍 DEBUG: Filtering candidates based on clients and contracts');
    console.log('🔍 DEBUG: All candidates:', candidates);
    console.log('🔍 DEBUG: Selected clients:', selectedClients);
    
    let filtered = candidates;
    
    // First, filter to only show candidates who have contracts (any contract)
    filtered = candidates.filter(candidate => {
      const hasContract = candidate.contract_start_date || candidate.contract_end_date;
      console.log(`🔍 DEBUG: Candidate ${candidate.invoice_contact_name} has contract:`, hasContract);
      return hasContract;
    });
    
    // Then, if any clients are selected, filter by those clients
    if (selectedClients.length > 0) {
      console.log('🔍 DEBUG: Filtering by selected clients:', selectedClients);
      
      // Get the names of all selected clients
      const selectedClientNames = selectedClients.map(clientId => {
        const client = clients.find(c => c.client_id === clientId);
        return client?.client_name;
      }).filter(Boolean); // Remove undefined values
      
      console.log('🔍 DEBUG: Selected client names:', selectedClientNames);
      
      if (selectedClientNames.length > 0) {
        filtered = filtered.filter(candidate => {
          const matchesAnyClient = selectedClientNames.includes(candidate.client_name);
          console.log(`🔍 DEBUG: Candidate ${candidate.invoice_contact_name} (client: ${candidate.client_name}) matches any selected client:`, matchesAnyClient);
          console.log(`🔍 DEBUG: Selected client names: [${selectedClientNames.join(', ')}]`);
          console.log(`🔍 DEBUG: Candidate client name: "${candidate.client_name}"`);
          return matchesAnyClient;
        });
      }
    }
    
    console.log('🔍 DEBUG: Filtered candidates result:', filtered);
    setFilteredCandidates(filtered);
  }, [selectedClients, candidates, clients]);

  const handleSubmit = async () => {
    if (!week) {
      alert('Please select the week');
      return;
    }

    if (filteredCandidates.length === 0) {
      alert('No candidates available. Please ensure candidates are loaded.');
      return;
    }

    setLoading(true);
    try {
      // Create the timesheet with filtered candidates
      const timesheetData = {
        month: formatMonthLabel(month) || month, // derived from selected week
        week, // keep as provided (can be "YYYY-W##")
        // If exactly one client is selected, pass it; otherwise null (all clients)
        client_id: selectedClients.length === 1 ? selectedClients[0] : null,
        candidate_ids: selectedCandidate && selectedCandidate !== '' ? [selectedCandidate] : filteredCandidates.map(c => c.candidate_id)
      };

      console.log('🔍 DEBUG: Creating timesheet with data:', timesheetData);
      console.log('🔍 DEBUG: Filtered candidates:', filteredCandidates);
      console.log('🔍 DEBUG: Selected candidate:', selectedCandidate);
      console.log('🔍 DEBUG: Candidate IDs being sent:', timesheetData.candidate_ids);
      
      const result = await timesheetsAPI.create(timesheetData);
      console.log('🔍 DEBUG: Timesheet created successfully:', result);
      
      onSuccess();
      onClose();
      
      // Reset form
      setMonth('');
      setWeek('');
      setSelectedClients([]);
      setSelectedCandidate('');
    } catch (error) {
      console.error('Error creating timesheet:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorDetails = (error as any)?.response?.data || errorMessage;
      const errorDetail = (error as any)?.response?.data?.detail || errorMessage;
      console.error('Error details:', errorDetails);
      alert(`Error creating timesheet: ${errorDetail}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMonth('');
    setWeek('');
    setSelectedClients([]);
    setSelectedCandidate('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Timesheet</DialogTitle>
      <DialogContent>
        <Grid container spacing={1} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Week"
              type="week"
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="Select the ISO week (e.g., 2025-W42)"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Month (auto)"
              type="text"
              value={formatMonthLabel(month) || month}
              InputProps={{ readOnly: true }}
              InputLabelProps={{ shrink: true }}
              helperText="Derived from selected week"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Clients (Optional)</InputLabel>
              <Select
                multiple
                value={selectedClients}
                onChange={(e) => setSelectedClients(typeof e.target.value === 'string' ? e.target.value.split(',') : (e.target.value as string[]))}
                label="Clients (Optional)"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((id) => {
                      const cl = clients.find(c => c.client_id === id);
                      return <Chip key={id} label={cl?.client_name || id} size="small" />;
                    })}
                  </Box>
                )}
              >
                {clients.map((client) => (
                  <MenuItem key={client.client_id} value={client.client_id}>
                    {client.client_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Candidate (Optional)</InputLabel>
              <Select
                value={selectedCandidate}
                onChange={(e) => setSelectedCandidate(e.target.value)}
                label="Candidate (Optional)"
              >
                <MenuItem value="">All Candidates</MenuItem>
                {filteredCandidates.map((candidate) => (
                  <MenuItem key={candidate.candidate_id} value={candidate.candidate_id}>
                    {candidate.invoice_contact_name || 'Unknown'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Preview: {dataLoading ? 'Loading candidates...' : `${filteredCandidates.length} candidates with contracts will be added`}
              </Typography>
              {selectedClients.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  Filtered by selected clients ({selectedClients.length} client{selectedClients.length > 1 ? 's' : ''})
                </Typography>
              )}
              {selectedClients.length === 0 && (
                <Typography variant="caption" color="text.secondary">
                  Showing all candidates with contracts
                </Typography>
              )}
              {dataLoading ? (
                <Typography variant="body2" color="text.secondary">
                  Loading candidates and clients...
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxHeight: 100, overflow: 'auto' }}>
                  {filteredCandidates.slice(0, 10).map((candidate) => (
                    <Chip
                      key={candidate.candidate_id}
                      label={candidate.invoice_contact_name || 'Unknown'}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                  {filteredCandidates.length > 10 && (
                    <Chip
                      label={`+${filteredCandidates.length - 10} more`}
                      size="small"
                      variant="outlined"
                      color="secondary"
                    />
                  )}
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || dataLoading || !month || !week || filteredCandidates.length === 0}
        >
          {loading ? 'Creating...' : dataLoading ? 'Loading...' : 'Create Timesheet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTimesheetModal;
