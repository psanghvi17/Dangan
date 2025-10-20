import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Download,
  Add,
  Visibility,
  Edit,
  Delete,
  TableChart,
  CalendarMonth,
  People,
  AccessTime,
  AttachMoney
} from '@mui/icons-material';
import api from '../services/api';

interface PayrollReport {
  report_id: string;
  report_name: string;
  description?: string;
  selected_weeks: string[];
  status: string;
  file_path?: string;
  file_size?: number;
  created_on: string;
  updated_on?: string;
  generated_on?: string;
}

interface DateRange {
  startDate: string;
  endDate: string;
}

const Payroll: React.FC = () => {
  const [reports, setReports] = useState<PayrollReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateReport, setShowCreateReport] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '',
    endDate: ''
  });
  const [newReport, setNewReport] = useState({
    report_name: '',
    selected_weeks: [] as string[]
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.get('/payroll/reports');
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };


  const generateReportName = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate).toLocaleDateString('en-IE', { month: 'short', day: 'numeric' });
    const end = new Date(endDate).toLocaleDateString('en-IE', { month: 'short', day: 'numeric' });
    return `Payroll Report - ${start} to ${end}`;
  };

  const createReport = async () => {
    try {
      const reportName = generateReportName(dateRange.startDate, dateRange.endDate);
      await api.post('/payroll/reports', {
        report_name: reportName,
        selected_weeks: [dateRange.startDate, dateRange.endDate] // Using date range as weeks for backend compatibility
      });
      setShowCreateReport(false);
      setDateRange({ startDate: '', endDate: '' });
      fetchReports();
    } catch (error) {
      console.error('Error creating report:', error);
    }
  };

  const generateReport = async (reportId: string) => {
    setLoading(true);
    try {
      const report = reports.find(r => r.report_id === reportId);
      if (!report) return;

      await api.post('/payroll/reports/generate', {
        report_name: report.report_name,
        description: report.description,
        selected_weeks: report.selected_weeks,
        include_deductions: true,
        format: 'excel'
      });
      
      fetchReports();
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (reportId: string) => {
    try {
      const response = await api.get(`/payroll/reports/${reportId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payroll_report_${reportId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const deleteReport = async (reportId: string) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    
    try {
      await api.delete(`/payroll/reports/${reportId}`);
      fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'default' as const, label: 'Draft' },
      generating: { color: 'primary' as const, label: 'Generating' },
      completed: { color: 'success' as const, label: 'Completed' },
      failed: { color: 'error' as const, label: 'Failed' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Payroll Reports
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowCreateReport(true)}
        >
          New Payroll
        </Button>
      </Box>

      {/* Create Report Dialog */}
      <Dialog open={showCreateReport} onClose={() => setShowCreateReport(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Payroll Report</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Select Date Range
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            {dateRange.startDate && dateRange.endDate && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Date Range: {new Date(dateRange.startDate).toLocaleDateString('en-IE')} to {new Date(dateRange.endDate).toLocaleDateString('en-IE')}
                </Typography>
                <Typography variant="body2" color="primary" sx={{ mt: 1, fontWeight: 'medium' }}>
                  Report Name: {generateReportName(dateRange.startDate, dateRange.endDate)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  This report will include all invoices with invoice dates within the selected range.
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateReport(false)}>
            Cancel
          </Button>
          <Button
            onClick={createReport}
            disabled={!dateRange.startDate || !dateRange.endDate}
            variant="contained"
          >
            Create Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reports Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            Payroll Reports
          </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Report Name</TableCell>
                    <TableCell>Date Range</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>File Size</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Generated</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.report_id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {report.report_name}
                          </Typography>
                          {report.description && (
                            <Typography variant="body2" color="text.secondary">
                              {report.description}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {report.selected_weeks.length >= 2 
                              ? `${report.selected_weeks[0]} to ${report.selected_weeks[1]}`
                              : report.selected_weeks.join(', ')
                            }
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Invoice date range
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>
                        {report.file_size ? formatFileSize(report.file_size) : '-'}
                      </TableCell>
                      <TableCell>{formatDate(report.created_on)}</TableCell>
                      <TableCell>
                        {report.generated_on ? formatDate(report.generated_on) : '-'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {report.status === 'completed' && report.file_path && (
                            <IconButton
                              size="small"
                              onClick={() => downloadReport(report.report_id)}
                              color="primary"
                            >
                              <Download />
                            </IconButton>
                          )}
                          {report.status === 'draft' && (
                            <IconButton
                              size="small"
                              onClick={() => generateReport(report.report_id)}
                              disabled={loading}
                              color="primary"
                            >
                              <TableChart />
                            </IconButton>
                          )}
                          <IconButton size="small" color="primary">
                            <Visibility />
                          </IconButton>
                          <IconButton size="small" color="primary">
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => deleteReport(report.report_id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Payroll;
