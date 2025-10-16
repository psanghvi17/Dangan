import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  TextField,
  MenuItem,
  Button,
  Paper,
} from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate, useParams } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { clientsAPI } from '../services/api';
import { ClientRateDTO, ClientRateCreateDTO, RateTypeDTO, RateFrequencyDTO, ClientCandidateDTO } from '../types';
import CostCenterTab from '../components/CostCenterTab';

interface ClientFormData {
  clientName: string;
  description?: string;
  email: string;
  accountManager: string;
  address?: string;
}

const accountManagers = ['Kyle Abaca', 'Jane Doe', 'John Smith'];

const Client: React.FC = () => {
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();
  const { clientId } = useParams<{ clientId?: string }>();
  const [saving, setSaving] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastSev, setToastSev] = useState<'success' | 'error'>('success');
  const [form, setForm] = useState<ClientFormData>({
    clientName: '',
    description: '',
    email: '',
    accountManager: accountManagers[0],
    address: '',
  });
  
  // Determine if this is a new client (no clientId) or editing existing client
  const isNewClient = !clientId;
  const [client, setClient] = useState<any>(null);
  const [clientRates, setClientRates] = useState<ClientRateDTO[]>([]);
  const [rateTypes, setRateTypes] = useState<RateTypeDTO[]>([]);
  const [rateFrequencies, setRateFrequencies] = useState<RateFrequencyDTO[]>([]);
  const [clientCandidates, setClientCandidates] = useState<ClientCandidateDTO[]>([]);

  // Rate tab state (UI only)
  const [rateType, setRateType] = useState<number>(1); // Default to first rate type ID
  const [rateFrequency, setRateFrequency] = useState<number>(1); // Default to first frequency ID
  const [payRate, setPayRate] = useState<string>('');
  const [billRate, setBillRate] = useState<string>('');


  // Load client candidates
  const loadClientCandidates = async () => {
    if (!clientId) return;
    try {
      const candidates = await clientsAPI.getCandidates(clientId);
      setClientCandidates(candidates);
    } catch (error) {
      console.error('Failed to load client candidates:', error);
      setToastSev('error');
      setToastMsg('Failed to load candidates');
      setToastOpen(true);
    }
  };

  // Load client data and rates when clientId is present
  useEffect(() => {
    if (clientId) {
      loadClientData();
      loadClientRates();
      loadClientCandidates();
    }
    // Always load rate types and frequencies
    loadRateTypes();
    loadRateFrequencies();
  }, [clientId]);

  const loadClientData = async () => {
    if (!clientId) return;
    try {
      const clientData = await clientsAPI.get(clientId);
      setClient(clientData);
      setForm({
        clientName: clientData.client_name || '',
        description: clientData.description || '',
        email: clientData.email || '',
        accountManager: clientData.contact_name || accountManagers[0],
        address: '', // Not in current schema
      });
    } catch (error) {
      console.error('Failed to load client data:', error);
      setToastSev('error');
      setToastMsg('Failed to load client data');
      setToastOpen(true);
    }
  };

  const loadClientRates = async () => {
    if (!clientId) return;
    try {
      const rates = await clientsAPI.getRates(clientId);
      setClientRates(rates);
    } catch (error) {
      console.error('Failed to load client rates:', error);
    }
  };

  const loadRateTypes = async () => {
    try {
      const types = await clientsAPI.getRateTypes();
      setRateTypes(types);
      // Set default rate type to first available
      if (types.length > 0) {
        setRateType(types[0].rate_type_id);
      }
    } catch (error) {
      console.error('Failed to load rate types:', error);
    }
  };

  const loadRateFrequencies = async () => {
    try {
      const frequencies = await clientsAPI.getRateFrequencies();
      setRateFrequencies(frequencies);
      // Set default frequency to first available
      if (frequencies.length > 0) {
        setRateFrequency(frequencies[0].rate_frequency_id);
      }
    } catch (error) {
      console.error('Failed to load rate frequencies:', error);
    }
  };

  const handleChange = (
    field: keyof ClientFormData,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <style>
          {`
            .client-table td, .client-table th {
              padding: 0 !important;
              vertical-align: middle !important;
            }
            .client-table .MuiTableCell-root {
              padding: 0 !important;
              vertical-align: middle !important;
            }
            .client-table .MuiTableCell-head {
              padding: 0 !important;
              vertical-align: middle !important;
            }
            .client-table .MuiTableCell-body {
              padding: 0 !important;
              vertical-align: middle !important;
            }
            .client-table .MuiTableCell-sizeSmall {
              padding: 0 !important;
              vertical-align: middle !important;
            }
            .client-table .MuiTableCell-sizeMedium {
              padding: 0 !important;
              vertical-align: middle !important;
            }
          `}
        </style>

        <Paper elevation={0} sx={{ mb: 3, bgcolor: 'background.default' }}>
          <Box sx={{ display: 'flex', gap: 2, p: 1 }}>
            {(() => {
              const tabs = [{ label: 'Client Details', idx: 0 }];
              // Always show Rate tab, but only show Candidates and Cost Centers tabs if we have a client ID
              tabs.push({ label: 'Rate', idx: 1 });
              if (!isNewClient) {
                tabs.push({ label: 'Candidates', idx: 2 });
                tabs.push({ label: 'Cost Centers', idx: 3 });
              }
              return tabs.map(t => (
                <Button
                  key={t.label}
                  variant={tab === t.idx ? 'contained' : 'outlined'}
                  color={tab === t.idx ? 'primary' : 'inherit'}
                  onClick={() => setTab(t.idx)}
                  sx={{ borderRadius: 999, px: 3 }}
                >
                  {t.label}
                </Button>
              ));
            })()}
          </Box>
        </Paper>

        {tab === 0 && (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Client Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Client Name"
                  fullWidth
                  value={form.clientName}
                  onChange={(e) => handleChange('clientName', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Description"
                  fullWidth
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Account Manager"
                  fullWidth
                  value={form.accountManager}
                  onChange={(e) => handleChange('accountManager', e.target.value)}
                >
                  {accountManagers.map((m) => (
                    <MenuItem key={m} value={m}>
                      {m}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Client Address"
                  fullWidth
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button variant="outlined">Cancel</Button>
                  <Button
                    variant="contained"
                    disabled={saving}
                    onClick={async () => {
                      setSaving(true);
                      try {
                        if (isNewClient) {
                          // Create new client and navigate to it
                          const newClient = await clientsAPI.create({
                            client_name: form.clientName,
                            email: form.email,
                            description: form.description,
                            contact_email: form.email,
                            contact_name: form.accountManager,
                          });
                          setToastSev('success');
                          setToastMsg('Client created successfully');
                          setToastOpen(true);
                          // Navigate to the new client with its ID
                          navigate(`/client/edit/${newClient.client_id}`);
                        } else {
                          // Update existing client
                          await clientsAPI.update(clientId!, {
                            client_name: form.clientName,
                            email: form.email,
                            description: form.description,
                            contact_email: form.email,
                            contact_name: form.accountManager,
                          });
                          setToastSev('success');
                          setToastMsg('Client updated successfully');
                          setToastOpen(true);
                        }
                      } catch (e) {
                        console.error(e);
                        setToastSev('error');
                        setToastMsg(isNewClient ? 'Failed to create client' : 'Failed to update client');
                        setToastOpen(true);
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    {saving ? 'Saving…' : (isNewClient ? 'Create Client' : 'Update Client')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        {tab === 1 && (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Rate Details
            </Typography>
            
            {isNewClient ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  Please save the client details first to add rates.
                </Typography>
              </Box>
            ) : (
              <>
            {/* Existing Rates Table */}
            {clientRates.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Current Rates
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Rate Type</TableCell>
                        <TableCell>Rate Frequency</TableCell>
                        <TableCell>Pay Rate</TableCell>
                        <TableCell>Bill Rate</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {clientRates.map((rate) => {
                        const rateTypeName = rateTypes.find(rt => rt.rate_type_id === rate.rate_type)?.rate_type_name || rate.rate_type || '—';
                        const rateFrequencyName = rateFrequencies.find(rf => rf.rate_frequency_id === rate.rate_frequency)?.rate_frequency_name || rate.rate_frequency || '—';
                        
                        return (
                          <TableRow key={rate.id}>
                            <TableCell>{rateTypeName}</TableCell>
                            <TableCell>{rateFrequencyName}</TableCell>
                            <TableCell>${rate.pay_rate || '—'}</TableCell>
                            <TableCell>${rate.bill_rate || '—'}</TableCell>
                            <TableCell>
                              <Button 
                                size="small" 
                                color="error"
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to delete this rate?')) {
                                    try {
                                      await clientsAPI.deleteRate(clientId!, rate.id);
                                      setToastSev('success');
                                      setToastMsg('Rate deleted successfully');
                                      setToastOpen(true);
                                      loadClientRates();
                                    } catch (error) {
                                      setToastSev('error');
                                      setToastMsg('Failed to delete rate');
                                      setToastOpen(true);
                                    }
                                  }
                                }}
                              >
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Add New Rate Form */}
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Add New Rate
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Rate Type
                </Typography>
                <TextField
                  select
                  fullWidth
                  value={rateType}
                  onChange={(e) => setRateType(parseInt(e.target.value))}
                >
                  {rateTypes.map((t) => (
                    <MenuItem key={t.rate_type_id} value={t.rate_type_id}>
                      {t.rate_type_name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Rate Frequency
                </Typography>
                <TextField
                  select
                  fullWidth
                  value={rateFrequency}
                  onChange={(e) => setRateFrequency(parseInt(e.target.value))}
                >
                  {rateFrequencies.map((f) => (
                    <MenuItem key={f.rate_frequency_id} value={f.rate_frequency_id}>
                      {f.rate_frequency_name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Pay Rate
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={payRate}
                  onChange={(e) => setPayRate(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Bill Rate
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={billRate}
                  onChange={(e) => setBillRate(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button 
                    variant="outlined"
                    onClick={() => {
                      // Reset form
                      setPayRate('');
                      setBillRate('');
                      if (rateTypes.length > 0) {
                        setRateType(rateTypes[0].rate_type_id);
                      }
                      if (rateFrequencies.length > 0) {
                        setRateFrequency(rateFrequencies[0].rate_frequency_id);
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="contained" 
                    onClick={async () => {
                      if (!clientId) return;
                      
                      try {
                        const rateData: ClientRateCreateDTO = {
                          client_id: clientId!,
                          rate_type: rateType,
                          rate_frequency: rateFrequency,
                          pay_rate: payRate ? parseFloat(payRate) : undefined,
                          bill_rate: billRate ? parseFloat(billRate) : undefined,
                        };
                        
                        await clientsAPI.createRate(clientId, rateData);
                        setToastSev('success');
                        setToastMsg('Rate saved successfully');
                        setToastOpen(true);
                        
                        // Reset form
                        setPayRate('');
                        setBillRate('');
                        if (rateTypes.length > 0) {
                          setRateType(rateTypes[0].rate_type_id);
                        }
                        if (rateFrequencies.length > 0) {
                          setRateFrequency(rateFrequencies[0].rate_frequency_id);
                        }
                        
                        // Reload rates
                        loadClientRates();
                      } catch (error) {
                        console.error('Failed to save rate:', error);
                        setToastSev('error');
                        setToastMsg('Failed to save rate');
                        setToastOpen(true);
                      }
                    }}
                  >
                    Save Rate
                  </Button>
                </Box>
              </Grid>
            </Grid>
              </>
            )}
          </Paper>
        )}

        {tab === 2 && (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Candidates</Typography>
            </Box>
            <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: 'none' }}>
              <Table 
                sx={{
                  '& .MuiTableRow-root': {
                    borderBottom: '1px solid #e0e0e0',
                  },
                  '& .MuiTableRow-root:last-child': {
                    borderBottom: 'none',
                  },
                  '& .MuiTableCell-root': {
                    borderBottom: 'none',
                    padding: '12px 16px',
                    verticalAlign: 'middle',
                  },
                  '& .MuiTableCell-head': {
                    backgroundColor: '#f5f5f5',
                    fontWeight: 600,
                    color: '#424242',
                    borderBottom: '1px solid #e0e0e0',
                  },
                  '& .MuiTableRow-root:hover': {
                    backgroundColor: '#fafafa',
                  }
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Client Name</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>Finish Date</TableCell>
                    <TableCell>Manager Name</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clientCandidates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No candidates assigned to this client
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    clientCandidates.map((candidate) => {
                      const fullName = `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || 'Unknown';
                      const initials = `${candidate.first_name?.[0] || ''}${candidate.last_name?.[0] || ''}`.toUpperCase() || 'U';
                      const startDate = candidate.contract_start_date ? new Date(candidate.contract_start_date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }) : '—';
                      const endDate = candidate.contract_end_date ? new Date(candidate.contract_end_date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }) : '—';
                      
                      return (
                        <TableRow key={candidate.user_id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ 
                                bgcolor: '#2196f3', 
                                width: 40, 
                                height: 40,
                                fontSize: '14px',
                                fontWeight: 600
                              }}>
                                {initials}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2 }}>
                                  {fullName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                  {candidate.email_id || 'No email'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {client?.client_name || 'Unknown Client'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {startDate}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {endDate}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              —
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Cost Centers Tab */}
        {tab === 3 && clientId && (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <CostCenterTab clientId={clientId} />
          </Paper>
        )}
      </Box>
      <Snackbar open={toastOpen} autoHideDuration={3000} onClose={() => setToastOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <MuiAlert onClose={() => setToastOpen(false)} severity={toastSev} elevation={6} variant="filled">
          {toastMsg}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};

export default Client;

