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
  Chip,
  OutlinedInput,
} from '@mui/material';
import { clientsAPI, ClientDTO } from '../services/api';

interface GenerateInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (data: GenerateInvoiceData) => void | Promise<void>;
}

interface GenerateInvoiceData {
  clientIds: string[];
  week: string;
  invoiceDate: string;
}

const GenerateInvoiceModal: React.FC<GenerateInvoiceModalProps> = ({
  open,
  onClose,
  onGenerate,
}) => {
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
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
      
      // Fetch clients only
      const clientsResponse = await clientsAPI.list();
      setClients(clientsResponse.items || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (selectedClients.length === 0 || !selectedWeek || !invoiceDate) {
      setError('Please fill in all fields');
      return;
    }

    const generateData: GenerateInvoiceData = {
      clientIds: selectedClients,
      week: selectedWeek,
      invoiceDate: invoiceDate,
    };

    try {
      setGenerating(true);
      const maybePromise = onGenerate(generateData);
      if (maybePromise && typeof (maybePromise as any).then === 'function') {
        await (maybePromise as Promise<void>);
      }
    } catch (e: any) {
      // Surface any error in the modal
      setError(e?.response?.data?.detail || e?.message || 'Failed to generate invoice');
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => {
    setSelectedClients([]);
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
                <InputLabel>Select Clients</InputLabel>
                <Select
                  multiple
                  value={selectedClients}
                  onChange={(e) => setSelectedClients(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                  input={<OutlinedInput label="Select Clients" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const client = clients.find(c => c.client_id === value);
                        return (
                          <Chip 
                            key={value} 
                            label={client?.client_name || value} 
                            size="small"
                          />
                        );
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
          disabled={loading || generating || selectedClients.length === 0 || !selectedWeek || !invoiceDate}
          startIcon={generating ? <CircularProgress size={16} /> : undefined}
        >
          {generating ? 'Generating…' : 'Generate Invoice'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GenerateInvoiceModal;
