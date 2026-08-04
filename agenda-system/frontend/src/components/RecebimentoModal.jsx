import { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Grid, MenuItem, Typography, Box, Switch, FormControlLabel
} from '@mui/material';
import axios from 'axios';
import { format } from 'date-fns';

const RecebimentoModal = ({ open, onClose, fetchData, ag }) => {
  const [formData, setFormData] = useState({
    valor: '',
    forma_pagto: 'PIX',
    data_pagto: format(new Date(), 'yyyy-MM-dd'),
    pagante: ag?.ag_nome || '',
    cx_nf: false,
    cx_numerocheque2: '',
    cx_emissorcheque: '',
    cx_cpfemissorcheque2: '',
    cx_bancocheque: '',
    cx_agenciacheque: '',
    cx_contacheque: '',
    cx_chequeterceiro: false,
    cx_chequebompara: ''
  });

  useEffect(() => {
    if (ag?.ag_codigo) {
      axios.get(`/api/caixa/valorprocedimento?ag_codigo=${ag.ag_codigo}`)
        .then(res => {
          setFormData(prev => ({ ...prev, valor: parseFloat(res.data.valor) || 0 }));
        })
        .catch(() => {
          setFormData(prev => ({ ...prev, valor: 0 }));
        });
    }
  }, [ag?.ag_codigo]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      pagante: ag?.ag_nome || ''
    }));
  }, [ag]);

  const handleSubmit = async () => {
    try {
      const valorNumerico = parseFloat(formData.valor) || 0;
      await axios.post('/api/caixa/receber', {
        ag_codigo: ag.ag_codigo,
        valor: valorNumerico,
        forma_pagto: formData.forma_pagto,
        pagante: formData.pagante || null,
        data_pagto: formData.data_pagto,
        cx_nf: formData.cx_nf,
        cx_numerocheque2: formData.forma_pagto === 'Cheque' && formData.cx_numerocheque2 ? formData.cx_numerocheque2 : null,
        cx_emissorcheque: formData.forma_pagto === 'Cheque' && formData.cx_emissorcheque ? formData.cx_emissorcheque : null,
        cx_cpfemissorcheque2: formData.forma_pagto === 'Cheque' && formData.cx_cpfemissorcheque2 ? formData.cx_cpfemissorcheque2 : null,
        cx_bancocheque: formData.forma_pagto === 'Cheque' && formData.cx_bancocheque ? formData.cx_bancocheque : null,
        cx_agenciacheque: formData.forma_pagto === 'Cheque' && formData.cx_agenciacheque ? formData.cx_agenciacheque : null,
        cx_contacheque: formData.forma_pagto === 'Cheque' && formData.cx_contacheque ? formData.cx_contacheque : null,
        cx_chequeterceiro: formData.forma_pagto === 'Cheque' ? formData.cx_chequeterceiro : null,
        cx_chequebompara: formData.forma_pagto === 'Cheque' ? formData.cx_chequebompara : null
      });
      fetchData();
      onClose();
    } catch (err) {
      console.error('Erro recebimento:', err);
      const data = err.response?.data;
      let msg = data?.msg;
      if (!msg && data?.errors) {
        msg = Object.entries(data.errors)
          .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(', ') : errs}`)
          .join('\n');
      }
      if (!msg && data?.title) msg = data.title;
      if (!msg && typeof data === 'string') msg = data;
      msg = msg || err.message || 'Erro ao processar recebimento';
      alert(msg);
    }
  };

  const isCheque = formData.forma_pagto === 'Cheque';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Receber Pagamento</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(241, 245, 249, 0.5)', borderRadius: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">Agendamento</Typography>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>{ag?.ag_nome}</Typography>
          <Typography variant="body2">{ag?.ag_data} às {ag?.ag_hora}</Typography>
          {ag?.ag_obs && (
            <Typography variant="body2" color="text.secondary">Procedimento: {ag.ag_obs}</Typography>
          )}
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label="Valor Pago"
              type="number"
              fullWidth
              value={formData.valor === 0 || formData.valor === '0' ? '' : formData.valor}
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
              <MenuItem value="Cheque">Cheque</MenuItem>
            </TextField>
          </Grid>
          
          {isCheque && (
            <>
              <Grid item xs={6}>
                <TextField
                  label="Número do Cheque"
                  fullWidth
                  value={formData.cx_numerocheque2}
                  onChange={(e) => setFormData({ ...formData, cx_numerocheque2: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Nome do Emissor do Cheque"
                  fullWidth
                  value={formData.cx_emissorcheque}
                  onChange={(e) => setFormData({ ...formData, cx_emissorcheque: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="CPF Emissor do Cheque"
                  fullWidth
                  value={formData.cx_cpfemissorcheque2}
                  onChange={(e) => setFormData({ ...formData, cx_cpfemissorcheque2: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Banco do Cheque"
                  fullWidth
                  value={formData.cx_bancocheque}
                  onChange={(e) => setFormData({ ...formData, cx_bancocheque: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Agência do Cheque"
                  fullWidth
                  value={formData.cx_agenciacheque}
                  onChange={(e) => setFormData({ ...formData, cx_agenciacheque: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Conta do Cheque"
                  fullWidth
                  value={formData.cx_contacheque}
                  onChange={(e) => setFormData({ ...formData, cx_contacheque: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={formData.cx_chequeterceiro === true}
                      onChange={(e) => setFormData({ ...formData, cx_chequeterceiro: e.target.checked })}
                    />
                  }
                  label="Cheque de Terceiro?"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Bom para"
                  type="date"
                  fullWidth
                  value={formData.cx_chequebompara}
                  onChange={(e) => setFormData({ ...formData, cx_chequebompara: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </>
          )}

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
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch 
                  checked={formData.cx_nf === true}
                  onChange={(e) => setFormData({ ...formData, cx_nf: e.target.checked })}
                />
              }
              label="Nota Fiscal"
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
