import React, { useMemo, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

interface TimesheetRow {
  id: number;
  employee: string;
  code: string;
  client: string;
  filled: boolean;
  hours: number[]; // 8 columns: Standard, Rate2..Rate7, Holiday, Bank Holiday
}

const hourColumns = [
  'Standard\nHours',
  'Hours\nRate 2',
  'Hours\nRate 3',
  'Hours\nRate 4',
  'Hours\nRate 5',
  'Hours\nRate 6',
  'Holiday\nHours',
  'Bank Holiday\nHours',
];

const mockRows: TimesheetRow[] = Array.from({ length: 4 }).map((_, i) => ({
  id: i + 1,
  employee: 'Prince Etukudoh',
  code: '0101',
  client: 'Greenstar OSR_WEST DUB',
  filled: i % 2 === 0,
  hours: i === 1
    ? [18, 12, 15, 16, 10, 10, 10, 6]
    : i === 2
      ? [25, 32, 12, 0, 22, 0, 0, 6]
      : [12, 0, 12, 0, 12, 0, 10, 24],
}));

const Timesheet: React.FC = () => {
  const [week, setWeek] = useState('Week 4');
  const [dateRange, setDateRange] = useState('7th-14th Apr 2025');
  const [clientFilter, setClientFilter] = useState('All Client');
  const [candidateFilter, setCandidateFilter] = useState('All Candidate');
  const [showFilled, setShowFilled] = useState<'filled' | 'notfilled' | 'all'>('all');
  const [editAll, setEditAll] = useState(false);

  const rows = useMemo(() => {
    return mockRows.filter((r) => {
      if (showFilled === 'filled') return r.filled;
      if (showFilled === 'notfilled') return !r.filled;
      return true;
    });
  }, [showFilled]);

  const onHourChange = (rowId: number, colIdx: number, value: string) => {
    const v = value === '' ? 0 : Number(value);
    if (Number.isNaN(v)) return;
    const idx = mockRows.findIndex((r) => r.id === rowId);
    if (idx >= 0) {
      mockRows[idx].hours[colIdx] = v;
    }
  };

  const FilterButton: React.FC<{ active: boolean; onClick: () => void; label: string }>
    = ({ active, onClick, label }) => (
      <Button
        variant={active ? 'contained' : 'outlined'}
        color={active ? 'primary' : 'inherit'}
        onClick={onClick}
        sx={{ borderRadius: 999 }}
      >
        {label}
      </Button>
    );

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Timesheet
        </Typography>

        <Paper elevation={0} sx={{ mb: 2, p: 1.5, bgcolor: 'background.default' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Button variant="outlined" sx={{ borderRadius: 999 }}>{week}</Button>
            </Grid>
            <Grid item>
              <Button variant="outlined" sx={{ borderRadius: 999 }}>{dateRange}</Button>
            </Grid>
            <Grid item>
              <TextField select size="small" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
                {['All Client', 'Client'].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item>
              <TextField select size="small" value={candidateFilter} onChange={(e) => setCandidateFilter(e.target.value)}>
                {['All Candidate', 'Candidate'].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item sx={{ flexGrow: 1 }} />
            <Grid item>
              <Button variant="contained">Upload CSV</Button>
            </Grid>
            <Grid item>
              <FormControlLabel control={<Checkbox checked={editAll} onChange={(e) => setEditAll(e.target.checked)} />} label="Edit All" />
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <FilterButton active={showFilled === 'filled'} onClick={() => setShowFilled('filled')} label="Filled" />
          <FilterButton active={showFilled === 'notfilled'} onClick={() => setShowFilled('notfilled')} label="Not Filled" />
        </Box>

        <Paper variant="outlined">
          <TableContainer component={Box}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 320 }}>Employee Details</TableCell>
                  {hourColumns.map((c) => (
                    <TableCell key={c} align="center">
                      <Typography variant="caption" whiteSpace="pre-line">{c}</Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.employee}</Typography>
                      <Typography variant="caption" color="text.secondary">{r.client}</Typography>
                      <Typography variant="caption" sx={{ display: 'block' }}>Edit sheet</Typography>
                    </TableCell>
                    {r.hours.map((h, i) => (
                      <TableCell key={i} align="center">
                        <TextField
                          size="small"
                          value={h}
                          onChange={(e) => onHourChange(r.id, i, e.target.value)}
                          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', style: { textAlign: 'center', width: 60 } }}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button variant="contained">Save</Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Timesheet;

