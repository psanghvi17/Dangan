import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaidIcon from '@mui/icons-material/Paid';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import BarChartIcon from '@mui/icons-material/BarChart';
import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 220;

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, title }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { label: 'Client', icon: <WorkOutlineIcon />, path: '/client' },
    { label: 'Candidate', icon: <PersonIcon />, path: '/candidate' },
    { label: 'Timesheet', icon: <AssignmentIcon />, path: '/timesheet' },
    { label: 'Invoice', icon: <ReceiptIcon />, path: '/invoices' },
    { label: 'Payroll', icon: <PaidIcon />, path: '#' },
    { label: 'Holiday', icon: <BeachAccessIcon />, path: '/holiday' },
    { label: 'Report', icon: <BarChartIcon />, path: '#' },
  ];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
      <Box sx={{ p: 2, typography: 'h6' }}>
        Company Logo
      </Box>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.label}
            selected={location.pathname === item.path}
            onClick={() => item.path !== '#' && navigate(item.path)}
            sx={{
              '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.12)' },
              '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
              color: 'primary.contrastText',
            }}
          >
            <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" sx={{ mr: 2, display: { md: 'none' } }} onClick={() => setMobileOpen(!mobileOpen)}>
            <MenuIcon />
          </IconButton>
          <IconButton color="inherit" sx={{ mr: 1 }} onClick={() => navigate(-1)}>
            <KeyboardBackspaceIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          {user && (
            <Typography variant="body2">{user.username}</Typography>
          )}
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', bgcolor: 'primary.main' } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { md: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default AppLayout;

