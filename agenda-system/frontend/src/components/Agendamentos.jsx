import { useState, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableRow, Button, TextField 
} from '@mui/material';
import axios from 'axios';
import RecebimentoModal from './RecebimentoModal';

const STATUS_LABELS = {
  1: 'Agendado',
  2: 'Aguardando',
  3: 'Em Atendimento',
  4: 'Finalizado',
  5: 'Faltou',
  6: 'Cancelado'
};

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [dataFiltro, setDataFiltro] = useState('');
  const [recebimentoOpen, setRecebimentoOpen] = useState(false);
  const [selectedAg, setSelectedAg] = useState(null);

  const fetchAgendamentos = async () => {
    const params = dataFiltro ? { data: dataFiltro } : {};
    const res = await axios.get('/api/agendamentos', { params });
    setAgendamentos(res.data);
  };

  const createAgendamento = () => {
    const nome = prompt('Nome/Paciente:');
    const dataHora = prompt('Data/Hora (YYYY-MM-DD HH:MM):');
    const hora = dataHora.split(' ')[1];
    axios.post('/api/agendamentos', { paciente_nome: nome, data: dataHora, hora });
    fetchAgendamentos();
  };

  useEffect(() => {
    fetchAgendamentos();
  }, []);

  return (
    <div>
      <TextField label="Filtro Data" value={dataFiltro} onChange={(e) => setDataFiltro(e.target.value)} sx={{ mb: 2 }} />
      <Button onClick={fetchAgendamentos} sx={{ mr: 2 }}>Filtrar</Button>
      <Button variant="contained" onClick={createAgendamento}>+ Novo</Button>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Código</TableCell>
            <TableCell>Data</TableCell>
            <TableCell>Hora</TableCell>
            <TableCell>Nome</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Pago</TableCell>
            <TableCell>Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {agendamentos.map((ag) => (
            <TableRow key={ag.ag_codigo}>
              <TableCell>{ag.ag_codigo}</TableCell>
              <TableCell>{ag.ag_data ? ag.ag_data.split('T')[0] : ''}</TableCell>
              <TableCell>{ag.ag_hora}</TableCell>
              <TableCell>{ag.ag_nome}</TableCell>
              <TableCell>{STATUS_LABELS[ag.ag_status] || ag.ag_status}</TableCell>
              <TableCell>{ag.ag_pago ? 'Sim' : 'Não'}</TableCell>
              {!ag.ag_pago && (
                <TableCell>
                  <Button 
                    size="small" 
                    variant="contained" 
                    color="success"
                    onClick={() => {
                      setSelectedAg(ag);
                      setRecebimentoOpen(true);
                    }}
                  >
                    Receber
                  </Button>
                </TableCell>
              )}
              {ag.ag_pago && <TableCell>-</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <RecebimentoModal
        open={recebimentoOpen}
        onClose={() => setRecebimentoOpen(false)}
        ag={selectedAg}
        fetchData={fetchAgendamentos}
      />
    </div>
  );
}

