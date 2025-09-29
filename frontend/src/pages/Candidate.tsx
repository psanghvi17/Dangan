import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  Paper,
  MenuItem,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CloseIcon from '@mui/icons-material/Close';
import { candidatesAPI } from '../services/api';

type TabKey = 'personal' | 'account' | 'client' | 'documents';

const accountManagers = ['Kyle Abaca', 'Jane Doe', 'John Smith'];

const Candidate: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('personal');

  // Personal details
  const [employeeId, setEmployeeId] = useState('1001');
  const [pps, setPps] = useState('1001');
  const [firstName, setFirstName] = useState('Prince Etukudoh');
  const [lastName, setLastName] = useState('Edward');
  const [email, setEmail] = useState('edwardeurocleaningservices1@gmail.com');
  const [contact, setContact] = useState('contact no.');
  const [dob, setDob] = useState('10/1/1968');
  const [addr1, setAddr1] = useState('44 Harrington Street');
  const [addr2, setAddr2] = useState('');

  // Account details
  const [bic, setBic] = useState('AIBKIE2DXXX');
  const [iban, setIban] = useState('IE75AIBK933368112127039');
  const [accountEmail, setAccountEmail] = useState('edwardeurocleaningservices1@gmail.com');
  const [clientNameAcc, setClientNameAcc] = useState('Greenstar OSR_WEST DUB');

  // Client details + rates
  const [clientName, setClientName] = useState('Prince Greenstar OSR_WEST DUB');
  const [manager, setManager] = useState(accountManagers[0]);
  const [hourlyPay, setHourlyPay] = useState('150');
  const [hourlyBill, setHourlyBill] = useState('100');
  const [weekendPay, setWeekendPay] = useState('160');
  const [weekendBill, setWeekendBill] = useState('120');
  const [bankHolidayPay, setBankHolidayPay] = useState('170');
  const [bankHolidayBill, setBankHolidayBill] = useState('130');
  const [overtimePay, setOvertimePay] = useState('140');
  const [overtimeBill, setOvertimeBill] = useState('120');

  // Documents tab
  const [docs, setDocs] = useState<string[]>(['ID Proof.Pdf', 'Passport.Pdf']);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const handleUploadClick = () => fileInputRef.current?.click();
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).map((f) => f.name);
    if (files.length) setDocs((prev) => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const removeDoc = (name: string) => setDocs((prev) => prev.filter((n) => n !== name));

  const TabButton: React.FC<{ k: TabKey; label: string }> = ({ k, label }) => (
    <Button
      variant={tab === k ? 'contained' : 'outlined'}
      color={tab === k ? 'primary' : 'inherit'}
      onClick={() => setTab(k)}
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
                  alert('User created successfully!');
                  console.log('Created user:', result);
                } catch (error) {
                  console.error('Failed to create user:', error);
                  alert('Failed to create user. Please check the console for details.');
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
                  <Button variant="contained">Save</Button>
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
                  <Button variant="contained">Save</Button>
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
              <Button variant="contained">Save</Button>
            </Box>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default Candidate;

