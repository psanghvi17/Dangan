import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  Button,
  Container,
  Grid,
  Divider,
  Stack,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { invoicesAPI, clientsAPI, InvoiceWithLineItemsDTO, ClientDTO } from '../services/api';

const ViewInvoice: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [invoiceData, setInvoiceData] = useState<InvoiceWithLineItemsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billTo, setBillTo] = useState<ClientDTO | null>(null);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceData();
    }
  }, [invoiceId]);

  // Auto trigger print if print=1 in query
  useEffect(() => {
    if (searchParams.get('print') === '1') {
      // Delay to allow content to render
      const t = setTimeout(() => window.print(), 300);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      const response = await invoicesAPI.getWithLineItems(invoiceId!);
      setInvoiceData(response);
      if (response?.invoice?.inv_client_id) {
        try {
          const client = await clientsAPI.get(response.invoice.inv_client_id);
          setBillTo(client);
        } catch (e) {
          console.warn('Failed to fetch client for Bill To');
        }
      }
    } catch (err) {
      console.error('Error fetching invoice data:', err);
      setError('Failed to fetch invoice data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const calculateTotal = () => {
    if (!invoiceData?.line_items) return 0;
    return invoiceData.line_items.reduce((sum, item) => sum + (item.total || 0), 0);
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
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!invoiceData) {
    return (
      <Container maxWidth="lg">
        <Alert severity="info" sx={{ mt: 2 }}>
          Invoice not found
        </Alert>
      </Container>
    );
  }

  const { invoice, line_items } = invoiceData;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/invoices')}
          variant="outlined"
        >
          Back to Invoices
        </Button>
      </Box>

      {/* Professional Invoice Layout */}
      <Paper sx={{ p: 4, backgroundColor: 'white' }}>
        {/* Header Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
          {/* Left: Brand */}
          <Box>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 'bold', 
                color: '#1976d2',
                fontSize: '2.5rem',
                mb: 2,
                textTransform: 'lowercase'
              }}
              data-testid="invoice-brand"
            >
              dangan
            </Typography>
          </Box>

          {/* Right: Invoice Title and Details */}
          <Box sx={{ textAlign: 'right' }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 'bold', 
                fontSize: '2.5rem',
                mb: 3
              }}
            >
              Invoice
            </Typography>
            
            <Stack spacing={1} sx={{ textAlign: 'right' }}>
              <Typography variant="body2">
                <strong>Invoice No:</strong> {invoice.invoice_num || 'N/A'}
              </Typography>
              <Typography variant="body2">
                <strong>Invoice Date:</strong> {formatDate(invoice.invoice_date)}
              </Typography>
              <Typography variant="body2">
                <strong>PO Number:</strong> N/A
              </Typography>
              <Typography variant="body2">
                <strong>Client Contact:</strong> N/A
              </Typography>
            </Stack>
          </Box>
        </Box>

        {/* Bill To: fetch and show client details for the invoice */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>Bill To:</strong>
            </Typography>
            {billTo ? (
              <Box>
                <Typography variant="body2">{billTo.client_name}</Typography>
                {billTo.contact_name && (
                  <Typography variant="body2">Attn: {billTo.contact_name}</Typography>
                )}
                {billTo.contact_email && (
                  <Typography variant="body2">{billTo.contact_email}</Typography>
                )}
                {billTo.contact_phone && (
                  <Typography variant="body2">{billTo.contact_phone}</Typography>
                )}
              </Box>
            ) : (
              <Typography variant="body2">Client</Typography>
            )}
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Line Items Table */}
        <TableContainer sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#1976d2' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Description</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Rate Per Day/Hr</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Days/Hrs</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Total Price</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {line_items.map((item) => (
                <TableRow key={item.pili_id} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f5f5f5' } }}>
                  <TableCell>
                    {item.m_rate_name || 'No description'}
                  </TableCell>
                  <TableCell align="right">
                    €{(item.rate || 0).toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    {item.quantity || 0}
                  </TableCell>
                  <TableCell align="right">
                    €{(item.total || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* VAT and Totals */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
          <Box sx={{ minWidth: 300 }}>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1">
                  <strong>Total € Excl. VAT:</strong>
                </Typography>
                <Typography variant="body1">
                  <strong>€{calculateTotal().toFixed(2)}</strong>
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1">
                  <strong>23% VAT:</strong>
                </Typography>
                <Typography variant="body1">
                  <strong>€{(calculateTotal() * 0.23).toFixed(2)}</strong>
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">
                  <strong>Total € Incl. VAT:</strong>
                </Typography>
                <Typography variant="h6">
                  <strong>€{(calculateTotal() * 1.23).toFixed(2)}</strong>
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Box>

        {/* Bottom Left: Bank Details */}
        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              Bank Details
            </Typography>
            <Stack spacing={0.5}>
              <Typography variant="body2"><strong>Bank:</strong> Dangan Bank Plc</Typography>
              <Typography variant="body2"><strong>Account Name:</strong> Dangan Ltd</Typography>
              <Typography variant="body2"><strong>Account No.:</strong> 12345678</Typography>
              <Typography variant="body2"><strong>Sort Code:</strong> 12-34-56</Typography>
              <Typography variant="body2"><strong>IBAN:</strong> IE00BANK12345678901234</Typography>
              <Typography variant="body2"><strong>BIC:</strong> DANGIE2D</Typography>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ViewInvoice;
