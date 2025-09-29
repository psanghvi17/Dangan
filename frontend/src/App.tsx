import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Items from './pages/Items';
import Client from './pages/Client';
import EditClient from './pages/EditClient';
import Candidate from './pages/Candidate';
import Timesheet from './pages/Timesheet';
import Holiday from './pages/Holiday';
import ManageClient from './pages/ManageClient';
import ManageCandidate from './pages/ManageCandidate';
import TimesheetList from './pages/TimesheetList';
import { AuthProvider } from './contexts/AuthContext';
// Removed ProtectedRoute for now to make routes public

function App() {
  return (
    <AuthProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/items" element={<Items />} />
          {/** Client: list at /client, manage at /client/manage-client, edit at /client/edit/:clientId */}
          <Route path="/client" element={<ManageClient />} />
          <Route path="/client/manage-client" element={<Client />} />
          <Route path="/client/edit/:clientId" element={<EditClient />} />

          {/** Candidate: list at /candidate, manage at /candidate/manage-candidate */}
          <Route path="/candidate" element={<ManageCandidate />} />
          <Route path="/candidate/manage-candidate" element={<Candidate />} />

          {/** Timesheet: list at /timesheet, manage at /timesheet/manage-timesheet/:timesheetId? */}
          <Route path="/timesheet" element={<TimesheetList />} />
          <Route path="/timesheet/manage-timesheet" element={<Timesheet />} />
          <Route path="/timesheet/manage-timesheet/:timesheetId" element={<Timesheet />} />
          <Route path="/holiday" element={<Holiday />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </AuthProvider>
  );
}

export default App;
