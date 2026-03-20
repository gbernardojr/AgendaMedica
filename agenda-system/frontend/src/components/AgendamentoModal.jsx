import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, MenuItem, Alert, Box,
  Stack, Typography, Divider
} from '@mui/material';
import { Trash2 } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';

const CONVENIOS = ['Particular', 'Unimed', 'Bradesco', 'Amil', 'SUS', 'Outro'];

const STATUS_OPTIONS = [
  { value: 1, label: 'Agendado' },
  { value: 2, label: 'Em atendimento' },
  { value: 3, label: 'Finalizado' },
];

const AgendamentoModal = ({ open, onClose, fetchData, selectedDate, editAg, preFilledTime, selectedProfissional, user }) => {
  const defaultData = {
    ag_data: format(selectedDate, 'yyyy-MM-dd'),
    ag_hora: preFilledTime || '08:00',
    ag_nome: '',
    ag_convenio: 'Particular',
    ag_observacao: '',
    ag_status: 1,
    ag_codmedico: selectedProfissional || '',
  };

  const [formData, setFormData] = useState(defaultData);
  const [pacientesOptions, setPacientesOptions] = useState([]);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [deletando, setDeletando] = useState(false);
  // Carrega dados do agendamento ao editar
  useEffect(() => {
    if (editAg) {
      setFormData({
        ag_data: editAg.ag_data ? editAg.ag_data.split('T')[0] : format(selectedDate, 'yyyy-MM-dd'),
        ag_hora: editAg.ag_hora ? String(editAg.ag_hora).substring(0, 5) : '08:00',
        ag_nome: editAg.ag_nome || '',
        ag_convenio: editAg.ag_convenio || 'Particular',
        ag_observacao: editAg.ag_observacao || '',
        ag_status: editAg.ag_status || 1,
        ag_codmedico: editAg.ag_codmedico || selectedProfissional || '',
      });
    } else {
      setFormData({
        ...defaultData,
        ag_hora: preFilledTime || '08:00',
        ag_codmedico: selectedProfissional || '',
      });
    }
    setErro('');
    setPacientesOptions([]);
  }, [editAg, preFilledTime, selectedProfissional]);

  const set = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // Busca pacientes enquanto digita
  const handleNomeChange = async (val) => {
    set('ag_nome', val);
    if (val.length >= 3) {
      try {
        const resp = await axios.get(`/pacientes?q=${encodeURIComponent(val)}`);
        setPacientesOptions(resp.data);
      } catch {
        setPacientesOptions([]);
      }
    } else {
      setPacientesOptions([]);
    }
  };

  const handleSubmit = async () => {
    setErro('');
    if (!formData.ag_nome?.trim()) return setErro('O nome do paciente é obrigatório.');
    if (!formData.ag_data) return setErro('A data é obrigatória.');
    if (!formData.ag_hora) return setErro('A hora é obrigatória.');

    setSalvando(true);
    try {
      if (editAg) {
        await axios.put(`/agendamentos/${editAg.ag_codigo}`, formData);
      } else {
        await axios.post('/agendamentos', formData);
      }
      fetchData();
      onClose();
    } catch (err) {
      setErro(err?.response?.data?.msg || 'Erro ao salvar agendamento. Verifique os dados.');
      console.error(err?.response?.data);
    } finally {
      setSalvando(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Liberar o horário de ${editAg.ag_hora} – ${editAg.ag_nome}?\nEsta ação não pode ser desfeita.`)) return;
    setDeletando(true);
    try {
      await axios.delete(`/agendamentos/${editAg.ag_codigo}`);
      fetchData();
      onClose();
    } catch {
      setErro('Erro ao liberar horário.');
      setDeletando(false);
    }
  };

  const hasPermission = user?.admin || user?.perms?.agenda;
  const isDisabled = salvando || deletando || !hasPermission;

  return (
    <Dialog open={open} onClose={isDisabled ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>
        {editAg
          ? `✏️ Editar agendamento – ${editAg.ag_hora}`
          : `📅 Novo agendamento${preFilledTime ? ` – ${preFilledTime}` : ''}`}
        {editAg && (
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
            {editAg.ag_nome}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent dividers>
        {erro && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro('')}>
            {erro}
          </Alert>
        )}

        <Grid container spacing={2.5} sx={{ mt: 0 }}>
          {/* Nome com sugestão (datalist nativo) */}
          <Grid item xs={12}>
            <TextField
              label="Nome do Paciente"
              fullWidth
              required
              value={formData.ag_nome}
              onChange={(e) => handleNomeChange(e.target.value)}
              inputProps={{ list: 'pac-sugestoes', autoComplete: 'off' }}
              helperText={pacientesOptions.length > 0 ? `${pacientesOptions.length} paciente(s) encontrado(s)` : 'Digite pelo menos 3 letras para buscar'}
            />
            <datalist id="pac-sugestoes">
              {pacientesOptions.map((p) => (
                <option key={p.id} value={p.nome} />
              ))}
            </datalist>
          </Grid>

          {/* Data */}
          <Grid item xs={6}>
            <TextField
              label="Data"
              type="date"
              fullWidth
              required
              value={formData.ag_data}
              onChange={(e) => set('ag_data', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Hora */}
          <Grid item xs={6}>
            <TextField
              label="Hora"
              type="time"
              fullWidth
              required
              value={formData.ag_hora}
              onChange={(e) => set('ag_hora', e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 900 }} // step=900s (15 min)
            />
          </Grid>

          {/* Convênio */}
          <Grid item xs={editAg ? 6 : 12}>
            <TextField
              select
              label="Convênio"
              fullWidth
              value={formData.ag_convenio}
              onChange={(e) => set('ag_convenio', e.target.value)}
            >
              {CONVENIOS.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Status (apenas ao editar) */}
          {editAg && (
            <Grid item xs={6}>
              <TextField
                select
                label="Status"
                fullWidth
                value={formData.ag_status}
                onChange={(e) => set('ag_status', Number(e.target.value))}
              >
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
          )}

          {/* Procedimento / Observação */}
          <Grid item xs={12}>
            <TextField
              label="Procedimento / Observação"
              multiline
              rows={3}
              fullWidth
              value={formData.ag_observacao}
              onChange={(e) => set('ag_observacao', e.target.value)}
              placeholder="Ex: Consulta de retorno, limpeza dental, avaliação..."
              inputProps={{ maxLength: 500 }}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        {/* Liberar horário (apenas ao editar) */}
        <Box>
          {editAg && (
            <Button
              onClick={handleDelete}
              color="error"
              variant="outlined"
              startIcon={<Trash2 size={16} />}
              disabled={isDisabled}
            >
              {deletando ? 'Liberando...' : 'Liberar Horário'}
            </Button>
          )}
        </Box>

        <Stack direction="row" spacing={1}>
          <Button onClick={onClose} color="inherit" disabled={isDisabled}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isDisabled}
          >
            {!hasPermission
              ? 'Sem Permissão para Agendar'
              : salvando
                ? 'Salvando...'
                : editAg
                  ? 'Salvar Alterações'
                  : 'Criar Agendamento'}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default AgendamentoModal;
