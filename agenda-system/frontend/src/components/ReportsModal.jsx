import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Box, Autocomplete
} from '@mui/material';
import axios from 'axios';
import { format } from 'date-fns';

const ReportsModal = ({ open, onClose, profissionais }) => {
  const [reportType, setReportType] = useState('agenda-diaria');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedProfissional, setSelectedProfissional] = useState('');
  const [pacienteNome, setPacienteNome] = useState('');
  const [pacienteInput, setPacienteInput] = useState('');
  const [pacienteSuggestions, setPacienteSuggestions] = useState([]);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [dataInicio, setDataInicio] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
      setDataInicio(format(new Date(), 'yyyy-MM-dd'));
      setDataFim(format(new Date(), 'yyyy-MM-dd'));
      setReportType('agenda-diaria');
      setSelectedProfissional('');
      setPacienteNome('');
      setPacienteInput('');
      setSelectedPaciente(null);
    }
  }, [open]);

  const buscarPacientes = async (query) => {
    if (query.length < 3) {
      setPacienteSuggestions([]);
      return;
    }
    try {
      const res = await axios.get(`/api/pacientes/buscar?termo=${query}`);
      setPacienteSuggestions(res.data || []);
    } catch (err) {
      console.error('Erro ao buscar pacientes:', err);
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      let url = '';
      let fileName = '';

      if (reportType === 'agenda-diaria') {
        url = `/api/reports/agenda-diaria?data=${selectedDate}`;
        if (selectedProfissional) url += `&profissional_crm=${selectedProfissional}`;
        fileName = `agenda_diaria_${selectedDate}.pdf`;
      } else if (reportType === 'agendamentos-paciente') {
        if (!selectedPaciente && !pacienteNome) {
          alert('Selecione um paciente');
          setLoading(false);
          return;
        }
        const param = selectedPaciente ? `paciente_id=${selectedPaciente.pac_id}` : `nome=${encodeURIComponent(pacienteNome)}`;
        url = `/api/reports/agendamentos-paciente?${param}`;
        fileName = `agendamentos_paciente.pdf`;
      } else if (reportType === 'caixa') {
        url = `/api/reports/caixa?data_inicio=${dataInicio}&data_fim=${dataFim}`;
        if (selectedProfissional) url += `&profissional_crm=${selectedProfissional}`;
        fileName = `caixa_${dataInicio}_${dataFim}.pdf`;
      }

      console.log('[DEBUG] URL gerada:', url);
      const resp = await axios.get(url, { responseType: 'blob' });
      console.log('[DEBUG] Resposta:', resp.status, resp.headers['content-type']);
      const blob = new Blob([resp.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      onClose();
    } catch (err) {
      let msg = 'Erro ao gerar relatório';
      if (err.response) {
        if (err.response.data instanceof Blob) {
          const text = await err.response.data.text();
          try {
            const json = JSON.parse(text);
            msg = json.msg || json.error || msg;
            console.error('[DEBUG] Erro 500:', json);
          } catch {
            msg = text.substring(0, 200);
          }
        } else {
          msg = err.response.data?.msg || err.response.data?.error || err.message;
        }
      } else {
        msg = err.message;
      }
      console.error('[DEBUG] Erro:', msg);
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Relatórios</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            select
            label="Tipo de Relatório"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            fullWidth
          >
            <MenuItem value="agenda-diaria">Agenda Diária</MenuItem>
            <MenuItem value="agendamentos-paciente">Agendamentos por Paciente</MenuItem>
            <MenuItem value="caixa">Caixa</MenuItem>
          </TextField>

          <TextField
            select
            label="Profissional"
            value={selectedProfissional}
            onChange={(e) => setSelectedProfissional(e.target.value)}
            fullWidth
          >
            <MenuItem value="">Todos</MenuItem>
            {profissionais.map((p) => (
              <MenuItem key={p.crm} value={p.crm}>{p.nome}</MenuItem>
            ))}
          </TextField>

          {reportType === 'agenda-diaria' && (
            <TextField
              label="Data"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          )}

          {reportType === 'agendamentos-paciente' && (
            <Autocomplete
              freeSolo
              options={pacienteSuggestions}
              getOptionLabel={(option) => option.nome || ''}
              inputValue={pacienteInput}
              onInputChange={(event, newValue) => {
                setPacienteInput(newValue);
                setPacienteNome(newValue);
                buscarPacientes(newValue);
              }}
              onChange={(event, newValue) => {
                setSelectedPaciente(newValue);
                setPacienteInput(newValue?.nome || '');
              }}
              renderInput={(params) => (
                <TextField {...params} label="Buscar Paciente" placeholder="Digite pelo menos 3 letras" />
              )}
            />
          )}

          {reportType === 'caixa' && (
            <>
              <TextField
                label="Data Início"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Data Fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleGenerateReport} disabled={loading}>
          {loading ? 'Gerando...' : 'Gerar PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportsModal;
