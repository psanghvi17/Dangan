import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Paper,
  Avatar,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Button,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  Business,
  Assignment,
  AttachMoney,
  Schedule,
  CheckCircle,
  Warning,
  Info,
  Add,
  MoreVert,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { user, mUser } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Get user display name
  const getUserDisplayName = () => {
    return mUser?.first_name || user?.username || 'User';
  };

  // Mock data for dashboard stats
  const stats = [
    {
      title: 'Total Clients',
      value: '24',
      change: '+12%',
      trend: 'up',
      icon: <Business />,
      color: '#1976d2'
    },
    {
      title: 'Active Candidates',
      value: '156',
      change: '+8%',
      trend: 'up',
      icon: <People />,
      color: '#388e3c'
    },
    {
      title: 'Pending Timesheets',
      value: '12',
      change: '-3%',
      trend: 'down',
      icon: <Assignment />,
      color: '#f57c00'
    },
    {
      title: 'Monthly Revenue',
      value: '$45,230',
      change: '+15%',
      trend: 'up',
      icon: <AttachMoney />,
      color: '#7b1fa2'
    }
  ];

  const recentActivities = [
    { id: 1, action: 'New client added', user: 'John Smith', time: '2 minutes ago', type: 'success' },
    { id: 2, action: 'Timesheet approved', user: 'Sarah Johnson', time: '15 minutes ago', type: 'info' },
    { id: 3, action: 'Invoice generated', user: 'Mike Wilson', time: '1 hour ago', type: 'success' },
    { id: 4, action: 'Payment overdue', user: 'Client ABC', time: '2 hours ago', type: 'warning' },
    { id: 5, action: 'New candidate registered', user: 'Emily Davis', time: '3 hours ago', type: 'info' }
  ];

  const upcomingTasks = [
    { id: 1, task: 'Review Q4 invoices', priority: 'high', due: 'Today' },
    { id: 2, task: 'Update client contracts', priority: 'medium', due: 'Tomorrow' },
    { id: 3, task: 'Process payroll', priority: 'high', due: 'Friday' },
    { id: 4, task: 'Generate monthly report', priority: 'low', due: 'Next week' }
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h6" color="text.secondary">
              Welcome back, {getUserDisplayName()}! Here's what's happening today.
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6" color="text.secondary">
              {currentTime.toLocaleDateString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentTime.toLocaleTimeString()}
            </Typography>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="body2">
                        {stat.title}
                      </Typography>
                      <Typography variant="h4" component="div">
                        {stat.value}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        {stat.trend === 'up' ? (
                          <TrendingUp color="success" sx={{ fontSize: 16, mr: 0.5 }} />
                        ) : (
                          <TrendingDown color="error" sx={{ fontSize: 16, mr: 0.5 }} />
                        )}
                        <Typography 
                          variant="body2" 
                          color={stat.trend === 'up' ? 'success.main' : 'error.main'}
                        >
                          {stat.change}
                        </Typography>
                      </Box>
                    </Box>
                    <Avatar sx={{ bgcolor: stat.color, width: 56, height: 56 }}>
                      {stat.icon}
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Recent Activities */}
          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Recent Activities</Typography>
                  <Button size="small" startIcon={<Add />}>
                    Add Activity
                  </Button>
                </Box>
                <List>
                  {recentActivities.map((activity, index) => (
                    <React.Fragment key={activity.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            bgcolor: activity.type === 'success' ? 'success.main' : 
                                    activity.type === 'warning' ? 'warning.main' : 'info.main',
                            width: 40,
                            height: 40
                          }}>
                            {activity.type === 'success' ? <CheckCircle /> :
                             activity.type === 'warning' ? <Warning /> : <Info />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={activity.action}
                          secondary={`${activity.user} • ${activity.time}`}
                        />
                        <IconButton edge="end">
                          <MoreVert />
                        </IconButton>
                      </ListItem>
                      {index < recentActivities.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Upcoming Tasks */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Upcoming Tasks
                </Typography>
                <List>
                  {upcomingTasks.map((task, index) => (
                    <React.Fragment key={task.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            bgcolor: task.priority === 'high' ? 'error.main' : 
                                    task.priority === 'medium' ? 'warning.main' : 'info.main',
                            width: 32,
                            height: 32
                          }}>
                            <Schedule />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={task.task}
                          secondary={`Due: ${task.due}`}
                        />
                        <Chip 
                          label={task.priority} 
                          size="small"
                          color={task.priority === 'high' ? 'error' : 
                                 task.priority === 'medium' ? 'warning' : 'default'}
                        />
                      </ListItem>
                      {index < upcomingTasks.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Progress Chart */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly Progress
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Client Onboarding</Typography>
                    <Typography variant="body2">85%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={85} sx={{ height: 8, borderRadius: 4 }} />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Timesheet Completion</Typography>
                    <Typography variant="body2">72%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={72} sx={{ height: 8, borderRadius: 4 }} />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Invoice Processing</Typography>
                    <Typography variant="body2">94%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={94} sx={{ height: 8, borderRadius: 4 }} />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Payment Collection</Typography>
                    <Typography variant="body2">68%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={68} sx={{ height: 8, borderRadius: 4 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      startIcon={<Business />}
                      sx={{ mb: 1 }}
                    >
                      Add Client
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button 
                      variant="outlined" 
                      fullWidth 
                      startIcon={<People />}
                      sx={{ mb: 1 }}
                    >
                      Add Candidate
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button 
                      variant="outlined" 
                      fullWidth 
                      startIcon={<Assignment />}
                      sx={{ mb: 1 }}
                    >
                      Create Timesheet
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button 
                      variant="outlined" 
                      fullWidth 
                      startIcon={<AttachMoney />}
                      sx={{ mb: 1 }}
                    >
                      Generate Invoice
                    </Button>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary" align="center">
                  Last updated: {new Date().toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Home;
