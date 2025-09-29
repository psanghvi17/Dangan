import React, { useMemo, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Button,
} from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Avatar from '@mui/material/Avatar';
import { useNavigate } from 'react-router-dom';

interface Row {
  id: number;
  initials: string;
  name: string;
  email: string;
  clientName: string;
  startDate: string;
  finishDate: string;
  managerName: string;
}

const mock: Row[] = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  initials: 'CK',
  name: 'Candidate Kaushik',
  email: 'clientkaushik@Cozmotec.ie',
  clientName: 'test_01',
  startDate: '01-Feb-2025',
  finishDate: '01-Feb-2025',
  managerName: 'Kaushik Kishor',
}));

const ManageCandidate: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('Client');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mock.filter((r) => !q || r.name.toLowerCase().includes(q));
  }, [query]);

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
                {rows.map((r) => (
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
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Container>
  );
};

export default ManageCandidate;

