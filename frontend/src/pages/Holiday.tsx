import React, { useMemo, useState } from 'react';
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

interface HolidayRow {
  id: number;
  name: string;
  email: string;
  hoursWorked: string; // display format like 12:50
  totalHoliday: number;
  holidayTaken: number;
  holidayBalance: number;
}

const mockRows: HolidayRow[] = [
  { id: 1, name: 'Gheorghe Scurei', email: 'catalindascu@gmail.com', hoursWorked: '12:50', totalHoliday: 20, holidayTaken: 4, holidayBalance: 16 },
  { id: 2, name: 'Gary Clark', email: 'notsureg3@testmail.com', hoursWorked: '15:00', totalHoliday: 20, holidayTaken: 6, holidayBalance: 14 },
  { id: 3, name: 'Shanahan John', email: 'shananhjohn@gmail.com', hoursWorked: '10:00', totalHoliday: 20, holidayTaken: 6, holidayBalance: 14 },
  { id: 4, name: 'Lynch Cillian', email: 'cillancly89@gmail.com', hoursWorked: '32:00', totalHoliday: 20, holidayTaken: 4, holidayBalance: 16 },
];

const Holiday: React.FC = () => {
  const [query, setQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('Client');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mockRows.filter((r) => !q || r.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Annual Leave
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
                {rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{r.email}</Typography>
                    </TableCell>
                    <TableCell align="center">{r.hoursWorked}</TableCell>
                    <TableCell align="center">{r.totalHoliday}</TableCell>
                    <TableCell align="center">{String(r.holidayTaken).padStart(2, '0')}</TableCell>
                    <TableCell align="center">{r.holidayBalance}</TableCell>
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

