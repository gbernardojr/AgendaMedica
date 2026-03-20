import { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import theme from './theme';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import Pacientes from './pages/Pacientes';
import Profissionais from './pages/Profissionais';
import Procedimentos from './pages/Procedimentos';
import Usuarios from './pages/Usuarios';
import axios from 'axios';
import './index.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLogin = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  useMemo(() => {
    axios.defaults.baseURL = 'http://localhost:5000';
    axios.defaults.headers.common['Authorization'] = token ? `Bearer ${token}` : '';

    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 422)) {
          const isLoginEndpoint = error.config?.url?.includes('/login');
          if (!isLoginEndpoint) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/') window.location.href = '/';
          }
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptorId);
  }, [token]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ minHeight: '100vh' }}>
          <Routes>
            <Route 
              path="/" 
              element={token ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} 
            />
            <Route 
              path="/dashboard" 
              element={token ? <Layout user={user} onLogout={handleLogout}><Dashboard user={user} /></Layout> : <Navigate to="/" />} 
            />
            <Route 
              path="/pacientes" 
              element={token ? <Layout user={user} onLogout={handleLogout}><Pacientes /></Layout> : <Navigate to="/" />} 
            />
            <Route 
              path="/profissionais" 
              element={token ? <Layout user={user} onLogout={handleLogout}><Profissionais /></Layout> : <Navigate to="/" />} 
            />
            <Route 
              path="/procedimentos" 
              element={token ? <Layout user={user} onLogout={handleLogout}><Procedimentos /></Layout> : <Navigate to="/" />} 
            />
            <Route 
              path="/usuarios" 
              element={token && user?.admin ? <Layout user={user} onLogout={handleLogout}><Usuarios /></Layout> : <Navigate to="/" />} 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
