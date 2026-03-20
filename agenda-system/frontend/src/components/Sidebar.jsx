import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Typography, 
  Divider,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Calendar, 
  Users, 
  Stethoscope, 
  ClipboardList, 
  UserCog, 
  LogOut,
  ChevronLeft
} from 'lucide-react';

const Sidebar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const drawerWidth = 260;

  const menuItems = [
    { text: 'Profissional / Agenda', icon: <Calendar size={20} />, path: '/dashboard', perm: 'agenda' },
    { text: 'Novo Cliente', icon: <Users size={20} />, path: '/pacientes', perm: 'clientes' },
    { text: 'Novo Profissional', icon: <Stethoscope size={20} />, path: '/profissionais', perm: 'profissionais' },
    { text: 'Novo Procedimento', icon: <ClipboardList size={20} />, path: '/procedimentos', perm: 'procedimentos' },
  ];

  // Only show users menu if user is admin
  if (user?.admin) {
    menuItems.push({ text: 'Novo Usuário', icon: <UserCog size={20} />, path: '/usuarios', perm: 'admin' });
  }

  const isSelected = (path) => location.pathname === path;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          borderRight: 'none',
          boxShadow: '4px 0 10px rgba(0,0,0,0.1)'
        },
      }}
    >
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box 
          sx={{ 
            width: 40, 
            height: 40, 
            borderRadius: 1, 
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)'
          }}
        >
          <Calendar color="white" size={24} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: -0.5, color: '#f8fafc' }}>
          Agenda Klinis
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />

      <List sx={{ px: 2 }}>
        {menuItems.map((item) => {
          // Check permission
          const hasPerm = user?.admin || (user?.perms && user.perms[item.perm]);
          if (item.path !== '/dashboard' && item.path !== '/usuarios' && !hasPerm) return null;

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={isSelected(item.path)}
                sx={{
                  borderRadius: 2,
                  py: 1.2,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: '#60a5fa',
                    '& .MuiListItemIcon-root': { color: '#60a5fa' },
                    '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.2)' }
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.05)',
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: '#94a3b8' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontSize: '0.9rem', 
                    fontWeight: isSelected(item.path) ? 600 : 500 
                  }} 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ mt: 'auto', p: 2 }}>
        <Box 
          sx={{ 
            p: 2, 
            borderRadius: 3, 
            backgroundColor: 'rgba(255,255,255,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}
        >
          <Avatar 
            sx={{ 
              width: 36, 
              height: 36, 
              bgcolor: '#2563eb',
              fontSize: '0.9rem',
              fontWeight: 600
            }}
          >
            {user?.nome?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.nome}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              {user?.admin ? 'Administrador' : 'Profissional'}
            </Typography>
          </Box>
          <Tooltip title="Sair">
            <IconButton size="small" onClick={onLogout} sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}>
              <LogOut size={18} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
