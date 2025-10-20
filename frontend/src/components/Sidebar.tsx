import React from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaidIcon from '@mui/icons-material/Paid';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import BarChartIcon from '@mui/icons-material/BarChart';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { label: 'Client', icon: <WorkOutlineIcon />, path: '/client' },
    { label: 'Candidate', icon: <PersonIcon />, path: '/candidate' },
    { label: 'Timesheet', icon: <AssignmentIcon />, path: '/timesheet' },
    { label: 'Invoice', icon: <ReceiptIcon />, path: '/invoices' },
    { label: 'Payroll', icon: <PaidIcon />, path: '/payroll' },
    { label: 'Holiday', icon: <BeachAccessIcon />, path: '/holiday' },
    { label: 'Report', icon: <BarChartIcon />, path: '#' },
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
      {/* Logo Section */}
      <Box sx={{ pt: 2, pb: 1, display: 'flex', justifyContent: 'center' }}>
        <Logo size="medium" showText={true} color="white" />
      </Box>
      
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
              mb: 0.5,
            }}
          >
            <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
};

export default Sidebar;
