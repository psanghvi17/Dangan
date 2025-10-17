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
import InvoiceDownload from './pages/InvoiceDownload';
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
            <AppLayout title="Dashboard"><Home /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/items" element={
          <ProtectedRoute>
            <AppLayout title="Items"><Items /></AppLayout>
          </ProtectedRoute>
        } />
        
        {/** Client: list at /client, manage at /client/manage-client, edit at /client/edit/:clientId */}
        <Route path="/client" element={
          <ProtectedRoute>
            <AppLayout title="Client"><ManageClient /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/client/manage-client" element={
          <ProtectedRoute>
            <AppLayout title="Add Client"><Client /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/client/edit/:clientId" element={
          <ProtectedRoute>
            <AppLayout title="Edit Client"><Client /></AppLayout>
          </ProtectedRoute>
        } />

        {/** Candidate: list at /candidate, manage at /candidate/manage-candidate */}
        <Route path="/candidate" element={
          <ProtectedRoute>
            <AppLayout title="Candidate"><ManageCandidate /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/candidate/manage-candidate" element={
          <ProtectedRoute>
            <AppLayout title="Add Candidate"><Candidate /></AppLayout>
          </ProtectedRoute>
        } />

        {/** Timesheet: list at /timesheet, manage at /timesheet/manage-timesheet/:timesheetId? */}
        <Route path="/timesheet" element={
          <ProtectedRoute>
            <AppLayout title="Timesheet"><TimesheetList /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/timesheet/manage-timesheet" element={
          <ProtectedRoute>
            <AppLayout title="Add Timesheet"><Timesheet /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/timesheet/manage-timesheet/:timesheetId" element={
          <ProtectedRoute>
            <AppLayout title="Edit Timesheet"><Timesheet /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/invoices" element={
          <ProtectedRoute>
            <AppLayout title="Invoice"><Invoice /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/invoice/view-invoice/:invoiceId" element={
          <ProtectedRoute>
            <AppLayout title="View Invoice"><ViewInvoice /></AppLayout>
          </ProtectedRoute>
        } />
        {/* Minimal download route without AppLayout */}
        <Route path="/invoice/download/:invoiceId" element={
          <ProtectedRoute>
            <InvoiceDownload />
          </ProtectedRoute>
        } />
        <Route path="/holiday" element={
          <ProtectedRoute>
            <AppLayout title="Annual Leave"><Holiday /></AppLayout>
          </ProtectedRoute>
        } />
        
        {/* Redirect root to login if not authenticated */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
