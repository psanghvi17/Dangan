import React, { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { clientsAPI } from '../services/api';

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

  // Rate tab state (UI only)
  const [rateType, setRateType] = useState<'Weekday' | 'Weekend' | 'Holiday'>('Weekend');
  const [payRate, setPayRate] = useState<string>('150');
  const [billRate, setBillRate] = useState<string>('100');
  const [difference, setDifference] = useState<string>('50');
  const [marginPercent, setMarginPercent] = useState<string>('33.5%');

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
            {[{ label: 'Client Details', idx: 0 }, { label: 'Rate', idx: 1 }, { label: 'Candidates', idx: 2 }].map(t => (
              <Button
                key={t.label}
                variant={tab === t.idx ? 'contained' : 'outlined'}
                color={tab === t.idx ? 'primary' : 'inherit'}
                onClick={() => setTab(t.idx)}
                sx={{ borderRadius: 999, px: 3 }}
              >
                {t.label}
              </Button>
            ))}
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
                        await clientsAPI.create({
                          client_name: form.clientName,
                          email: form.email,
                          description: form.description,
                          contact_email: form.email,
                          contact_name: form.accountManager,
                        });
                        setToastSev('success');
                        setToastMsg('Client saved');
                        setToastOpen(true);
                      } catch (e) {
                        console.error(e);
                        setToastSev('error');
                        setToastMsg('Failed to save client');
                        setToastOpen(true);
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    {saving ? 'Saving…' : 'Save'}
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
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Rate Type
                </Typography>
                <TextField
                  select
                  fullWidth
                  value={rateType}
                  onChange={(e) => setRateType(e.target.value as any)}
                >
                  {['Weekday', 'Weekend', 'Holiday'].map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Bill Rate
                </Typography>
                <TextField
                  fullWidth
                  value={billRate}
                  onChange={(e) => setBillRate(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Pay Rate
                </Typography>
                <TextField
                  fullWidth
                  value={payRate}
                  onChange={(e) => setPayRate(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Margin %
                </Typography>
                <TextField
                  fullWidth
                  value={marginPercent}
                  onChange={(e) => setMarginPercent(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Difference
                </Typography>
                <TextField
                  fullWidth
                  value={difference}
                  onChange={(e) => setDifference(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 2 }}>
                    Add Rate
                  </Button>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="contained" color="inherit" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.dark' } }}>
                      Save
                    </Button>
                    <Button variant="contained" color="inherit" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.dark' } }}>
                      Apply to all
                    </Button>
                  </Box>
                </Box>
              </Grid>
            </Grid>
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

