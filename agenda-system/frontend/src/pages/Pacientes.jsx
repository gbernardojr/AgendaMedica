import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, IconButton, TextField, Dialog, 
  DialogTitle, DialogContent, DialogActions, Grid, Tooltip, InputAdornment 
} from '@mui/material';
import { Plus, Search, Edit2, Trash2, User } from 'lucide-react';
import axios from 'axios';

const Pacientes = () => {
  const [pacientes, setPacientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [formData, setFormData] = useState({
    pac_nome: '', pac_telefone: '', pac_email: '', pac_sexo: 'M'
  });

  const fetchPacientes = async () => {
    try {
      const res = await axios.get(`/pacientes?q=${searchTerm}`);
      setPacientes(res.data);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
    }
  };

  useEffect(() => {
    fetchPacientes();
  }, [searchTerm]);

  const handleOpen = (pac = null) => {
    if (pac) {
      setSelectedPaciente(pac);
      setFormData({
        pac_nome: pac.nome,
        pac_telefone: pac.tel || '',
        pac_email: pac.email || '',
        pac_sexo: pac.sexo || 'M'
      });
    } else {
      setSelectedPaciente(null);
      setFormData({ pac_nome: '', pac_telefone: '', pac_email: '', pac_sexo: 'M' });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedPaciente) {
        await axios.put(`/pacientes/${selectedPaciente.id}`, formData);
      } else {
        await axios.post('/pacientes', formData);
      }
      setOpen(false);
      fetchPacientes();
    } catch (error) {
      alert('Erro ao salvar paciente');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deseja realmente excluir este paciente?')) {
      try {
        await axios.delete(`/pacientes/${id}`);
        fetchPacientes();
      } catch (error) {
        alert('Erro ao excluir');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>Clientes</Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>Gerencie o cadastro de pacientes</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Plus size={20} />}
          onClick={() => handleOpen()}
          sx={{ 
            borderRadius: 2, 
            px: 3, 
            bgcolor: '#2563eb',
            '&:hover': { bgcolor: '#1d4ed8' },
            textTransform: 'none',
            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
          }}
        >
          Novo Cliente
        </Button>
      </Box>

      <Paper sx={{ p: 0, borderRadius: 3, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0' }}>
          <TextField
            fullWidth
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} color="#94a3b8" />
                </InputAdornment>
              ),
              sx: { borderRadius: 2, bgcolor: '#f8fafc' }
            }}
          />
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Nome</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Telefone</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>E-mail</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#64748b' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pacientes.map((pac) => (
                <TableRow key={pac.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ p: 1, bgcolor: '#eff6ff', borderRadius: 1.5 }}>
                        <User size={18} color="#2563eb" />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                        {pac.nome}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#64748b' }}>{pac.tel || '-'}</TableCell>
                  <TableCell sx={{ color: '#64748b' }}>{pac.email || '-'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleOpen(pac)} size="small" sx={{ color: '#3b82f6' }}>
                        <Edit2 size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton onClick={() => handleDelete(pac.id)} size="small" sx={{ color: '#ef4444' }}>
                        <Trash2 size={18} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {pacientes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                    Nenhum paciente encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {selectedPaciente ? 'Editar Cliente' : 'Novo Cliente'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField 
                fullWidth label="Nome Completo" 
                value={formData.pac_nome} 
                onChange={(e) => setFormData({...formData, pac_nome: e.target.value})}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField 
                fullWidth label="Telefone" 
                value={formData.pac_telefone} 
                onChange={(e) => setFormData({...formData, pac_telefone: e.target.value})}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField 
                fullWidth label="E-mail" 
                value={formData.pac_email} 
                onChange={(e) => setFormData({...formData, pac_email: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: '#64748b' }}>Cancelar</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            sx={{ borderRadius: 2, bgcolor: '#2563eb', px: 4 }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Pacientes;
