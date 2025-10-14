import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Items from './pages/Items';
import Client from './pages/Client';
import Candidate from './pages/Candidate';
import Timesheet from './pages/Timesheet';
import Holiday from './pages/Holiday';
import ManageClient from './pages/ManageClient';
import ManageCandidate from './pages/ManageCandidate';
import TimesheetList from './pages/TimesheetList';
import Invoice from './pages/Invoice';
import ViewInvoice from './pages/ViewInvoice';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Authentication routes without sidebar */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Dashboard and other routes with sidebar - Protected */}
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout><Home /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/items" element={
          <ProtectedRoute>
            <AppLayout><Items /></AppLayout>
          </ProtectedRoute>
        } />
        
        {/** Client: list at /client, manage at /client/manage-client, edit at /client/edit/:clientId */}
        <Route path="/client" element={
          <ProtectedRoute>
            <AppLayout><ManageClient /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/client/manage-client" element={
          <ProtectedRoute>
            <AppLayout><Client /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/client/edit/:clientId" element={
          <ProtectedRoute>
            <AppLayout><Client /></AppLayout>
          </ProtectedRoute>
        } />

        {/** Candidate: list at /candidate, manage at /candidate/manage-candidate */}
        <Route path="/candidate" element={
          <ProtectedRoute>
            <AppLayout><ManageCandidate /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/candidate/manage-candidate" element={
          <ProtectedRoute>
            <AppLayout><Candidate /></AppLayout>
          </ProtectedRoute>
        } />

        {/** Timesheet: list at /timesheet, manage at /timesheet/manage-timesheet/:timesheetId? */}
        <Route path="/timesheet" element={
          <ProtectedRoute>
            <AppLayout><TimesheetList /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/timesheet/manage-timesheet" element={
          <ProtectedRoute>
            <AppLayout><Timesheet /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/timesheet/manage-timesheet/:timesheetId" element={
          <ProtectedRoute>
            <AppLayout><Timesheet /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/invoices" element={
          <ProtectedRoute>
            <AppLayout><Invoice /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/invoice/view-invoice/:invoiceId" element={
          <ProtectedRoute>
            <AppLayout><ViewInvoice /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/holiday" element={
          <ProtectedRoute>
            <AppLayout><Holiday /></AppLayout>
          </ProtectedRoute>
        } />
        
        {/* Redirect root to login if not authenticated */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
