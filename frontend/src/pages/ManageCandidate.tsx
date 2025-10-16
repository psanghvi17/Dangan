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
  Tabs,
  Tab,
} from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Avatar from '@mui/material/Avatar';
import { useNavigate } from 'react-router-dom';
import { candidatesAPI, CandidateDTO } from '../services/api';

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
  const [activeTab, setActiveTab] = useState(0); // 0 for Active, 1 for Pending
  
  // API state
  const [candidates, setCandidates] = useState<CandidateDTO[]>([]);
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
    console.log('🔄 Loading candidates from API...', { page, limit, activeTab });
    setLoading(true);
    setError(null);
    try {
      let response: CandidateDTO[];
      
      if (activeTab === 0) {
        // Load active candidates
        response = await candidatesAPI.listActive();
        console.log('✅ Active candidates loaded:', response);
      } else {
        // Load pending candidates with user and contract info
        response = await candidatesAPI.listPendingWithUserAndContractInfo();
        console.log('✅ Pending candidates with user and contract info loaded:', response);
      }
      
      setCandidates(response);
      setPagination({
        page: 1,
        limit: response.length,
        total: response.length,
        total_pages: 1
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

  // Reload candidates when tab changes
  useEffect(() => {
    console.log('🔄 Tab changed, reloading candidates...', activeTab);
    loadCandidates();
  }, [activeTab]);

  // Convert API data to table rows
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return candidates
      .filter((candidate) => {
        // Search by first_name, last_name, or invoice_contact_name
        const fullName = `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim();
        const invoiceName = candidate.invoice_contact_name || '';
        const email = candidate.email_id || '';
        return !q || 
               fullName.toLowerCase().includes(q) || 
               invoiceName.toLowerCase().includes(q) ||
               email.toLowerCase().includes(q);
      })
      .map((candidate) => {
        // Use user fields for display, fallback to invoice_contact_name
        const displayName = `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || candidate.invoice_contact_name || 'N/A';
        const displayEmail = candidate.email_id || candidate.invoice_email || '';
        
        return {
          id: candidate.candidate_id,
          initials: displayName !== 'N/A' ? displayName.split(' ').map(n => n[0]).join('').toUpperCase() : 'N/A',
          name: displayName,
          email: displayEmail,
          clientName: candidate.client_name || 'N/A',
          startDate: candidate.contract_start_date || 'N/A',
          finishDate: candidate.contract_end_date || 'N/A',
          managerName: 'N/A', // This would come from a separate API call
        };
      });
  }, [candidates, query]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>

        <Paper elevation={0} sx={{ mb: 3, bgcolor: 'background.default' }}>
          <Box sx={{ display: 'flex', gap: 2, p: 1 }}>
            <Button
              variant={activeTab === 0 ? 'contained' : 'outlined'}
              color={activeTab === 0 ? 'primary' : 'inherit'}
              onClick={() => setActiveTab(0)}
              sx={{ borderRadius: 999, px: 2 }}
            >
              Active Candidates
            </Button>
            <Button
              variant={activeTab === 1 ? 'contained' : 'outlined'}
              color={activeTab === 1 ? 'primary' : 'inherit'}
              onClick={() => setActiveTab(1)}
              sx={{ borderRadius: 999, px: 2 }}
            >
              Pending Candidates
            </Button>
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ p: 1.5, mb: 2, bgcolor: 'background.default' }}>
          <Grid container spacing={1} alignItems="center">
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
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 2 }}>
                      <CircularProgress />
                      <Typography variant="body2" sx={{ mt: 2 }}>Loading candidates...</Typography>
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 2 }}>
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
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 600, 
                                cursor: 'pointer',
                                color: 'primary.main',
                                '&:hover': {
                                  textDecoration: 'underline'
                                }
                              }}
                              onClick={() => navigate(`/candidate/manage-candidate?user_id=${r.id}`)}
                            >
                              {r.name}
                            </Typography>
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
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
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

