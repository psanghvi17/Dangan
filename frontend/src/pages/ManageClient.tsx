import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  IconButton,
  TablePagination,
} from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { clientsAPI, ClientDTO } from '../services/api';

const ManageClient: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [data, setData] = useState<ClientDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientDTO | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastSev, setToastSev] = useState<'success' | 'error'>('success');

  const loadClients = useCallback(async () => {
    try {
      const res = await clientsAPI.list({ skip: page * rowsPerPage, limit: rowsPerPage });
      setData(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load clients', err);
      setData([]);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data
      .filter((c) => !q || (c.client_name || '').toLowerCase().includes(q))
      .map((c, i) => ({
        id: i,
        name: c.client_name || '',
        email: c.email || '',
        activeContractors: 3,
        description: c.description || '—',
        clientId: c.client_id,
        client: c,
      }));
  }, [query, data]);

  const handleEdit = (clientId: string) => {
    navigate(`/client/edit/${clientId}`);
  };

  const handleDeleteClick = (client: ClientDTO) => {
    setClientToDelete(client);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    
    try {
      setDeleting(true);
      await clientsAPI.delete(clientToDelete.client_id);
      setToastSev('success');
      setToastMsg(`Client "${clientToDelete.client_name}" deleted successfully`);
      setToastOpen(true);
      setDeleteModalOpen(false);
      setClientToDelete(null);
      await loadClients(); // Reload the list
    } catch (error) {
      console.error('Failed to delete client:', error);
      setToastSev('error');
      setToastMsg('Failed to delete client');
      setToastOpen(true);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setClientToDelete(null);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Client
        </Typography>

        <Paper elevation={0} sx={{ p: 1.5, mb: 2, bgcolor: 'background.default' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by Name"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </Grid>
            <Grid item sx={{ flexGrow: 1 }} />
            <Grid item>
              <Button variant="contained" onClick={() => navigate('/client/manage-client')}>
                + Add Client
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Paper variant="outlined">
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell>Client Name</TableCell>
                  <TableCell align="center">Active Contractors</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No clients found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((c) => (
                    <TableRow key={c.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{c.email}</Typography>
                      </TableCell>
                      <TableCell align="center">{c.activeContractors}</TableCell>
                      <TableCell>{c.description}</TableCell>
                      <TableCell align="center">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEdit(c.clientId)}
                          title="Edit client"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteClick(c.client)}
                          title="Delete client"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </Paper>
      </Box>
      
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        clientName={clientToDelete?.client_name || ''}
        loading={deleting}
      />
      
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

export default ManageClient;

