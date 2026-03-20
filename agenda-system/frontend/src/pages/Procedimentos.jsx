import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, IconButton, TextField, Dialog, 
  DialogTitle, DialogContent, DialogActions, Grid, Tooltip, InputAdornment 
} from '@mui/material';
import { Plus, Edit2, Trash2, ClipboardList } from 'lucide-react';
import axios from 'axios';

const Procedimentos = () => {
  const [procedimentos, setProcedimentos] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedProc, setSelectedProc] = useState(null);
  const [formData, setFormData] = useState({ nome: '', valor: 0 });

  const fetchProcedimentos = async () => {
    try {
      const res = await axios.get('/procedimentos');
      setProcedimentos(res.data);
    } catch (error) {
      console.error('Erro ao buscar procedimentos:', error);
    }
  };

  useEffect(() => {
    fetchProcedimentos();
  }, []);

  const handleOpen = (proc = null) => {
    if (proc) {
      setSelectedProc(proc);
      setFormData({ nome: proc.nome, valor: proc.valor });
    } else {
      setSelectedProc(null);
      setFormData({ nome: '', valor: 0 });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedProc) {
        await axios.put(`/procedimentos/${selectedProc.id}`, formData);
      } else {
        await axios.post('/procedimentos', formData);
      }
      setOpen(false);
      fetchProcedimentos();
    } catch (error) {
      alert('Erro ao salvar procedimento');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deseja realmente excluir este procedimento?')) {
      try {
        await axios.delete(`/procedimentos/${id}`);
        fetchProcedimentos();
      } catch (error) {
        alert('Erro ao excluir');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>Procedimentos</Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>Liste e gerencie os tipos de atendimentos e seus valores</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Plus size={20} />}
          onClick={() => handleOpen()}
          sx={{ borderRadius: 2, px: 3, bgcolor: '#2563eb', textTransform: 'none' }}
        >
          Novo Procedimento
        </Button>
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Nome do Procedimento</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Valor Padrão</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {procedimentos.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ p: 1, bgcolor: '#f5f3ff', borderRadius: 1.5 }}>
                        <ClipboardList size={18} color="#7c3aed" />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{p.nome}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669' }}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleOpen(p)} size="small" sx={{ color: '#3b82f6' }}><Edit2 size={18} /></IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton onClick={() => handleDelete(p.id)} size="small" sx={{ color: '#ef4444' }}><Trash2 size={18} /></IconButton>
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
          {selectedProc ? 'Editar Procedimento' : 'Novo Procedimento'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField 
                fullWidth label="Nome do Procedimento" 
                value={formData.nome} 
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth label="Valor R$" 
                type="number"
                value={formData.valor} 
                onChange={(e) => setFormData({...formData, valor: e.target.value})}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
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

export default Procedimentos;
