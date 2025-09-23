import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import AppLayout from './components/AppLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Items from './pages/Items';
import Client from './pages/Client';
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
          <Route path="/client" element={<Client />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </AuthProvider>
  );
}

export default App;
