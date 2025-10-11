import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Drawer,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';

const drawerWidth = 220;

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, title }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = React.useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, mUser, logout } = useAuth();

  // Get current page name
  const getCurrentPageName = () => {
    const navItems = [
      { label: 'Dashboard', path: '/' },
      { label: 'Client', path: '/client' },
      { label: 'Candidate', path: '/candidate' },
      { label: 'Timesheet', path: '/timesheet' },
      { label: 'Invoice', path: '/invoices' },
      { label: 'Payroll', path: '#' },
      { label: 'Holiday', path: '/holiday' },
      { label: 'Report', path: '#' },
    ];
    const currentItem = navItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.label : title || 'Dashboard';
  };

  // Get user display name
  const getUserDisplayName = () => {
    return mUser?.first_name || user?.username || 'User';
  };

  // Handle profile menu
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
    navigate('/login');
  };

  const drawer = <Sidebar />;

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'white',
          color: 'black',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          left: { md: `${drawerWidth}px` }, // Push header to the right on desktop
          width: { md: `calc(100% - ${drawerWidth}px)` }, // Adjust width for desktop
        }}
      >
        <Toolbar sx={{ justifyContent: 'flex-end' }}>

          {/* Right side - User Profile */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                borderRadius: 1,
                px: 2,
                py: 1
              }}
              onClick={handleProfileMenuOpen}
            >
              <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: '#1976d2' }}>
                {getUserDisplayName().charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="body1" sx={{ color: '#1976d2', fontWeight: '500' }}>
                {getUserDisplayName()}
              </Typography>
              <KeyboardArrowDownIcon sx={{ color: '#666', ml: 0.5 }} />
            </Box>
            
            <Menu
              anchorEl={profileMenuAnchor}
              open={Boolean(profileMenuAnchor)}
              onClose={handleProfileMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
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
        <Box sx={{ mt: 2 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;

