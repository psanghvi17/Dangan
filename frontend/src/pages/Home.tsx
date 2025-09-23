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
  const { user } = useAuth();

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Welcome to Dangan
        </Typography>
        <Typography variant="h6" component="p" gutterBottom align="center" color="text.secondary">
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

        {user && (
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Hello, {user.username}!
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
