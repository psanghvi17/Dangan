import React, { useMemo, useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Pagination,
} from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Avatar from '@mui/material/Avatar';
import { useNavigate } from 'react-router-dom';
import { candidatesAPI, CandidateListItemDTO } from '../services/api';

interface Row {
  id: string;
  initials: string;
  name: string;
  email: string;
  clientName: string;
  startDate: string;
  finishDate: string;
  managerName: string;
}

const ManageCandidate: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('Client');
  
  // API state
  const [candidates, setCandidates] = useState<CandidateListItemDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0
  });

  // Load candidates from API
  const loadCandidates = async (page: number = 1, limit: number = 10) => {
    console.log('🔄 Loading candidates from API...', { page, limit });
    setLoading(true);
    setError(null);
    try {
      const response = await candidatesAPI.list({ page, limit });
      console.log('✅ Candidates loaded:', response);
      setCandidates(response.candidates);
      setPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
        total_pages: response.total_pages
      });
    } catch (err) {
      console.error('❌ Error loading candidates:', err);
      setError('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  // Load candidates on component mount
  useEffect(() => {
    console.log('🚀 ManageCandidate component mounted, loading candidates...');
    loadCandidates();
  }, []);

  // Convert API data to table rows
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return candidates
      .filter((candidate) => !q || candidate.first_name?.toLowerCase().includes(q) || candidate.last_name?.toLowerCase().includes(q))
      .map((candidate) => ({
        id: candidate.user_id,
        initials: `${candidate.first_name?.[0] || ''}${candidate.last_name?.[0] || ''}`.toUpperCase(),
        name: `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim(),
        email: candidate.email_id || '',
        clientName: 'N/A', // This would come from a separate API call
        startDate: 'N/A', // This would come from a separate API call
        finishDate: 'N/A', // This would come from a separate API call
        managerName: 'N/A', // This would come from a separate API call
      }));
  }, [candidates, query]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Candidate
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
            <Grid item>
              <TextField select size="small" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
                {['Client', 'All Client'].map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item sx={{ flexGrow: 1 }} />
            <Grid item>
              <Button variant="contained" onClick={() => navigate('/candidate/manage-candidate')}>+ Add Candidate</Button>
            </Grid>
          </Grid>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper variant="outlined">
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell>Name</TableCell>
                  <TableCell>Client Name</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>Finish Date</TableCell>
                  <TableCell>Manager Name</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                      <CircularProgress />
                      <Typography variant="body2" sx={{ mt: 2 }}>Loading candidates...</Typography>
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No candidates found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.light' }}>{r.initials}</Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{r.email}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{r.clientName}</TableCell>
                      <TableCell>{r.startDate}</TableCell>
                      <TableCell>{r.finishDate}</TableCell>
                      <TableCell>{r.managerName}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {pagination.total_pages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={pagination.total_pages}
              page={pagination.page}
              onChange={(event, page) => loadCandidates(page, pagination.limit)}
              color="primary"
            />
          </Box>
        )}

        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary', textAlign: 'center' }}>
          Showing {rows.length} of {pagination.total} candidates
        </Typography>
      </Box>
    </Container>
  );
};

export default ManageCandidate;

