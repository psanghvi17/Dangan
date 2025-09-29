import React, { useMemo, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Button,
} from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useNavigate } from 'react-router-dom';

interface Row {
  id: number;
  week: string;
  filled: number;
  notFilled: number;
  status: 'Open' | 'Close';
}

const mock: Row[] = [
  { id: 4, week: 'Week 4', filled: 18, notFilled: 12, status: 'Close' },
  { id: 3, week: 'Week 3', filled: 19, notFilled: 20, status: 'Open' },
  { id: 2, week: 'Week 2', filled: 50, notFilled: 20, status: 'Close' },
  { id: 1, week: 'Week 1', filled: 28, notFilled: 20, status: 'Open' },
];

const TimesheetList: React.FC = () => {
  const navigate = useNavigate();
  const [month, setMonth] = useState('April 2025');
  const rows = useMemo(() => mock, []);

  const StatusChip: React.FC<{ value: 'Open' | 'Close' }> = ({ value }) => (
    <Chip
      size="small"
      label={value}
      color={value === 'Open' ? 'success' : 'default'}
      sx={{ bgcolor: value === 'Open' ? 'success.light' : 'action.selected' }}
    />
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Timesheet
        </Typography>

        <Paper elevation={0} sx={{ p: 1.5, mb: 2, bgcolor: 'background.default' }}>
          <Grid container alignItems="center" spacing={2}>
            <Grid item>
              <TextField select size="small" value={month} onChange={(e) => setMonth(e.target.value)}>
                {['April 2025', 'March 2025'].map((m) => (
                  <MenuItem key={m} value={m}>{m}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item sx={{ flexGrow: 1 }} />
            <Grid item>
              <Button variant="contained" onClick={() => navigate('/timesheet/manage-timesheet')}>+ Add Timesheet</Button>
            </Grid>
          </Grid>
        </Paper>

        <Paper variant="outlined">
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell>Week</TableCell>
                  <TableCell align="center">Filled</TableCell>
                  <TableCell align="center">Not Filled</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.week}</TableCell>
                    <TableCell align="center">{r.filled}</TableCell>
                    <TableCell align="center">{r.notFilled}</TableCell>
                    <TableCell align="center"><StatusChip value={r.status} /></TableCell>
                    <TableCell align="center">
                      <IconButton size="small"><VisibilityIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => navigate('/timesheet/manage-timesheet')}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small"><FileCopyIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error"><DeleteOutlineIcon fontSize="small" /></IconButton>
                    </TableCell>
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

export default TimesheetList;

