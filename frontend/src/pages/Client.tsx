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
import { ClientRateDTO, ClientRateCreateDTO, RateTypeDTO, RateFrequencyDTO } from '../types';

interface ClientFormData {
  clientName: string;
  description?: string;
  email: string;
  accountManager: string;
  address?: string;
  costCentre1?: string;
  costCentre2?: string;
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
    costCentre1: '',
    costCentre2: '',
  });
  
  // Determine if this is a new client (no clientId) or editing existing client
  const isNewClient = !clientId;
  const [clientRates, setClientRates] = useState<ClientRateDTO[]>([]);
  const [rateTypes, setRateTypes] = useState<RateTypeDTO[]>([]);
  const [rateFrequencies, setRateFrequencies] = useState<RateFrequencyDTO[]>([]);

  // Rate tab state (UI only)
  const [rateType, setRateType] = useState<number>(1); // Default to first rate type ID
  const [rateFrequency, setRateFrequency] = useState<number>(1); // Default to first frequency ID
  const [payRate, setPayRate] = useState<string>('150');
  const [billRate, setBillRate] = useState<string>('100');

  // Candidates tab mock data
  const candidates = Array.from({ length: 10 }).map((_, i) => ({
    name: 'Candidate Kaushik',
    email: 'clientkaushik@Cozmotec.ie',
    clientName: 'test_01',
    startDate: '01-Feb-2025',
    finishDate: '01-Feb-2025',
    managerName: 'Kaushik Kishor',
    initials: 'CK',
    id: i + 1,
  }));

  // Load client data and rates when clientId is present
  useEffect(() => {
    if (clientId) {
      loadClientData();
      loadClientRates();
    }
    // Always load rate types and frequencies
    loadRateTypes();
    loadRateFrequencies();
  }, [clientId]);

  const loadClientData = async () => {
    if (!clientId) return;
    try {
      const client = await clientsAPI.get(clientId);
      setForm({
        clientName: client.client_name || '',
        description: client.description || '',
        email: client.email || '',
        accountManager: client.contact_name || accountManagers[0],
        address: '', // Not in current schema
        costCentre1: '', // Not in current schema
        costCentre2: '', // Not in current schema
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
        <Typography variant="h4" component="h1" gutterBottom>
          Client
        </Typography>

        <Paper elevation={0} sx={{ mb: 3, bgcolor: 'background.default' }}>
          <Box sx={{ display: 'flex', gap: 2, p: 1 }}>
            {(() => {
              const tabs = [{ label: 'Client Details', idx: 0 }];
              // Always show Rate tab, but only show Candidates tab if we have a client ID
              tabs.push({ label: 'Rate', idx: 1 });
              if (!isNewClient) {
                tabs.push({ label: 'Candidates', idx: 2 });
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
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Cost Centre
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Cost Centre Name"
                  fullWidth
                  value={form.costCentre1}
                  onChange={(e) => handleChange('costCentre1', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Cost Centre Name"
                  fullWidth
                  value={form.costCentre2}
                  onChange={(e) => handleChange('costCentre2', e.target.value)}
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
                      setPayRate('150');
                      setBillRate('100');
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
                          pay_rate: parseFloat(payRate) || 0,
                          bill_rate: parseFloat(billRate) || 0,
                        };
                        
                        await clientsAPI.createRate(clientId, rateData);
                        setToastSev('success');
                        setToastMsg('Rate saved successfully');
                        setToastOpen(true);
                        
                        // Reset form
                        setPayRate('150');
                        setBillRate('100');
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
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/candidate/manage-candidate')}>
                Add Candidate
              </Button>
            </Box>
            <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: 'none' }}>
              <Table 
                className="client-table"
                sx={{
                  '& td': {
                    padding: '0 !important',
                    verticalAlign: 'middle !important',
                  },
                  '& th': {
                    padding: '0 !important',
                    verticalAlign: 'middle !important',
                  },
                  '& .MuiTableCell-root': {
                    padding: '0 !important',
                    verticalAlign: 'middle !important',
                  },
                  '& .MuiTableCell-head': {
                    padding: '0 !important',
                    verticalAlign: 'middle !important',
                  },
                  '& .MuiTableCell-body': {
                    padding: '0 !important',
                    verticalAlign: 'middle !important',
                  },
                  '& .MuiTableCell-sizeSmall': {
                    padding: '0 !important',
                    verticalAlign: 'middle !important',
                  },
                  '& .MuiTableCell-sizeMedium': {
                    padding: '0 !important',
                    verticalAlign: 'middle !important',
                  }
                }}
              >
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell align="center" sx={{ padding: '0 !important' }}>Name</TableCell>
                    <TableCell align="center" sx={{ padding: '0 !important' }}>Client Name</TableCell>
                    <TableCell align="center" sx={{ padding: '0 !important' }}>Start Date</TableCell>
                    <TableCell align="center" sx={{ padding: '0 !important' }}>Finish Date</TableCell>
                    <TableCell align="center" sx={{ padding: '0 !important' }}>Manager Name</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {candidates.map((c) => (
                    <TableRow key={c.id} hover>
                      <TableCell align="center" sx={{ padding: '0 !important' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.light' }}>{c.initials}</Avatar>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'center' }}>{c.name}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>{c.email}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center" sx={{ padding: '0 !important' }}>{c.clientName}</TableCell>
                      <TableCell align="center" sx={{ padding: '0 !important' }}>{c.startDate}</TableCell>
                      <TableCell align="center" sx={{ padding: '0 !important' }}>{c.finishDate}</TableCell>
                      <TableCell align="center" sx={{ padding: '0 !important' }}>{c.managerName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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

