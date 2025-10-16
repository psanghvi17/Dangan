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
import { timesheetsAPI, TimesheetSummaryDTO, candidatesAPI } from '../services/api';
import { ROUTES, getTimesheetManageRoute } from '../constants/routes';
import CreateTimesheetModal from '../components/CreateTimesheetModal';

const mock: TimesheetSummaryDTO[] = [
  { timesheet_id: '4', weekLabel: 'Week 4', monthLabel: 'April 2025', filledCount: 18, notFilledCount: 12, status: 'Close' },
  { timesheet_id: '3', weekLabel: 'Week 3', monthLabel: 'April 2025', filledCount: 19, notFilledCount: 20, status: 'Open' },
  { timesheet_id: '2', weekLabel: 'Week 2', monthLabel: 'April 2025', filledCount: 50, notFilledCount: 20, status: 'Close' },
  { timesheet_id: '1', weekLabel: 'Week 1', monthLabel: 'April 2025', filledCount: 28, notFilledCount: 20, status: 'Open' },
];

const TimesheetList: React.FC = () => {
  const navigate = useNavigate();
  const [month, setMonth] = useState('2025-04'); // Format: YYYY-MM for HTML5 month input
  const [rows, setRows] = useState<TimesheetSummaryDTO[]>(mock);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Function to convert month label to YYYY-MM format
  const convertMonthLabelToFormat = (monthLabel: string): string => {
    try {
      // Parse month label like "September 2025" to extract year and month
      const parts = monthLabel.split(' ');
      if (parts.length === 2) {
        const monthName = parts[0];
        const year = parseInt(parts[1]);
        
        // Create a proper date to get the month index
        const date = new Date(`${monthName} 1, ${year}`);
        const monthIndex = date.getMonth() + 1;
        const result = `${year}-${monthIndex.toString().padStart(2, '0')}`;
        return result;
      }
      return '2025-04'; // Default fallback
    } catch (error) {
      return '2025-04'; // Default fallback
    }
  };

  // Function to set default month from latest timesheet
  const setDefaultMonth = async () => {
    try {
      // Try the new latest endpoint first
      try {
        const latest = await timesheetsAPI.getLatest();
        if (latest && latest.month) {
          const monthFormat = convertMonthLabelToFormat(latest.month);
          setMonth(monthFormat);
          return;
        }
      } catch (error) {
        // Latest endpoint failed, try fallback method
      }
      
      // Fallback: get all timesheets and find the latest one
      try {
        const allTimesheets = await timesheetsAPI.listSummaries();
        
        if (allTimesheets && allTimesheets.length > 0) {
          // Find the timesheet with the latest month
          const latestTimesheet = allTimesheets.reduce((latest, current) => {
            if (!latest.monthLabel) return current;
            if (!current.monthLabel) return latest;
            
            // Compare months by parsing them as dates
            // Format like "September 2025" -> "September 1, 2025"
            const latestDate = new Date(latest.monthLabel + ' 1, 2000');
            const currentDate = new Date(current.monthLabel + ' 1, 2000');
            
            return currentDate > latestDate ? current : latest;
          });
          
          if (latestTimesheet && latestTimesheet.monthLabel) {
            const monthFormat = convertMonthLabelToFormat(latestTimesheet.monthLabel);
            setMonth(monthFormat);
          }
        }
      } catch (error) {
        // API failed, keep default month
        console.log('API failed, keeping default month');
      }
    } catch (error) {
      // Keep the default month if no latest timesheet is found
    }
  };

  const fetchData = async () => {
    try {
      // Convert YYYY-MM format to "Month YYYY" format for API
      const date = new Date(month + '-01');
      const monthLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const data = await timesheetsAPI.listSummaries({ month: monthLabel });
      // Minimal validation: ensure required fields exist
      if (Array.isArray(data)) setRows(data);
    } catch (_err) {
      // Fallback to mock if API not ready
      setRows(mock);
    }
  };

  useEffect(() => {
    // Set default month from latest timesheet on component mount
    setDefaultMonth();
  }, []);

  useEffect(() => {
    fetchData();
  }, [month]);

  const handleCreateSuccess = () => {
    fetchData(); // Refresh the list after creating a new timesheet
  };

  // Function to calculate start and end dates for a week
  const getWeekDates = (weekLabel: string, monthLabel: string) => {
    // Parse the month (e.g., "April 2025")
    const [monthName, year] = monthLabel.split(' ');
    const monthIndex = new Date(Date.parse(monthName + ' 1, 2000')).getMonth();
    const yearNum = parseInt(year);
    
    // Get the first day of the month
    const firstDay = new Date(yearNum, monthIndex, 1);
    const firstMonday = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    firstMonday.setDate(firstDay.getDate() - daysToMonday);
    
    // Calculate week number (1-4)
    const weekNumber = parseInt(weekLabel.split(' ')[1]) - 1;
    
    const weekStart = new Date(firstMonday);
    weekStart.setDate(firstMonday.getDate() + (weekNumber * 7));
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const startDate = weekStart.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short' 
    });
    const endDate = weekEnd.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short' 
    });
    
    return { startDate, endDate };
  };

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

        <Paper elevation={0} sx={{ p: 1.5, mb: 2, bgcolor: 'background.default' }}>
          <Grid container alignItems="center" spacing={1}>
            <Grid item>
              <TextField
                type="month"
                size="small"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  '& input[type="month"]': {
                    padding: '8px 12px',
                  }
                }}
              />
            </Grid>
            <Grid item sx={{ flexGrow: 1 }} />
            <Grid item>
              <Button 
                variant="outlined" 
                onClick={async () => {
                  try {
                    await candidatesAPI.seedData();
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
              <Button variant="contained" onClick={() => setCreateModalOpen(true)}>+ Add Timesheet</Button>
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
                {rows.map((r) => {
                  const { startDate, endDate } = getWeekDates(r.weekLabel, r.monthLabel);
                  return (
                    <TableRow key={r.timesheet_id} hover>
                      <TableCell>{r.weekLabel} ({startDate} - {endDate})</TableCell>
                      <TableCell align="center">{r.filledCount}</TableCell>
                      <TableCell align="center">{r.notFilledCount}</TableCell>
                      <TableCell align="center"><StatusChip value={r.status} /></TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => navigate(ROUTES.TIMESHEET.VIEW(r.timesheet_id))}><VisibilityIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => navigate(ROUTES.TIMESHEET.EDIT(r.timesheet_id))}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small"><FileCopyIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error"><DeleteOutlineIcon fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <CreateTimesheetModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      </Box>
    </Container>
  );
};

export default TimesheetList;

