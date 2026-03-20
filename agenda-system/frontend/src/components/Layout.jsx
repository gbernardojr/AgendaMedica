import React from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';

const Layout = ({ children, user, onLogout }) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f1f5f9' }}>
      <Sidebar user={user} onLogout={onLogout} />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 4, 
          width: { sm: `calc(100% - 260px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
