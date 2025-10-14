import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { costCentersAPI } from '../services/api';
import { CostCenterDTO, CostCenterCreateDTO, CostCenterUpdateDTO } from '../types';

interface CostCenterTabProps {
  clientId: string;
}

const CostCenterTab: React.FC<CostCenterTabProps> = ({ clientId }) => {
  const [costCenters, setCostCenters] = useState<CostCenterDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CostCenterCreateDTO>({
    client_id: clientId,
    cc_name: '',
    cc_number: '',
    cc_address: '',
  });

  useEffect(() => {
    loadCostCenters();
  }, [clientId]);

  const loadCostCenters = async () => {
    try {
      setLoading(true);
      const data = await costCentersAPI.getByClient(clientId);
      setCostCenters(data);
    } catch (error) {
      console.error('Failed to load cost centers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CostCenterCreateDTO, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      client_id: clientId,
      cc_name: '',
      cc_number: '',
      cc_address: '',
    });
    setEditingId(null);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      if (editingId) {
        // Update existing cost center
        const updateData: CostCenterUpdateDTO = {
          cc_name: form.cc_name,
          cc_number: form.cc_number,
          cc_address: form.cc_address,
        };
        await costCentersAPI.update(editingId, updateData);
      } else {
        // Create new cost center
        await costCentersAPI.create(clientId, form);
      }
      resetForm();
      loadCostCenters();
    } catch (error) {
      console.error('Failed to save cost center:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (costCenter: CostCenterDTO) => {
    setForm({
      client_id: clientId,
      cc_name: costCenter.cc_name || '',
      cc_number: costCenter.cc_number || '',
      cc_address: costCenter.cc_address || '',
    });
    setEditingId(costCenter.id);
  };

  const handleDelete = async (costCenterId: string) => {
    if (window.confirm('Are you sure you want to delete this cost center?')) {
      try {
        await costCentersAPI.delete(costCenterId);
        loadCostCenters();
      } catch (error) {
        console.error('Failed to delete cost center:', error);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Cost Centers
      </Typography>

      {/* Add/Edit Form */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          {editingId ? 'Edit Cost Center' : 'Add New Cost Center'}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Cost Center Name"
              fullWidth
              value={form.cc_name}
              onChange={(e) => handleChange('cc_name', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Cost Center Number"
              fullWidth
              value={form.cc_number}
              onChange={(e) => handleChange('cc_number', e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Cost Center Address"
              fullWidth
              multiline
              rows={3}
              value={form.cc_address}
              onChange={(e) => handleChange('cc_address', e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={saving}
                startIcon={editingId ? <EditIcon /> : <AddIcon />}
              >
                {saving ? 'Saving...' : (editingId ? 'Update' : 'Add')}
              </Button>
              {editingId && (
                <Button variant="outlined" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Cost Centers Table */}
      {costCenters.length > 0 ? (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Number</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {costCenters.map((costCenter) => (
                <TableRow key={costCenter.id}>
                  <TableCell>{costCenter.cc_name || '—'}</TableCell>
                  <TableCell>{costCenter.cc_number || '—'}</TableCell>
                  <TableCell>{costCenter.cc_address || '—'}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(costCenter)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(costCenter.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No cost centers found for this client. Add one above to get started.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default CostCenterTab;
