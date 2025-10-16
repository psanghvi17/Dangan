import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  Paper,
  MenuItem,
  Snackbar,
  IconButton,
  CircularProgress,
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import { candidatesAPI, clientsAPI, costCentersAPI } from '../services/api';
import { ClientRateDTO } from '../types';
import { useSearchParams } from 'react-router-dom';


type TabKey = 'personal' | 'account' | 'client' | 'cost-center' | 'documents';

const accountManagers = ['Kyle Abaca', 'Jane Doe', 'John Smith'];

const Candidate: React.FC = () => {
  const [searchParams] = useSearchParams();
  const user_id = searchParams.get('user_id');
  const [tab, setTab] = useState<TabKey>('personal');
  
  // Notification state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastSev, setToastSev] = useState<'success' | 'error'>('success');
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingCandidate, setLoadingCandidate] = useState(false);

  // Personal details
  const [employeeId, setEmployeeId] = useState('');
  const [pps, setPps] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [dob, setDob] = useState('');
  const [addr1, setAddr1] = useState('');
  const [addr2, setAddr2] = useState('');

  // Account details
  const [bic, setBic] = useState('');
  const [iban, setIban] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [clientNameAcc, setClientNameAcc] = useState('');

  // Client details + rates
  const [clientName, setClientName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [placementDate, setPlacementDate] = useState('');
  const [contractStartDate, setContractStartDate] = useState('');
  const [contractEndDate, setContractEndDate] = useState('');
  const [clientOptions, setClientOptions] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientRelationships, setClientRelationships] = useState<any[]>([]);
  const [loadingRelationships, setLoadingRelationships] = useState(false);
  const [manager, setManager] = useState(accountManagers[0]);
  const [hourlyPay, setHourlyPay] = useState('');
  const [hourlyBill, setHourlyBill] = useState('');
  const [weekendPay, setWeekendPay] = useState('');
  const [weekendBill, setWeekendBill] = useState('');
  const [bankHolidayPay, setBankHolidayPay] = useState('');
  const [bankHolidayBill, setBankHolidayBill] = useState('');
  const [overtimePay, setOvertimePay] = useState('');
  const [overtimeBill, setOvertimeBill] = useState('');

  // Rates meta and dynamic rows
  const [rateTypes, setRateTypes] = useState<any[]>([]);
  const [rateFrequencies, setRateFrequencies] = useState<any[]>([]);
  const [loadingRateMeta, setLoadingRateMeta] = useState(false);
  const [loadingClientRates, setLoadingClientRates] = useState(false);
  type RateRow = { id?: number; rate_type?: number | ''; rate_frequency?: number | ''; pay_rate?: string; bill_rate?: string; date_applicable?: string; date_end?: string; tcccc_id?: string };
  const [rates, setRates] = useState<RateRow[]>([{ rate_type: '', rate_frequency: '', pay_rate: '', bill_rate: '', date_applicable: '', date_end: '', tcccc_id: '' }]);
  const [pccCostCenters, setPccCostCenters] = useState<any[]>([]);
  const [openCcIndex, setOpenCcIndex] = useState<number | null>(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(null);

  // Cost Center tab
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [selectedCostCenters, setSelectedCostCenters] = useState<any[]>([]);
  const [loadingCostCenters, setLoadingCostCenters] = useState(false);

  // Documents tab
  const [docs, setDocs] = useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const handleUploadClick = () => fileInputRef.current?.click();
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).map((f) => f.name);
    if (files.length) setDocs((prev) => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const removeDoc = (name: string) => setDocs((prev) => prev.filter((n) => n !== name));

  // Reset form function
  const resetForm = () => {
    setEmployeeId('');
    setPps('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setContact('');
    setDob('');
    setAddr1('');
    setAddr2('');
    setBic('');
    setIban('');
    setAccountEmail('');
    setClientNameAcc('');
    setClientName('');
    setSelectedClientId('');
    setPlacementDate('');
    setContractStartDate('');
    setContractEndDate('');
    setClientRelationships([]);
    setManager(accountManagers[0]);
    setHourlyPay('');
    setHourlyBill('');
    setWeekendPay('');
    setWeekendBill('');
    setBankHolidayPay('');
    setBankHolidayBill('');
    setOvertimePay('');
    setOvertimeBill('');
    setRates([{ rate_type: '', rate_frequency: '', pay_rate: '', bill_rate: '', date_applicable: '', date_end: '' }]);
    setDocs([]);
  };

  // Load candidate data if user_id is provided
  const loadCandidateData = async (userId: string) => {
    setLoadingCandidate(true);
    try {
      console.log('🔄 Loading candidate data for user_id:', userId);
      const candidate = await candidatesAPI.get(userId);
      console.log('✅ Candidate data loaded:', candidate);
      
      // Pre-fill form with candidate data
      setFirstName(candidate.first_name || '');
      setLastName(candidate.last_name || '');
      setEmail(candidate.email_id || '');
      
      setIsEditMode(true);
      setToastSev('success');
      setToastMsg('Candidate data loaded successfully!');
      setToastOpen(true);
      
    } catch (error) {
      console.error('❌ Error loading candidate:', error);
      setToastSev('error');
      setToastMsg('Failed to load candidate data');
      setToastOpen(true);
    } finally {
      setLoadingCandidate(false);
    }
  };

  // Load client options
  const loadClientOptions = async () => {
    setLoadingClients(true);
    try {
      console.log('🔄 Loading client options...');
      const clients = await candidatesAPI.getClientOptions();
      console.log('✅ Client options loaded:', clients);
      console.log('🔍 Number of clients:', clients.length);
      setClientOptions(clients);
    } catch (error: any) {
      console.error('❌ Error loading client options:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      setToastSev('error');
      setToastMsg('Failed to load client options');
      setToastOpen(true);
    } finally {
      setLoadingClients(false);
    }
  };

  // Load client relationships for the candidate
  const loadClientRelationships = async (userId: string) => {
    setLoadingRelationships(true);
    try {
      console.log('🔄 Loading client relationships for candidate:', userId);
      const relationships = await candidatesAPI.getClientRelationships(userId);
      console.log('✅ Client relationships loaded:', relationships);
      setClientRelationships(relationships);
      
      // Pre-fill form with the first relationship if any
      if (relationships.length > 0) {
        const firstRelationship = relationships[0];
        setSelectedClientId(firstRelationship.client_id);
        setPlacementDate(firstRelationship.placement_date ? firstRelationship.placement_date.split('T')[0] : '');
        setContractStartDate(firstRelationship.contract_start_date ? firstRelationship.contract_start_date.split('T')[0] : '');
        setContractEndDate(firstRelationship.contract_end_date ? firstRelationship.contract_end_date.split('T')[0] : '');
        console.log('✅ Pre-filled form with existing relationship data');
        // Prefer existing contract rates for active PCC; fall back to client template rates
        if (firstRelationship.pcc_id) {
          await loadRatesByPcc(firstRelationship.pcc_id);
        } else {
          loadClientRates(firstRelationship.client_id);
        }
      }
      
    } catch (error: any) {
      console.error('❌ Error loading client relationships:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
    } finally {
      setLoadingRelationships(false);
    }
  };

  // Load cost centers for the selected client
  const loadCostCenters = async (clientId: string) => {
    if (!clientId) return;
    
    setLoadingCostCenters(true);
    try {
      console.log('🔄 Loading cost centers for client:', clientId);
      const costCentersData = await costCentersAPI.getByClient(clientId);
      console.log('✅ Cost centers loaded:', costCentersData);
      setCostCenters(costCentersData);
    } catch (error) {
      console.error('❌ Failed to load cost centers:', error);
    } finally {
      setLoadingCostCenters(false);
    }
  };

  // Load existing cost center assignments for the candidate
  const loadExistingCostCenterAssignments = async (userId: string) => {
    if (!userId) return;
    
    try {
      console.log('🔄 Loading existing cost center assignments for candidate:', userId);
      const existingAssignments = await candidatesAPI.getCostCenters(userId);
      console.log('✅ Existing cost center assignments loaded:', existingAssignments);
      
      // Transform the data to match our UI structure
      const transformedAssignments = existingAssignments.map((assignment: any) => ({
        cc_id: assignment.id,
        cc_name: assignment.cc_name,
        cc_number: assignment.cc_number,
        relationship_id: assignment.relationship_id // We'll need this for updates/deletes
      }));
      
      setSelectedCostCenters(transformedAssignments);
    } catch (error) {
      console.error('❌ Failed to load existing cost center assignments:', error);
    }
  };

  // Load rate meta (types, frequencies)
  const loadRateMeta = async () => {
    setLoadingRateMeta(true);
    try {
      const [types, freqs] = await Promise.all([
        candidatesAPI.getRateTypes(),
        candidatesAPI.getRateFrequencies(),
      ]);
      setRateTypes(types);
      setRateFrequencies(freqs);
      console.log('✅ Rate meta loaded', { types, freqs });
    } catch (error) {
      console.error('❌ Failed to load rate meta', error);
    } finally {
      setLoadingRateMeta(false);
    }
  };

  // Load client rates when client is selected
  const loadClientRates = async (clientId: string) => {
    if (!clientId) {
      // Reset rates to default when no client is selected
      setRates([{ rate_type: '', rate_frequency: '', pay_rate: '', bill_rate: '', date_applicable: '', date_end: '' }]);
      return;
    }

    setLoadingClientRates(true);
    try {
      console.log('🔄 Loading client rates for client:', clientId);
      const clientRates = await clientsAPI.getRates(clientId);
      console.log('✅ Client rates loaded:', clientRates);
      
      if (clientRates && clientRates.length > 0) {
        // Convert client rates to the format expected by the rates section
        const formattedRates: RateRow[] = clientRates.map((rate: ClientRateDTO) => ({
          rate_type: rate.rate_type ?? '',
          rate_frequency: rate.rate_frequency ?? '',
          pay_rate: rate.pay_rate ? String(rate.pay_rate) : '',
          bill_rate: rate.bill_rate ? String(rate.bill_rate) : '',
          date_applicable: '', // Client rates don't have date_applicable, so leave empty
          date_end: '', // Client rates don't have date_end, so leave empty
          tcccc_id: ''
        }));
        setRates(formattedRates);
      } else {
        // If no client rates exist, start with one empty row
        setRates([{ rate_type: '', rate_frequency: '', pay_rate: '', bill_rate: '', date_applicable: '', date_end: '', tcccc_id: '' }]);
      }
    } catch (error) {
      console.error('❌ Failed to load client rates:', error);
      // On error, reset to default
      setRates([{ rate_type: '', rate_frequency: '', pay_rate: '', bill_rate: '', date_applicable: '', date_end: '', tcccc_id: '' }]);
    } finally {
      setLoadingClientRates(false);
    }
  };

  // Load existing contract rates for a given PCC (only non-deleted are returned by API)
  const loadRatesByPcc = async (pccId: string) => {
    if (!pccId) {
      setRates([{ rate_type: '', rate_frequency: '', pay_rate: '', bill_rate: '', date_applicable: '', date_end: '', tcccc_id: '' }]);
      return;
    }
    setLoadingClientRates(true);
    try {
      const existing = await candidatesAPI.getRatesByPcc(pccId);
      if (existing && existing.length > 0) {
        setRates(existing.map((r: any) => ({
          id: r.id,
          rate_type: r.rate_type,
          rate_frequency: r.rate_frequency,
          pay_rate: r.pay_rate != null ? String(r.pay_rate) : '',
          bill_rate: r.bill_rate != null ? String(r.bill_rate) : '',
          date_applicable: r.date_applicable || '',
          date_end: r.date_end || '',
          tcccc_id: r.tcccc_id || ''
        })));
      } else {
        // No existing contract rates – show blank row
        setRates([{ rate_type: '', rate_frequency: '', pay_rate: '', bill_rate: '', date_applicable: '', date_end: '', tcccc_id: '' }]);
      }
    } catch (e) {
      console.error('❌ Failed to load rates by PCC', e);
      setRates([{ rate_type: '', rate_frequency: '', pay_rate: '', bill_rate: '', date_applicable: '', date_end: '', tcccc_id: '' }]);
    } finally {
      setLoadingClientRates(false);
    }
  };

  // Reset form on component mount
  useEffect(() => {
    if (user_id) {
      console.log('🚀 Edit mode: Loading candidate with user_id:', user_id);
      loadCandidateData(user_id);
      loadClientRelationships(user_id);
      loadExistingCostCenterAssignments(user_id);
    } else {
      console.log('🚀 Create mode: Resetting form');
      resetForm();
    }
    
    // Load client options
    loadClientOptions();
    // Load rate meta
    loadRateMeta();
  }, [user_id]);

  // Load cost centers when selected client changes
  useEffect(() => {
    if (selectedClientId) {
      loadCostCenters(selectedClientId);
    }
  }, [selectedClientId]);

  // Load PCC cost centers for the active relationship (for rates dropdowns)
  useEffect(() => {
    const loadPccCostCenters = async () => {
      try {
        if (clientRelationships.length > 0) {
          const pccId = clientRelationships[0].pcc_id;
          const cc = await candidatesAPI.getCostCentersByPcc(pccId);
          setPccCostCenters(cc);
          // Also load existing contract rates so all non-deleted rates are shown
          await loadRatesByPcc(pccId);
        } else {
          setPccCostCenters([]);
          setRates([{ rate_type: '', rate_frequency: '', pay_rate: '', bill_rate: '', date_applicable: '', date_end: '', tcccc_id: '' }]);
        }
      } catch (e) {
        console.error('❌ Failed to load PCC cost centers', e);
        setPccCostCenters([]);
      }
    };
    loadPccCostCenters();
  }, [clientRelationships]);

  const TabButton: React.FC<{ k: TabKey; label: string }> = ({ k, label }) => (
    <Button
      variant={tab === k ? 'contained' : 'outlined'}
      color={tab === k ? 'primary' : 'inherit'}
      onClick={() => {
        console.log('Tab clicked:', k);
        setTab(k);
      }}
    >
      {label}
    </Button>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>

        <Paper elevation={0} sx={{ mb: 3, bgcolor: 'background.default' }}>
          <Box sx={{ display: 'flex', gap: 2, p: 1, flexWrap: 'wrap' }}>
            <TabButton k="personal" label="Personal Details" />
            <TabButton k="account" label="Account Details" />
            <TabButton k="client" label="Client Details" />
            <TabButton k="cost-center" label="Cost Center" />
            <TabButton k="documents" label="Documents" />
          </Box>
        </Paper>

        {tab === 'personal' && (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Personal Detail
              </Typography>
              <Button variant="contained" onClick={async () => {
                try {
                  if (isEditMode && user_id) {
                    // Update existing candidate
                    const result = await candidatesAPI.update(user_id, {
                      first_name: firstName,
                      last_name: lastName,
                      email_id: email,
                      invoice_contact_name: `${firstName} ${lastName}`,
                      invoice_email: email ? [email] : undefined,
                      date_of_birth: dob ? new Date(dob).toISOString() : undefined,
                    });
                    setToastSev('success');
                    setToastMsg('Candidate updated successfully!');
                    setToastOpen(true);
                    console.log('Updated candidate:', result);
                  } else {
                    // Create new candidate
                    const result = await candidatesAPI.create({
                      invoice_contact_name: `${firstName} ${lastName}`,
                      invoice_email: email,
                      date_of_birth: dob ? new Date(dob).toISOString() : undefined,
                    });
                    setToastSev('success');
                    setToastMsg('Candidate created successfully!');
                    setToastOpen(true);
                    console.log('Created user:', result);
                  }
                } catch (error) {
                  console.error('Failed to save candidate:', error);
                  setToastSev('error');
                  setToastMsg('Failed to save candidate. Please check the console for details.');
                  setToastOpen(true);
                }
              }}>
                {isEditMode ? 'Update' : 'Create'}
              </Button>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Employee ID</Typography>
                <TextField fullWidth value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>PPS no.</Typography>
                <TextField fullWidth value={pps} onChange={(e) => setPps(e.target.value)} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>First Name</Typography>
                <TextField fullWidth value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Last Name</Typography>
                <TextField fullWidth value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Email</Typography>
                <TextField fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Contact No.</Typography>
                <TextField fullWidth value={contact} onChange={(e) => setContact(e.target.value)} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Date.of.Birth</Typography>
                <TextField fullWidth type="date" value={dob} onChange={(e) => setDob(e.target.value)} InputLabelProps={{ shrink: true }} />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Address 1</Typography>
                <TextField fullWidth value={addr1} onChange={(e) => setAddr1(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Address 2</Typography>
                <TextField fullWidth value={addr2} onChange={(e) => setAddr2(e.target.value)} />
              </Grid>
            </Grid>
          </Paper>
        )}

        {tab === 'account' && (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Account Detail
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>BIC (Revolute)</Typography>
                <TextField fullWidth value={bic} onChange={(e) => setBic(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>IBAN</Typography>
                <TextField fullWidth value={iban} onChange={(e) => setIban(e.target.value)} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Full Name</Typography>
                <TextField fullWidth value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Email ID</Typography>
                <TextField fullWidth value={accountEmail} onChange={(e) => setAccountEmail(e.target.value)} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Client Name</Typography>
                <TextField fullWidth value={clientNameAcc} onChange={(e) => setClientNameAcc(e.target.value)} />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained" onClick={() => {
                    setToastSev('success');
                    setToastMsg('Account details saved successfully!');
                    setToastOpen(true);
                  }}>Save</Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        {tab === 'client' && (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Client Detail
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Select Client</Typography>
                <TextField 
                  select 
                  fullWidth 
                  value={selectedClientId} 
                  onChange={(e) => {
                    setSelectedClientId(e.target.value);
                    // Load client rates when client is selected
                    loadClientRates(e.target.value);
                  }}
                  disabled={loadingClients || loadingRelationships}
                  helperText={loadingRelationships ? "Loading existing relationships..." : ""}
                >
                  <MenuItem value="">
                    <em>Select a client...</em>
                  </MenuItem>
                  {clientOptions.map((client) => (
                    <MenuItem key={client.client_id} value={client.client_id}>
                      {client.client_name || 'Unnamed Client'}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Account Manager</Typography>
                <TextField select fullWidth value={manager} onChange={(e) => setManager(e.target.value)}>
                  {accountManagers.map((m) => (
                    <MenuItem key={m} value={m}>{m}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Placement Date</Typography>
                <TextField 
                  fullWidth 
                  type="date"
                  value={placementDate} 
                  onChange={(e) => setPlacementDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Contract Start Date</Typography>
                <TextField 
                  fullWidth 
                  type="date"
                  value={contractStartDate} 
                  onChange={(e) => setContractStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Contract End Date</Typography>
                <TextField 
                  fullWidth 
                  type="date"
                  value={contractEndDate} 
                  onChange={(e) => setContractEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>
              Rates {loadingClientRates && <CircularProgress size={16} sx={{ ml: 1 }} />}
            </Typography>

            {rates.map((row, idx) => {
              const pay = row.pay_rate ? Number(row.pay_rate) : NaN;
              const bill = row.bill_rate ? Number(row.bill_rate) : NaN;
              const margin = !isNaN(pay) && !isNaN(bill) ? String(bill - pay) : '';
              return (
                <Box key={idx} sx={{ mb: 2 }}>
                  <Grid container spacing={2}>
                    {/* Row 1: Type, Frequency, Start, End */}
                    <Grid item xs={12} md={3}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Rate Type</Typography>
                      <TextField select fullWidth value={row.rate_type ?? ''} onChange={(e) => {
                        const v = e.target.value === '' ? '' : Number(e.target.value);
                        setRates(prev => prev.map((r, i) => i === idx ? { ...r, rate_type: v } : r));
                      }} disabled={loadingRateMeta}>
                        <MenuItem value=""><em>Select...</em></MenuItem>
                        {rateTypes.map(rt => (
                          <MenuItem key={rt.rate_type_id} value={rt.rate_type_id}>{rt.rate_type_name}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Frequency</Typography>
                      <TextField select fullWidth value={row.rate_frequency ?? ''} onChange={(e) => {
                        const v = e.target.value === '' ? '' : Number(e.target.value);
                        setRates(prev => prev.map((r, i) => i === idx ? { ...r, rate_frequency: v } : r));
                      }} disabled={loadingRateMeta}>
                        <MenuItem value=""><em>Select...</em></MenuItem>
                        {rateFrequencies.map(rf => (
                          <MenuItem key={rf.rate_frequency_id} value={rf.rate_frequency_id}>{rf.rate_frequency_name}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Start Date</Typography>
                      <TextField type="date" fullWidth value={row.date_applicable ?? ''} onChange={(e) => {
                        setRates(prev => prev.map((r, i) => i === idx ? { ...r, date_applicable: e.target.value } : r));
                      }} InputLabelProps={{ shrink: true }} />
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>End Date</Typography>
                      <TextField type="date" fullWidth value={row.date_end ?? ''} onChange={(e) => {
                        setRates(prev => prev.map((r, i) => i === idx ? { ...r, date_end: e.target.value } : r));
                      }} InputLabelProps={{ shrink: true }} />
                    </Grid>
                  </Grid>

                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    {/* Row 2: Bill, Pay, Margin (readonly), Remove */}
                    <Grid item xs={12} md={3}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Bill Rate</Typography>
                      <TextField type="number" fullWidth value={row.bill_rate ?? ''} onChange={(e) => {
                        setRates(prev => prev.map((r, i) => i === idx ? { ...r, bill_rate: e.target.value } : r));
                      }} />
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Pay Rate</Typography>
                      <TextField type="number" fullWidth value={row.pay_rate ?? ''} onChange={(e) => {
                        setRates(prev => prev.map((r, i) => i === idx ? { ...r, pay_rate: e.target.value } : r));
                      }} />
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Margin</Typography>
                      <TextField fullWidth value={margin} disabled />
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Cost Center</Typography>
                      <TextField select fullWidth value={row.tcccc_id || ''} onChange={(e) => {
                        const value = e.target.value;
                        setRates(prev => prev.map((r, i) => i === idx ? { ...r, tcccc_id: value } : r));
                        setOpenCcIndex(null);
                      }} SelectProps={{ open: openCcIndex === idx, onOpen: () => setOpenCcIndex(idx), onClose: () => setOpenCcIndex(null) }}>
                        <MenuItem value=""><em>None</em></MenuItem>
                        {pccCostCenters.map((cc) => (
                          <MenuItem key={cc.relationship_id} value={cc.relationship_id}>
                            {cc.cc_name} ({cc.cc_number})
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'end', gap: 1 }}>
                      {confirmDeleteIndex === idx ? (
                        <>
                          <IconButton color="success" aria-label="confirm delete" onClick={async () => {
                            try {
                              if (row.id) {
                                await candidatesAPI.deleteRate(Number(row.id));
                                if (clientRelationships.length > 0) {
                                  const pccId = clientRelationships[0].pcc_id;
                                  const refreshed = await candidatesAPI.getRatesByPcc(pccId);
                                  setRates(refreshed.length ? refreshed.map(r => ({
                                    id: r.id,
                                    rate_type: r.rate_type,
                                    rate_frequency: r.rate_frequency,
                                    pay_rate: r.pay_rate != null ? String(r.pay_rate) : '',
                                    bill_rate: r.bill_rate != null ? String(r.bill_rate) : '',
                                    date_applicable: r.date_applicable || '',
                                    date_end: r.date_end || ''
                                  })) : [{ rate_type: '', rate_frequency: '', pay_rate: '', bill_rate: '', date_applicable: '', date_end: '' }]);
                                } else {
                                  setRates(prev => prev.filter((_, i) => i !== idx));
                                }
                              } else {
                                setRates(prev => prev.filter((_, i) => i !== idx));
                              }
                            } catch (e) {
                              console.error('❌ Failed to remove rate', e);
                            } finally {
                              setConfirmDeleteIndex(null);
                            }
                          }}>
                            <CheckIcon />
                          </IconButton>
                          <IconButton color="error" aria-label="cancel delete" onClick={() => setConfirmDeleteIndex(null)}>
                            <CloseIcon />
                          </IconButton>
                        </>
                      ) : (
                        <Button color="error" variant="outlined" onClick={() => setConfirmDeleteIndex(idx)} disabled={rates.length <= 1}>
                          Remove
                        </Button>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              );
            })}

            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button variant="outlined" onClick={() => setRates(prev => [...prev, { rate_type: '', rate_frequency: '', pay_rate: '', bill_rate: '', date_applicable: '', date_end: '' }])}>+ Add Rate</Button>
              <Box sx={{ flexGrow: 1 }} />
              <Button variant="contained" onClick={async () => {
                try {
                  if (!user_id) {
                    setToastSev('error');
                    setToastMsg('No candidate ID available');
                    setToastOpen(true);
                    return;
                  }
                  if (!selectedClientId) {
                    setToastSev('error');
                    setToastMsg('Please select a client first');
                    setToastOpen(true);
                    return;
                  }

                  // Prepare contract data
                  const contractData = {
                    candidate_id: user_id,
                    client_id: selectedClientId,
                    placement_date: placementDate || undefined,
                    contract_start_date: contractStartDate || undefined,
                    contract_end_date: contractEndDate || undefined,
                    status: 0,
                    rates: rates
                      .filter(r => r.rate_type !== '' && r.rate_frequency !== '')
                      .filter(r => !!(r.pay_rate || r.bill_rate || r.date_applicable || r.date_end))
                      .map(r => ({
                        rate_type: Number(r.rate_type),
                        rate_frequency: Number(r.rate_frequency),
                        pay_rate: r.pay_rate ? Number(r.pay_rate) : undefined,
                        bill_rate: r.bill_rate ? Number(r.bill_rate) : undefined,
                        date_applicable: r.date_applicable || undefined,
                        date_end: r.date_end || undefined,
                        tcccc_id: r.tcccc_id || undefined,
                      })),
                    pcc_id: clientRelationships.length > 0 ? clientRelationships[0].pcc_id : undefined,
                    tcr_ids: rates.filter(r => r.id).map(r => r.id).filter((id): id is number => typeof id === 'number')
                  };

                  console.log('🚀 Creating/updating contract with rates:', contractData);
                  const result = await candidatesAPI.createContractWithRates(contractData);
                  
                  // Update local state with the result
                  setClientRelationships([{
                    pcc_id: result.pcc_id,
                    candidate_id: result.candidate_id,
                    client_id: result.client_id,
                    placement_date: result.placement_date,
                    contract_start_date: result.contract_start_date,
                    contract_end_date: result.contract_end_date,
                    status: result.status,
                    created_on: result.created_on
                  }]);

                  // Update rates with the returned data
                  setRates(result.rates.length ? result.rates.map(r => ({
                    id: r.id,
                    rate_type: r.rate_type,
                    rate_frequency: r.rate_frequency,
                    pay_rate: r.pay_rate != null ? String(r.pay_rate) : '',
                    bill_rate: r.bill_rate != null ? String(r.bill_rate) : '',
                    date_applicable: r.date_applicable || '',
                    date_end: r.date_end || '',
                    tcccc_id: (r as any).tcccc_id || ''
                  })) : [{ rate_type: '', rate_frequency: '', pay_rate: '', bill_rate: '', date_applicable: '', date_end: '' }]);

                  console.log('✅ Contract and rates saved successfully');
                  setToastSev('success');
                  setToastMsg('Contract and rates saved successfully!');
                  setToastOpen(true);
                } catch (e) {
                  console.error('❌ Failed to save contract and rates', e);
                  setToastSev('error');
                  setToastMsg('Failed to save contract and rates');
                  setToastOpen(true);
                }
              }}>Save Contract & Rates</Button>
            </Box>
          </Paper>
        )}

        {tab === 'cost-center' && (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Cost Center Assignment
            </Typography>
            <Grid container spacing={2}>
              {selectedCostCenters.map((costCenter, index) => (
                <Grid item xs={12} key={index}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={4}>
                        <TextField
                          select
                          fullWidth
                          label="Select Cost Center"
                          value={costCenter.cc_id || ''}
                          onChange={(e) => {
                            const selectedCC = costCenters.find(cc => cc.id === e.target.value);
                            const updated = [...selectedCostCenters];
                            updated[index] = {
                              ...costCenter,
                              cc_id: e.target.value,
                              cc_name: selectedCC?.cc_name || '',
                              cc_number: selectedCC?.cc_number || ''
                            };
                            setSelectedCostCenters(updated);
                          }}
                          disabled={loadingCostCenters}
                        >
                          <MenuItem value="">
                            <em>Select a cost center</em>
                          </MenuItem>
                          {costCenters.map((cc) => (
                            <MenuItem key={cc.id} value={cc.id}>
                              {cc.cc_name} ({cc.cc_number})
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="Center Name"
                          value={costCenter.cc_name || ''}
                          disabled
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="Cost Center Code"
                          value={costCenter.cc_number || ''}
                          disabled
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={async () => {
                            const costCenterToRemove = selectedCostCenters[index];
                            
                            // If it's an existing assignment, remove it from the database
                            if (costCenterToRemove.relationship_id) {
                              try {
                                await candidatesAPI.removeCostCenter(user_id!, costCenterToRemove.relationship_id);
                                console.log('Removed existing cost center assignment:', costCenterToRemove.relationship_id);
                              } catch (error) {
                                console.error('Failed to remove cost center assignment:', error);
                                setToastSev('error');
                                setToastMsg('Failed to remove cost center assignment');
                                setToastOpen(true);
                                return;
                              }
                            }
                            
                            // Remove from UI
                            const updated = selectedCostCenters.filter((_, i) => i !== index);
                            setSelectedCostCenters(updated);
                          }}
                        >
                          Remove
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
              
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSelectedCostCenters([...selectedCostCenters, { cc_id: '', cc_name: '', cc_number: '' }]);
                  }}
                  disabled={loadingCostCenters}
                >
                  + Add Cost Center
                </Button>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={async () => {
                      try {
                        setLoadingCostCenters(true);
                        
                        // Get existing assignments to compare
                        const existingAssignments = await candidatesAPI.getCostCenters(user_id!);
                        const existingIds = existingAssignments.map((a: any) => a.relationship_id);
                        
                        // Process each selected cost center
                        for (const costCenter of selectedCostCenters) {
                          if (costCenter.cc_id) {
                            if (costCenter.relationship_id && existingIds.includes(costCenter.relationship_id)) {
                              // Update existing assignment
                              console.log('Updating existing cost center assignment:', costCenter.relationship_id);
                              // For now, we'll skip updates since the API doesn't have an update endpoint
                              // In a real implementation, you'd call an update API here
                            } else {
                              // Create new assignment
                              console.log('Creating new cost center assignment:', costCenter.cc_id);
                              await candidatesAPI.assignCostCenter(user_id!, {
                                pcc_id: clientRelationships[0]?.pcc_id, // Use first client relationship
                                cc_id: costCenter.cc_id,
                                sort_order: selectedCostCenters.indexOf(costCenter) + 1
                              });
                            }
                          }
                        }
                        
                        // Remove assignments that are no longer selected
                        for (const existingId of existingIds) {
                          const stillSelected = selectedCostCenters.some(cc => cc.relationship_id === existingId);
                          if (!stillSelected) {
                            console.log('Removing cost center assignment:', existingId);
                            await candidatesAPI.removeCostCenter(user_id!, existingId);
                          }
                        }
                        
                        setToastSev('success');
                        setToastMsg('Cost centers assigned successfully!');
                        setToastOpen(true);
                        
                        // Reload the assignments to get the updated data
                        loadExistingCostCenterAssignments(user_id!);
                      } catch (error) {
                        console.error('Failed to assign cost centers:', error);
                        setToastSev('error');
                        setToastMsg('Failed to assign cost centers');
                        setToastOpen(true);
                      } finally {
                        setLoadingCostCenters(false);
                      }
                    }}
                    disabled={loadingCostCenters || selectedCostCenters.length === 0}
                  >
                    {loadingCostCenters ? 'Saving...' : 'Save Cost Centers'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        {tab === 'documents' && (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Documents</Typography>
              <Box>
                <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleFilesSelected} />
                <Button variant="contained" onClick={handleUploadClick}>Upload</Button>
              </Box>
            </Box>

            <Grid container spacing={2}>
              {/* Documents list rendering */}
            </Grid>
          </Paper>
        )}

        <Snackbar
          open={toastOpen}
          autoHideDuration={3000}
          onClose={() => setToastOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <MuiAlert elevation={6} variant="filled" severity={toastSev} onClose={() => setToastOpen(false)}>
            {toastMsg}
          </MuiAlert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default Candidate;

