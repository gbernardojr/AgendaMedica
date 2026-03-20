import { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Grid, MenuItem 
} from '@mui/material';
import axios from 'axios';

const PacienteModal = ({ open, onClose, preFill, fetchData }) => {
  const [formData, setFormData] = useState({
    pac_nome: '',
    pac_nascimento: '',
    pac_telefone: '',
    pac_email: '',
    pac_sexo: 'F'
  });

  useEffect(() => {
    if (preFill) {
      setFormData(prev => ({ ...prev, pac_nome: preFill.nome }));
    }
  }, [preFill]);

  const handleSubmit = async () => {
    try {
      await axios.post('/pacientes', formData);
      fetchData(); // Recarrega para vincular o agendamento ao novo paciente
      onClose();
    } catch (err) {
      alert('Erro ao cadastrar paciente');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Cadastrar Novo Paciente</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              label="Nome Completo"
              fullWidth
              value={formData.pac_nome}
              onChange={(e) => setFormData({ ...formData, pac_nome: e.target.value })}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Data de Nascimento"
              type="date"
              fullWidth
              value={formData.pac_nascimento}
              onChange={(e) => setFormData({ ...formData, pac_nascimento: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              select
              label="Sexo"
              fullWidth
              value={formData.pac_sexo}
              onChange={(e) => setFormData({ ...formData, pac_sexo: e.target.value })}
            >
              <MenuItem value="F">Feminino</MenuItem>
              <MenuItem value="M">Masculino</MenuItem>
              <MenuItem value="O">Outro</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Telefone/WhatsApp"
              fullWidth
              value={formData.pac_telefone}
              onChange={(e) => setFormData({ ...formData, pac_telefone: e.target.value })}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="E-mail"
              fullWidth
              value={formData.pac_email}
              onChange={(e) => setFormData({ ...formData, pac_email: e.target.value })}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" color="secondary">Finalizar Cadastro</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PacienteModal;
