import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  logoUrl?: string;
  color?: 'primary' | 'white';
}

const Logo: React.FC<LogoProps> = ({ size = 'medium', showText = true, logoUrl, color = 'primary' }) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: 32, height: 32, fontSize: '1rem' };
      case 'large':
        return { width: 48, height: 48, fontSize: '1.8rem' };
      default:
        return { width: 40, height: 40, fontSize: '1.5rem' };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {/* Logo Icon/Image */}
      {logoUrl ? (
        <Avatar
          src={logoUrl}
          alt="Dangan Logo"
          sx={{
            width: sizeStyles.width,
            height: sizeStyles.height,
            mr: showText ? 2 : 0,
          }}
        />
      ) : (
        <Box
          sx={{
            width: sizeStyles.width,
            height: sizeStyles.height,
            backgroundColor: color === 'white' ? 'white' : '#1976d2',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: showText ? 2 : 0,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: color === 'white' ? '#1976d2' : 'white',
              fontWeight: 'bold',
              fontSize: sizeStyles.fontSize,
            }}
          >
            D
          </Typography>
        </Box>
      )}
      
      {/* Logo Text */}
      {showText && (
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
            color: color === 'white' ? 'white' : '#1976d2',
            fontSize: sizeStyles.fontSize,
          }}
        >
          Dangan
        </Typography>
      )}
    </Box>
  );
};

export default Logo;
    