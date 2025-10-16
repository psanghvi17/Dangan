import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { candidatesAPI, clientsAPI, CandidateDTO, ClientDTO } from '../services/api';

interface GenerateInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (data: GenerateInvoiceData) => void;
}

interface GenerateInvoiceData {
  candidateId: string | 'all';
  clientId: string | 'all';
  week: string;
  invoiceDate: string;
}

const GenerateInvoiceModal: React.FC<GenerateInvoiceModalProps> = ({
  open,
  onClose,
  onGenerate,
}) => {
  const [candidates, setCandidates] = useState<CandidateDTO[]>([]);
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch active candidates and clients in parallel
      const [candidatesResponse, clientsResponse] = await Promise.all([
        candidatesAPI.listActive(),
        clientsAPI.list()
      ]);
      
      setCandidates(candidatesResponse);
      setClients(clientsResponse.items || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load candidates and clients');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    if (!selectedCandidate || !selectedClient || !selectedWeek || !invoiceDate) {
      setError('Please fill in all fields');
      return;
    }

    const generateData: GenerateInvoiceData = {
      candidateId: selectedCandidate,
      clientId: selectedClient,
      week: selectedWeek,
      invoiceDate: invoiceDate,
    };

    onGenerate(generateData);
  };

  const handleClose = () => {
    setSelectedCandidate('');
    setSelectedClient('');
    setSelectedWeek('');
    setInvoiceDate('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          Generate Invoice
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Select Candidate</InputLabel>
                <Select
                  value={selectedCandidate}
                  onChange={(e) => setSelectedCandidate(e.target.value)}
                  label="Select Candidate"
                >
                  <MenuItem value="all">
                    <strong>All Candidates</strong>
                  </MenuItem>
                  {candidates.map((candidate) => (
                    <MenuItem key={candidate.candidate_id} value={candidate.candidate_id}>
                      {candidate.invoice_contact_name || 'Unknown Candidate'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Select Client</InputLabel>
                <Select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  label="Select Client"
                >
                  <MenuItem value="all">
                    <strong>All Clients</strong>
                  </MenuItem>
                  {clients.map((client) => (
                    <MenuItem key={client.client_id} value={client.client_id}>
                      {client.client_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Week"
                type="week"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{ mb: 3 }}
                helperText="Select the week for which to generate the invoice"
              />

              <TextField
                fullWidth
                label="Invoice Date"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{ mb: 3 }}
              />
            </>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} color="secondary">
          Cancel
        </Button>
        <Button 
          onClick={handleGenerate} 
          variant="contained"
          disabled={loading || !selectedCandidate || !selectedClient || !selectedWeek || !invoiceDate}
        >
          Generate Invoice
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GenerateInvoiceModal;
