import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, IconButton, TextField, Dialog, 
  DialogTitle, DialogContent, DialogActions, Grid, Tooltip
} from '@mui/material';
import { Plus, Edit2, Trash2, Stethoscope } from 'lucide-react';
import axios from 'axios';

const ProfissionaisPage = () => {
  const [profissionais, setProfissionais] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedProf, setSelectedProf] = useState(null);
  const [formData, setFormData] = useState({ crm: '', nome: '' });

  const fetchProfissionais = async () => {
    try {
      const res = await axios.get('/profissionais');
      setProfissionais(res.data);
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
    }
  };

  useEffect(() => {
    fetchProfissionais();
  }, []);

  const handleOpen = (prof = null) => {
    if (prof) {
      setSelectedProf(prof);
      setFormData({ crm: prof.crm, nome: prof.nome });
    } else {
      setSelectedProf(null);
      setFormData({ crm: '', nome: '' });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedProf) {
        await axios.put(`/profissionais/${selectedProf.crm}`, { nome: formData.nome });
      } else {
        await axios.post('/profissionais', formData);
      }
      setOpen(false);
      fetchProfissionais();
    } catch (error) {
      alert(error.response?.data?.msg || 'Erro ao salvar profissional');
    }
  };

  const handleDelete = async (crm) => {
    if (window.confirm('Deseja realmente excluir este profissional?')) {
      try {
        await axios.delete(`/profissionais/${crm}`);
        fetchProfissionais();
      } catch (error) {
        alert('Erro ao excluir');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>Profissionais</Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>Cadastre os fonoaudiólogos e outros profissionais da clínica</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Plus size={20} />}
          onClick={() => handleOpen()}
          sx={{ borderRadius: 2, px: 3, bgcolor: '#2563eb', textTransform: 'none' }}
        >
          Novo Profissional
        </Button>
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>CRM / Registro</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Nome</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {profissionais.map((p) => (
                <TableRow key={p.crm} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#2563eb' }}>{p.crm}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ p: 1, bgcolor: '#f0f9ff', borderRadius: 1.5 }}>
                        <Stethoscope size={18} color="#0369a1" />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{p.nome}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleOpen(p)} size="small" sx={{ color: '#3b82f6' }}><Edit2 size={18} /></IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton onClick={() => handleDelete(p.crm)} size="small" sx={{ color: '#ef4444' }}><Trash2 size={18} /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {selectedProf ? 'Editar Profissional' : 'Novo Profissional'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField 
                fullWidth label="CRM / Registro" 
                disabled={!!selectedProf}
                value={formData.crm} 
                onChange={(e) => setFormData({...formData, crm: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth label="Nome do Profissional" 
                value={formData.nome} 
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: '#64748b' }}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" sx={{ borderRadius: 2, bgcolor: '#2563eb', px: 4 }}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfissionaisPage;
