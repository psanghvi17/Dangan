import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Fab,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { invoicesAPI, InvoiceDTO, GenerateInvoiceRequestDTO } from '../services/api';
import GenerateInvoiceModal from '../components/GenerateInvoiceModal';
import { useNavigate } from 'react-router-dom';

const Invoice: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoicesAPI.list();
      setInvoices(response);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return 'default';
    switch (status.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };


  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3} position="relative">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Invoices
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setGenerateModalOpen(true)}
          sx={{ 
            backgroundColor: 'primary.main',
            '&:hover': { backgroundColor: 'primary.dark' }
          }}
        >
          Generate Invoice
        </Button>
      </Box>
      
      {invoices.length === 0 ? (
        <Alert severity="info">No invoices found.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice Number</TableCell>
                <TableCell>Invoice Date</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Total Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.invoice_id}>
                  <TableCell>
                    {invoice.invoice_num || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {formatDate(invoice.invoice_date)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(invoice.amount)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(invoice.total_amount)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={invoice.status || 'Unknown'}
                      color={getStatusColor(invoice.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton 
                      size="small" 
                      onClick={() => navigate(`/invoice/view-invoice/${invoice.invoice_id}`)}
                      title="View Invoice"
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      <GenerateInvoiceModal
        open={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        onGenerate={async (data: GenerateInvoiceRequestDTO) => {
          try {
            console.log('🔍 DEBUG: Generating invoice with data:', data);
            console.log('🔍 DEBUG: Week format:', data.week);
            console.log('🔍 DEBUG: Invoice date format:', data.invoiceDate);
            
            const request: GenerateInvoiceRequestDTO = {
              candidateId: data.candidateId,
              clientId: data.clientId,
              week: data.week,
              invoiceDate: data.invoiceDate,
            };
            
            console.log('🔍 DEBUG: Sending request to backend:', request);
            const response = await invoicesAPI.generate(request);
            console.log('🔍 DEBUG: Invoice generated successfully:', response);
            
            // Refresh the invoice list
            await fetchInvoices();
            
            setGenerateModalOpen(false);
            
            // Show success message (you can add a toast notification here)
            alert(`Invoice generated successfully! Invoice #${response.invoice_num} with total amount $${response.total_amount.toFixed(2)}`);
            
          } catch (error) {
            console.error('Error generating invoice:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorDetails = (error as any)?.response?.data?.detail || errorMessage;
            console.error('Error details:', errorDetails);
            alert(`Failed to generate invoice: ${errorDetails}. Please try again.`);
          }
        }}
      />
    </Box>
  );
};

export default Invoice;
