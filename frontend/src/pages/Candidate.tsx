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
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CloseIcon from '@mui/icons-material/Close';
import { candidatesAPI } from '../services/api';

type TabKey = 'personal' | 'account' | 'client' | 'documents';

const accountManagers = ['Kyle Abaca', 'Jane Doe', 'John Smith'];

const Candidate: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('personal');
  
  // Notification state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastSev, setToastSev] = useState<'success' | 'error'>('success');

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
  const [manager, setManager] = useState(accountManagers[0]);
  const [hourlyPay, setHourlyPay] = useState('');
  const [hourlyBill, setHourlyBill] = useState('');
  const [weekendPay, setWeekendPay] = useState('');
  const [weekendBill, setWeekendBill] = useState('');
  const [bankHolidayPay, setBankHolidayPay] = useState('');
  const [bankHolidayBill, setBankHolidayBill] = useState('');
  const [overtimePay, setOvertimePay] = useState('');
  const [overtimeBill, setOvertimeBill] = useState('');

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
    setManager(accountManagers[0]);
    setHourlyPay('');
    setHourlyBill('');
    setWeekendPay('');
    setWeekendBill('');
    setBankHolidayPay('');
    setBankHolidayBill('');
    setOvertimePay('');
    setOvertimeBill('');
    setDocs([]);
  };

  // Reset form on component mount
  useEffect(() => {
    resetForm();
  }, []);

  const TabButton: React.FC<{ k: TabKey; label: string }> = ({ k, label }) => (
    <Button
      variant={tab === k ? 'contained' : 'outlined'}
      color={tab === k ? 'primary' : 'inherit'}
      onClick={() => {
        console.log('Tab clicked:', k);
        setTab(k);
      }}
      sx={{ borderRadius: 999, px: 3 }}
    >
      {label}
    </Button>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Candidate
        </Typography>

        <Paper elevation={0} sx={{ mb: 3, bgcolor: 'background.default' }}>
          <Box sx={{ display: 'flex', gap: 2, p: 1, flexWrap: 'wrap' }}>
            <TabButton k="personal" label="Personal Details" />
            <TabButton k="account" label="Account Details" />
            <TabButton k="client" label="Client Details" />
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
                  const result = await candidatesAPI.create({
                    first_name: firstName,
                    last_name: lastName,
                    email_id: email,
                  });
                  setToastSev('success');
                  setToastMsg('Candidate created successfully!');
                  setToastOpen(true);
                  console.log('Created user:', result);
                } catch (error) {
                  console.error('Failed to create user:', error);
                  setToastSev('error');
                  setToastMsg('Failed to create candidate. Please check the console for details.');
                  setToastOpen(true);
                }
              }}>Save</Button>
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
                <TextField fullWidth value={dob} onChange={(e) => setDob(e.target.value)} />
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
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Client Name</Typography>
                <TextField fullWidth value={clientName} onChange={(e) => setClientName(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Account Manager</Typography>
                <TextField select fullWidth value={manager} onChange={(e) => setManager(e.target.value)}>
                  {accountManagers.map((m) => (
                    <MenuItem key={m} value={m}>{m}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>
              Rate Types
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Hourly</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption">Pay Rate</Typography>
                    <TextField fullWidth value={hourlyPay} onChange={(e) => setHourlyPay(e.target.value)} />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption">Bill Rate</Typography>
                    <TextField fullWidth value={hourlyBill} onChange={(e) => setHourlyBill(e.target.value)} />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Weekend</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption">Pay Rate</Typography>
                    <TextField fullWidth value={weekendPay} onChange={(e) => setWeekendPay(e.target.value)} />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption">Bill Rate</Typography>
                    <TextField fullWidth value={weekendBill} onChange={(e) => setWeekendBill(e.target.value)} />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Bank Holiday</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption">Pay Rate</Typography>
                    <TextField fullWidth value={bankHolidayPay} onChange={(e) => setBankHolidayPay(e.target.value)} />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption">Bill Rate</Typography>
                    <TextField fullWidth value={bankHolidayBill} onChange={(e) => setBankHolidayBill(e.target.value)} />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Overtime</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption">Pay Rate</Typography>
                    <TextField fullWidth value={overtimePay} onChange={(e) => setOvertimePay(e.target.value)} />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption">Bill Rate</Typography>
                    <TextField fullWidth value={overtimeBill} onChange={(e) => setOvertimeBill(e.target.value)} />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button variant="contained" onClick={() => {
                    setToastSev('success');
                    setToastMsg('Client details saved successfully!');
                    setToastOpen(true);
                  }}>Save</Button>
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
              {docs.map((name) => (
                <Grid item key={name}>
                  <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 180 }}>
                    <PictureAsPdfIcon color="error" />
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>{name}</Typography>
                    <Button size="small" onClick={() => removeDoc(name)} sx={{ minWidth: 0, p: 0.5 }}>
                      <CloseIcon fontSize="small" />
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button variant="contained" onClick={() => {
                setToastSev('success');
                setToastMsg('Documents saved successfully!');
                setToastOpen(true);
              }}>Save</Button>
            </Box>
          </Paper>
        )}
      </Box>
      
      {/* Notification Snackbar */}
      <Snackbar 
        open={toastOpen} 
        autoHideDuration={3000} 
        onClose={() => setToastOpen(false)} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert onClose={() => setToastOpen(false)} severity={toastSev} elevation={6} variant="filled">
          {toastMsg}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};

export default Candidate;

