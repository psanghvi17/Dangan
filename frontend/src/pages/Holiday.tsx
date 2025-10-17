import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  MenuItem,
} from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import { candidatesAPI } from '../services/api';

interface HolidayRow {
  user_id: string;
  name: string;
  email_id?: string;
  hours_worked: number;
  total_holiday: number;
  holiday_taken: number;
  holiday_balance: number;
}

const Holiday: React.FC = () => {
  const [query, setQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('Client');
  const [rows, setRows] = useState<HolidayRow[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await candidatesAPI.holidaySummary();
        if (mounted) setRows(data);
      } catch (e) {
        console.error('Failed to load holiday summary', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => !q || (r.name || '').toLowerCase().includes(q));
  }, [query, rows]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>

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
          </Grid>
        </Paper>

        <Paper variant="outlined">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Employee Name</TableCell>
                  <TableCell align="center">Hours Worked</TableCell>
                  <TableCell align="center">Total Holiday</TableCell>
                  <TableCell align="center">Holiday Taken</TableCell>
                  <TableCell align="center">Holiday Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.user_id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{r.email_id}</Typography>
                    </TableCell>
                    <TableCell align="center">{r.hours_worked.toFixed(2)}</TableCell>
                    <TableCell align="center">{r.total_holiday.toFixed(2)}</TableCell>
                    <TableCell align="center">{r.holiday_taken.toFixed(2)}</TableCell>
                    <TableCell align="center">{r.holiday_balance.toFixed(2)}</TableCell>
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

export default Holiday;

