import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { user, mUser } = useAuth();

  // Get user display name
  const getUserDisplayName = () => {
    return mUser?.first_name || user?.username || 'User';
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" component="p" gutterBottom color="text.secondary" sx={{ mb: 3 }}>
          A modern web application built with React, FastAPI, and PostgreSQL
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  FastAPI Backend
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Modern, fast web framework for building APIs with Python
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  React Frontend
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  TypeScript-based React application with Material-UI
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  PostgreSQL Database
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Robust, open-source relational database system
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {(user || mUser) && (
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Hello, {getUserDisplayName()}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              You are successfully logged in. Navigate to the Items page to manage your data.
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default Home;
