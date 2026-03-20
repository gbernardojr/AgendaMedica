import { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Grid, MenuItem, Typography, Box 
} from '@mui/material';
import axios from 'axios';
import { format } from 'date-fns';

const RecebimentoModal = ({ open, onClose, fetchData, ag }) => {
  const [formData, setFormData] = useState({
    valor: 150.00, // Valor padrão de consulta
    forma_pagto: 'PIX',
    data_pagto: format(new Date(), 'yyyy-MM-dd'),
    pagante: ag?.ag_nome || ''
  });

  const handleSubmit = async () => {
    try {
      await axios.post('/caixa/receber', {
        ...formData,
        ag_codigo: ag.ag_codigo
      });
      fetchData();
      onClose();
    } catch (err) {
      console.error('Erro recebimento:', err);
      const msg = err.response?.data?.msg || err.message || 'Erro ao processar recebimento';
      alert(msg);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Receber Pagamento</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(241, 245, 249, 0.5)', borderRadius: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">Agendamento</Typography>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>{ag?.ag_nome}</Typography>
          <Typography variant="body2">{ag?.ag_data} às {ag?.ag_hora}</Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label="Valor Pago"
              type="number"
              fullWidth
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              InputProps={{ startAdornment: <Box sx={{ mr: 1 }}>R$</Box> }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              select
              label="Forma de Pagamento"
              fullWidth
              value={formData.forma_pagto}
              onChange={(e) => setFormData({ ...formData, forma_pagto: e.target.value })}
            >
              <MenuItem value="PIX">PIX</MenuItem>
              <MenuItem value="Dinheiro">Dinheiro</MenuItem>
              <MenuItem value="Cartão de Crédito">Cartão de Crédito</MenuItem>
              <MenuItem value="Cartão de Débito">Cartão de Débito</MenuItem>
              <MenuItem value="Convênio">Faturar para Convênio</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Data do Recebimento"
              type="date"
              fullWidth
              value={formData.data_pagto}
              onChange={(e) => setFormData({ ...formData, data_pagto: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" color="success">Confirmar Recebimento</Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecebimentoModal;
