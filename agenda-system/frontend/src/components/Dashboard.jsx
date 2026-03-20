import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Container,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, IconButton, Menu, MenuItem,
  CircularProgress, Tooltip, Stack, Paper, Card,
  Divider, TextField
} from '@mui/material';
import {
  Plus, Calendar as CalendarIcon, Download,
  DollarSign, ChevronLeft, ChevronRight
} from 'lucide-react';
import { format, addDays, subDays, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import axios from 'axios';

import AgendamentoModal from './AgendamentoModal';
import RecebimentoModal from './RecebimentoModal';
import PacienteModal from './PacienteModal';

const generateTimeSlots = () => {
  const slots = [];
  for (let h = 7; h <= 19; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 19 && m > 0) break;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

const STATUS_COLORS = {
  1: { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8', label: 'Agendado' },
  2: { bg: '#fffbeb', border: '#f59e0b', text: '#b45309', label: 'Em atendimento' },
  3: { bg: '#f0fdf4', border: '#22c55e', text: '#15803d', label: 'Finalizado' },
};

const Dashboard = ({ user }) => {
  const [agendamentos, setAgendamentos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [selectedProfissional, setSelectedProfissional] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [anchorElExport, setAnchorElExport] = useState(null);

  const [openAg, setOpenAg] = useState(false);
  const [openRec, setOpenRec] = useState(false);
  const [openPac, setOpenPac] = useState(false);
  const [selectedAg, setSelectedAg] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [pacientePreFill, setPacientePreFill] = useState(null);

  const fetchProfissionais = async () => {
    try {
      const resp = await axios.get('/profissionais');
      setProfissionais(resp.data);
      // Removed auto-selection to allow "Todas as Agendas" by default if multiple
      // if (resp.data.length > 0 && !selectedProfissional) {
      //   setSelectedProfissional(resp.data[0].crm);
      // }
    } catch (err) {
      console.error('Erro buscar prof:', err);
    }
  };

  const fetchAgendamentos = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      let url = `/agendamentos?data=${dateStr}`;
      if (selectedProfissional) url += `&profissional_crm=${selectedProfissional}`;
      const resp = await axios.get(url);
      setAgendamentos(resp.data);
    } catch (err) {
      console.error('Erro buscar agendamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfissionais(); }, []);
  useEffect(() => { fetchAgendamentos(); }, [selectedDate, selectedProfissional]);

  const agByTime = useMemo(() => {
    const map = {};
    agendamentos.forEach((ag) => {
      if (ag.ag_hora) {
        const hora = String(ag.ag_hora).substring(0, 5);
        map[hora] = ag;
      }
    });
    return map;
  }, [agendamentos]);

  const handleDoubleClickRow = (time) => {
    const ag = agByTime[time];
    if (ag) { setSelectedAg(ag); setSelectedSlot(null); }
    else { setSelectedAg(null); setSelectedSlot(time); }
    setOpenAg(true);
  };

  const handleExport = async (fmt) => {
    setAnchorElExport(null);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    let url = `/reports/export?format=${fmt}&data=${dateStr}`;
    if (selectedProfissional) url += `&profissional_crm=${selectedProfissional}`;

    try {
      setLoading(true);
      const resp = await axios.get(url, { responseType: 'blob' });
      
      // Criar um link temporário para o download
      const blob = new Blob([resp.data], { type: resp.headers['content-type'] });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `relatorio_${dateStr}.${fmt}`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Erro ao exportar:', err);
      // Fallback para o modo anterior se algo der errado (opcional, mas melhor reportar erro)
      alert('Erro ao gerar relatório. Verifique se o servidor está ativo.');
    } finally {
      setLoading(false);
    }
  };

  const totalAgendados = agendamentos.length;
  const totalPagos = agendamentos.filter((a) => a.ag_pago).length;
  const totalAbertos = totalAgendados - totalPagos;
  const totalRecebido = useMemo(() => {
    return agendamentos.reduce((acc, a) => acc + (a.ag_valor || 0), 0);
  }, [agendamentos]);

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>Agenda</Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>Gerenciamento clínico de atendimentos</Typography>
        </Box>
        
        <TextField
          select
          size="small"
          label="Selecionar Profissional"
          value={selectedProfissional}
          onChange={(e) => setSelectedProfissional(e.target.value)}
          sx={{ minWidth: 260, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }}
          InputProps={{ startAdornment: <CalendarIcon size={16} style={{ marginRight: 8, color: '#2563eb' }} /> }}
        >
          <MenuItem value="">Todas as Agendas (Visão Geral)</MenuItem>
          {profissionais.map((p) => (
            <MenuItem key={p.crm} value={p.crm}>Agenda: {p.nome}</MenuItem>
          ))}
          {profissionais.length === 0 && <MenuItem value="">Nenhuma agenda disponível</MenuItem>}
        </TextField>
      </Box>

      {/* Navegação de data + ações */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={() => setSelectedDate(subDays(selectedDate, 1))} size="small">
            <ChevronLeft size={20} />
          </IconButton>
          <Card
            elevation={0}
            sx={{
              px: 3, py: 1,
              display: 'flex', alignItems: 'center', gap: 1.5,
              border: '1px solid #e2e8f0', borderRadius: 3,
              bgcolor: isToday(selectedDate) ? '#eff6ff' : 'white',
            }}
          >
            <CalendarIcon size={18} color="#2563eb" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
              {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </Typography>
            {isToday(selectedDate) && (
              <Chip label="Hoje" size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
            )}
          </Card>
          <IconButton onClick={() => setSelectedDate(addDays(selectedDate, 1))} size="small">
            <ChevronRight size={20} />
          </IconButton>
          {!isToday(selectedDate) && (
            <Button variant="text" size="small" onClick={() => setSelectedDate(new Date())}>Ir para hoje</Button>
          )}
        </Stack>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            disabled={!user?.perms?.agenda}
            onClick={() => { setSelectedAg(null); setSelectedSlot(null); setOpenAg(true); }}
            sx={{ borderRadius: 2, bgcolor: user?.perms?.agenda ? '#2563eb' : '#94a3b8' }}
          >
            Novo Agendamento
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download size={18} />}
            onClick={(e) => setAnchorElExport(e.currentTarget)}
            sx={{ borderRadius: 2 }}
          >
            Relatórios
          </Button>
          <Menu anchorEl={anchorElExport} open={Boolean(anchorElExport)} onClose={() => setAnchorElExport(null)}>
            <MenuItem onClick={() => handleExport('pdf')}>Exportar PDF</MenuItem>
            <MenuItem onClick={() => handleExport('xlsx')}>Exportar Excel</MenuItem>
            <MenuItem onClick={() => handleExport('csv')}>Exportar CSV</MenuItem>
          </Menu>
        </Stack>
      </Box>

      {/* Resumo */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Chip label={`${totalAgendados} agendamentos`} size="small" sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }} />
        <Chip label={`${totalPagos} pagos`} size="small" sx={{ bgcolor: '#f0fdf4', color: '#15803d', fontWeight: 600 }} />
        {totalAbertos > 0 && <Chip label={`${totalAbertos} em aberto`} size="small" sx={{ bgcolor: '#fffbeb', color: '#b45309', fontWeight: 600 }} />}
        <Chip label={`Total: R$ ${totalRecebido.toFixed(2)}`} size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }} />
      </Stack>

      {/* Grade */}
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f1f5f9', width: 82, borderRight: '1px solid #e2e8f0' }}>Horário</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f1f5f9' }}>Paciente</TableCell>
                {!selectedProfissional && <TableCell sx={{ fontWeight: 700, bgcolor: '#f1f5f9', width: 140 }}>Profissional</TableCell>}
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f1f5f9' }}>Procedimento / Obs.</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f1f5f9', width: 110 }}>Convênio</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f1f5f9', width: 130 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f1f5f9', width: 105 }}>Pagamento</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f1f5f9', width: 56 }} align="center">$</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 10 }}><CircularProgress size={30} /></TableCell></TableRow>
              ) : (
                TIME_SLOTS.map((time) => {
                  const ag = agByTime[time];
                  const sc = ag ? (STATUS_COLORS[ag.ag_status] || STATUS_COLORS[1]) : null;
                  const isHalfHour = time.endsWith(':00');
                  return (
                    <TableRow
                      key={time}
                      onDoubleClick={() => handleDoubleClickRow(time)}
                      sx={{
                        bgcolor: ag ? sc.bg : (isHalfHour ? '#fafbfc' : 'white'),
                        cursor: 'pointer',
                        borderLeft: ag ? `3px solid ${sc.border}` : '3px solid transparent',
                        '&:hover': { filter: 'brightness(0.98)' }
                      }}
                    >
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', borderRight: '1px solid #e2e8f0' }}>{time}</TableCell>
                      <TableCell sx={{ fontWeight: ag ? 600 : 400 }}>
                        {ag ? (
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{ag.ag_nome}</Typography>
                            {!ag.ag_codpaciente && user?.perms?.clientes && (
                              <Button size="small" sx={{ p:0, fontSize:'0.7rem', textTransform:'none', color:'#f59e0b'}} onClick={(e)=>{e.stopPropagation(); setPacientePreFill({nome:ag.ag_nome}); setOpenPac(true);}}>+ Cadastrar paciente</Button>
                            )}
                          </Box>
                        ) : ''}
                      </TableCell>
                      {!selectedProfissional && (
                        <TableCell sx={{ fontSize: '0.75rem' }}>
                          {ag ? (profissionais.find(p => p.crm === ag.ag_codmedico)?.nome || 'Não definido') : ''}
                        </TableCell>
                      )}
                      <TableCell sx={{ fontSize: '0.8rem' }}>{ag?.ag_observacao || ''}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{ag?.ag_convenio || ''}</TableCell>
                      <TableCell>{ag && <Chip label={sc.label} size="small" sx={{ fontSize: '0.7rem', height: 22, color: sc.text, border: `1px solid ${sc.border}`, bgcolor: 'transparent' }} />}</TableCell>
                      <TableCell>{ag && <Chip label={ag.ag_pago ? "Pago" : "Pendente"} size="small" variant="outlined" color={ag.ag_pago ? "success" : "warning"} sx={{ fontSize: '0.7rem', height: 22 }} />}</TableCell>
                      <TableCell align="center">{ag && !ag.ag_pago && user?.perms?.agenda && <IconButton size="small" color="success" onClick={(e)=>{e.stopPropagation(); setSelectedAg(ag); setOpenRec(true);}}><DollarSign size={14} /></IconButton>}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {openAg && <AgendamentoModal open={openAg} onClose={()=>{setOpenAg(false);setSelectedAg(null);setSelectedSlot(null);}} fetchData={fetchAgendamentos} selectedDate={selectedDate} editAg={selectedAg} preFilledTime={selectedSlot} selectedProfissional={selectedProfissional} user={user} />}
      {openRec && <RecebimentoModal open={openRec} onClose={()=>{setOpenRec(false);setSelectedAg(null);}} fetchData={fetchAgendamentos} ag={selectedAg} />}
      {openPac && <PacienteModal open={openPac} onClose={()=>setOpenPac(false)} preFill={pacientePreFill} fetchData={fetchAgendamentos} />}
    </Box>
  );
};

export default Dashboard;
