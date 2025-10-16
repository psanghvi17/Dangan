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
  const [month, setMonth] = useState(''); // stores ISO like "2025-09"
  const [week, setWeek] = useState('');
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [candidates, setCandidates] = useState<CandidateDTO[]>([]);
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateDTO[]>([]);

  // Convert ISO month (YYYY-MM) to label (e.g., "September 2025")
  const formatMonthLabel = (isoMonth: string) => {
    if (!isoMonth || !isoMonth.includes('-')) return '';
    const [y, m] = isoMonth.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

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
      try {
        const [candidatesData, clientsData] = await Promise.all([
          candidatesAPI.listAll(),
          clientsAPI.list()
        ]);
        setCandidates(candidatesData);
        setClients(clientsData.items || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  // Filter candidates based on selected clients (currently show all; hook retained for future filtering)
  useEffect(() => {
    setFilteredCandidates(candidates);
  }, [selectedClients, candidates]);

  const handleSubmit = async () => {
    if (!month || !week) {
      alert('Please select both month and week');
      return;
    }

    setLoading(true);
    try {
      // Create the timesheet with filtered candidates
      const timesheetData = {
        month: formatMonthLabel(month) || month,
        week,
        // If exactly one client is selected, pass it; otherwise null (all clients)
        client_id: selectedClients.length === 1 ? selectedClients[0] : null,
        candidate_ids: selectedCandidate && selectedCandidate !== '' ? [selectedCandidate] : filteredCandidates.map(c => c.candidate_id)
      };

      await timesheetsAPI.create(timesheetData);
      onSuccess();
      onClose();
      
      // Reset form
      setMonth('');
      setWeek('');
      setSelectedClients([]);
      setSelectedCandidate('');
    } catch (error) {
      console.error('Error creating timesheet:', error);
      alert('Error creating timesheet. Please try again.');
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
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Week</InputLabel>
              <Select
                value={week}
                onChange={(e) => setWeek(e.target.value)}
                label="Week"
                disabled={!month}
              >
                {generateWeeks().map((weekOption) => (
                  <MenuItem key={weekOption.value} value={weekOption.value}>
                    {weekOption.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
                Preview: {filteredCandidates.length} candidates will be added
              </Typography>
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
          disabled={loading || !month || !week}
        >
          {loading ? 'Creating...' : 'Create Timesheet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTimesheetModal;
