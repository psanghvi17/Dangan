import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Paper,
  CircularProgress,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { clientsAPI, ClientDTO, ClientUpdateDTO } from '../services/api';
import CostCenterTab from '../components/CostCenterTab';

const EditClient: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastSev, setToastSev] = useState<'success' | 'error'>('success');
  const [activeTab, setActiveTab] = useState(0);
  const [form, setForm] = useState<ClientUpdateDTO>({
    client_name: '',
    email: '',
    description: '',
    contact_email: '',
    contact_name: '',
    contact_phone: '',
  });

  useEffect(() => {
    const fetchClient = async () => {
      if (!clientId) return;
      
      try {
        setLoading(true);
        const client = await clientsAPI.get(clientId);
        setForm({
          client_name: client.client_name || '',
          email: client.email || '',
          description: client.description || '',
          contact_email: client.contact_email || '',
          contact_name: client.contact_name || '',
          contact_phone: client.contact_phone || '',
        });
      } catch (error) {
        console.error('Failed to fetch client:', error);
        setToastSev('error');
        setToastMsg('Failed to load client data');
        setToastOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [clientId]);

  const handleChange = (field: keyof ClientUpdateDTO, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!clientId) return;
    
    try {
      setSaving(true);
      await clientsAPI.update(clientId, form);
      setToastSev('success');
      setToastMsg('Client updated successfully');
      setToastOpen(true);
      setTimeout(() => {
        navigate('/client');
      }, 1500);
    } catch (error) {
      console.error('Failed to update client:', error);
      setToastSev('error');
      setToastMsg('Failed to update client');
      setToastOpen(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>

        {/* Tab Navigation */}
        <Paper elevation={0} sx={{ mb: 3, bgcolor: 'background.default' }}>
          <Box sx={{ display: 'flex', gap: 2, p: 1 }}>
            <Button
              variant={activeTab === 0 ? 'contained' : 'outlined'}
              color={activeTab === 0 ? 'primary' : 'inherit'}
              onClick={() => setActiveTab(0)}
              sx={{ borderRadius: 999, px: 3 }}
            >
              Client Details
            </Button>
            {clientId && (
              <Button
                variant={activeTab === 1 ? 'contained' : 'outlined'}
                color={activeTab === 1 ? 'primary' : 'inherit'}
                onClick={() => setActiveTab(1)}
                sx={{ borderRadius: 999, px: 3 }}
              >
                Cost Centers
              </Button>
            )}
          </Box>
        </Paper>

        {/* Client Details Tab */}
        {activeTab === 0 && (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Client Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Client Name"
                  fullWidth
                  value={form.client_name}
                  onChange={(e) => handleChange('client_name', e.target.value)}
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
                  label="Contact Email"
                  type="email"
                  fullWidth
                  value={form.contact_email}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Contact Name"
                  fullWidth
                  value={form.contact_name}
                  onChange={(e) => handleChange('contact_name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Contact Phone"
                  fullWidth
                  value={form.contact_phone}
                  onChange={(e) => handleChange('contact_phone', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button 
                    variant="outlined" 
                    onClick={() => navigate('/client')}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    disabled={saving}
                    onClick={handleSave}
                  >
                    {saving ? 'Saving…' : 'Save Changes'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Cost Centers Tab */}
        {activeTab === 1 && clientId && (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <CostCenterTab clientId={clientId} />
          </Paper>
        )}
      </Box>
      
      <Snackbar 
        open={toastOpen} 
        autoHideDuration={3000} 
        onClose={() => setToastOpen(false)} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert onClose={() => setToastOpen(false)} severity={toastSev} elevation={6} variant="filled">
          {toastMsg}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};

export default EditClient;
