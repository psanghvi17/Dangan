import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider, Stack } from '@mui/material';
import { invoicesAPI, clientsAPI, InvoiceWithLineItemsDTO, ClientDTO } from '../services/api';

declare global {
  interface Window {
    html2pdf?: any;
  }
}

const loadHtml2Pdf = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.html2pdf) return resolve();
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load html2pdf'));
    document.body.appendChild(script);
  });
};

const InvoiceDownload: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [invoiceData, setInvoiceData] = useState<InvoiceWithLineItemsDTO | null>(null);
  const [billTo, setBillTo] = useState<ClientDTO | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!invoiceId) return;
      const data = await invoicesAPI.getWithLineItems(invoiceId);
      setInvoiceData(data);
      if (data?.invoice?.inv_client_id) {
        try {
          const client = await clientsAPI.get(data.invoice.inv_client_id);
          setBillTo(client);
        } catch {}
      }
    };
    fetchData();
  }, [invoiceId]);

  useEffect(() => {
    const generate = async () => {
      if (!invoiceData || !containerRef.current) return;
      await loadHtml2Pdf();
      const opt = {
        margin: [0, 0, 0, 0],
        filename: `Invoice_${invoiceData.invoice.invoice_num || 'download'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      };
      // Slight delay to ensure fonts/styles applied
      setTimeout(() => {
        window.html2pdf!().from(containerRef.current!).set(opt).save();
      }, 200);
    };
    generate();
  }, [invoiceData]);

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const calculateTotal = () => {
    if (!invoiceData?.line_items) return 0;
    return invoiceData.line_items.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const invoice = invoiceData?.invoice;
  const items = invoiceData?.line_items || [];

  return (
    <Box sx={{ background: '#f0f2f5', minHeight: '100vh', p: 2 }}>
      {/* Outer container strictly A4 content area: 190mm + 10mm padding on each side */}
      <Box ref={containerRef} sx={{ width: '190mm', minHeight: '277mm', mx: 'auto', background: '#fff', p: 0 }}>
        <Box sx={{ padding: '10mm' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: '2.2rem', textTransform: 'lowercase' }}>dangan</Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>Invoice</Typography>
            <Stack spacing={0.5}>
              <Typography variant="body2"><strong>Invoice No:</strong> {invoice?.invoice_num || 'N/A'}</Typography>
              <Typography variant="body2"><strong>Invoice Date:</strong> {invoice?.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : 'N/A'}</Typography>
            </Stack>
          </Box>
        </Box>

        {/* Bill To */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}><strong>Bill To:</strong></Typography>
          {billTo ? (
            <Box>
              <Typography variant="body2">{billTo.client_name}</Typography>
              {billTo.contact_name && (<Typography variant="body2">Attn: {billTo.contact_name}</Typography>)}
              {billTo.contact_email && (<Typography variant="body2">{billTo.contact_email}</Typography>)}
              {billTo.contact_phone && (<Typography variant="body2">{billTo.contact_phone}</Typography>)}
            </Box>
          ) : (
            <Typography variant="body2">Client</Typography>
          )}
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Line Items */}
        <TableContainer sx={{ pageBreakInside: 'avoid' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ background: '#1976d2' }}>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Description</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }} align="right">Rate</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }} align="right">Qty</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }} align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.pili_id}>
                  <TableCell>{it.m_rate_name || 'Item'}</TableCell>
                  <TableCell align="right">{formatCurrency(it.rate || 0)}</TableCell>
                  <TableCell align="right">{it.quantity || 0}</TableCell>
                  <TableCell align="right">{formatCurrency(it.total || 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Totals */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Box sx={{ minWidth: 240 }}>
            <Stack spacing={0.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2"><strong>Total € Excl. VAT:</strong></Typography>
                <Typography variant="body2"><strong>{formatCurrency(calculateTotal())}</strong></Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2"><strong>23% VAT:</strong></Typography>
                <Typography variant="body2"><strong>{formatCurrency(calculateTotal() * 0.23)}</strong></Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1"><strong>Total € Incl. VAT:</strong></Typography>
                <Typography variant="body1"><strong>{formatCurrency(calculateTotal() * 1.23)}</strong></Typography>
              </Box>
            </Stack>
          </Box>
        </Box>

        {/* Bank Details bottom-left */}
        <Box sx={{ mt: 3, pageBreakInside: 'avoid' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Bank Details</Typography>
          <Stack spacing={0.3}>
            <Typography variant="body2"><strong>Bank:</strong> Dangan Bank Plc</Typography>
            <Typography variant="body2"><strong>Account Name:</strong> Dangan Ltd</Typography>
            <Typography variant="body2"><strong>Account No.:</strong> 12345678</Typography>
            <Typography variant="body2"><strong>Sort Code:</strong> 12-34-56</Typography>
            <Typography variant="body2"><strong>IBAN:</strong> IE00BANK12345678901234</Typography>
            <Typography variant="body2"><strong>BIC:</strong> DANGIE2D</Typography>
          </Stack>
        </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default InvoiceDownload;


