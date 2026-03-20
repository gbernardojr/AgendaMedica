import { useState, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableRow, Button, TextField 
} from '@mui/material';
import axios from 'axios';
import RecebimentoModal from './RecebimentoModal';

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [dataFiltro, setDataFiltro] = useState('');
  const [recebimentoOpen, setRecebimentoOpen] = useState(false);
  const [selectedAg, setSelectedAg] = useState(null);

  const fetchAgendamentos = async () => {
    const params = dataFiltro ? { data: dataFiltro } : {};
    const res = await axios.get('/agendamentos', { params });
    setAgendamentos(res.data);
  };

  const createAgendamento = () => {
    const nome = prompt('Nome/Paciente:');
    const dataHora = prompt('Data/Hora (YYYY-MM-DD HH:MM):');
    const hora = dataHora.split(' ')[1];
    axios.post('/agendamentos', { paciente_nome: nome, data: dataHora, hora });
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
            <TableRow key={ag.codigo}>
              <TableCell>{ag.codigo}</TableCell>
              <TableCell>{ag.data}</TableCell>
              <TableCell>{ag.hora}</TableCell>
              <TableCell>{ag.nome}</TableCell>
              <TableCell>{ag.status}</TableCell>
              <TableCell>{ag.pago ? 'Sim' : 'Não'}</TableCell>
              {!ag.pago && (
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
              {ag.pago && <TableCell>-</TableCell>}
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

