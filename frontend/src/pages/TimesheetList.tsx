import React, { useEffect, useState } from 'react';
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
import { timesheetsAPI, TimesheetSummaryDTO } from '../services/api';
import { ROUTES, getTimesheetManageRoute } from '../constants/routes';

const mock: TimesheetSummaryDTO[] = [
  { timesheet_id: '4', weekLabel: 'Week 4', monthLabel: 'April 2025', filledCount: 18, notFilledCount: 12, status: 'Close' },
  { timesheet_id: '3', weekLabel: 'Week 3', monthLabel: 'April 2025', filledCount: 19, notFilledCount: 20, status: 'Open' },
  { timesheet_id: '2', weekLabel: 'Week 2', monthLabel: 'April 2025', filledCount: 50, notFilledCount: 20, status: 'Close' },
  { timesheet_id: '1', weekLabel: 'Week 1', monthLabel: 'April 2025', filledCount: 28, notFilledCount: 20, status: 'Open' },
];

const TimesheetList: React.FC = () => {
  const navigate = useNavigate();
  const [month, setMonth] = useState('April 2025');
  const [rows, setRows] = useState<TimesheetSummaryDTO[]>(mock);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await timesheetsAPI.listSummaries({ month });
        // Minimal validation: ensure required fields exist
        if (Array.isArray(data)) setRows(data);
      } catch (_err) {
        // Fallback to mock if API not ready
        setRows(mock);
      }
    };
    fetchData();
  }, [month]);

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
              <Button 
                variant="outlined" 
                onClick={async () => {
                  try {
                    await timesheetsAPI.seedData();
                    // Refresh the data
                    const data = await timesheetsAPI.listSummaries({ month });
                    setRows(data);
                  } catch (error) {
                    console.error('Error seeding data:', error);
                  }
                }}
              >
                Seed Test Data
              </Button>
            </Grid>
            <Grid item>
              <Button variant="contained" onClick={() => navigate(ROUTES.TIMESHEET.MANAGE)}>+ Add Timesheet</Button>
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
                  <TableRow key={r.timesheet_id} hover>
                    <TableCell>{r.weekLabel}</TableCell>
                    <TableCell align="center">{r.filledCount}</TableCell>
                    <TableCell align="center">{r.notFilledCount}</TableCell>
                    <TableCell align="center"><StatusChip value={r.status} /></TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => navigate(getTimesheetManageRoute(r.timesheet_id))}><VisibilityIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => navigate(getTimesheetManageRoute(r.timesheet_id))}><EditIcon fontSize="small" /></IconButton>
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

