import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, IconButton, TextField, Dialog, 
  DialogTitle, DialogContent, DialogActions, Grid, Tooltip, InputAdornment, MenuItem 
} from '@mui/material';
import { Plus, Search, Edit2, Trash2, User, Phone, Mail, MapPin } from 'lucide-react';
import axios from 'axios';

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const Pacientes = () => {
  const [pacientes, setPacientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [formData, setFormData] = useState({
    pac_nome: '', pac_sexo: 'M', pac_nascimento: '', pac_cpf: '', pac_rg: '',
    pac_endereco: '', pac_numero: '', pac_complemento: '', pac_bairro: '',
    pac_cidade: '', pac_estado: '', pac_cep: '', pac_telefone: '', pac_celular: '',
    pac_email: '', pac_nomemae: '', pac_obs: ''
  });

  const fetchPacientes = async () => {
    try {
      const res = await axios.get(`/api/pacientes?q=${searchTerm}`);
      setPacientes(res.data);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
    }
  };

  useEffect(() => {
    fetchPacientes();
  }, [searchTerm]);

  const handleOpen = (pac = null) => {
    if (pac) {
      setSelectedPaciente(pac);
      setFormData({
        pac_nome: pac.nome || '',
        pac_sexo: pac.pac_sexo || 'M',
        pac_nascimento: pac.pac_nascimento || '',
        pac_cpf: pac.pac_cpf || '',
        pac_rg: pac.pac_rg || '',
        pac_endereco: pac.pac_endereco || '',
        pac_numero: pac.pac_numero || '',
        pac_complemento: pac.pac_complemento || '',
        pac_bairro: pac.pac_bairro || '',
        pac_cidade: pac.pac_cidade || '',
        pac_estado: pac.pac_estado || '',
        pac_cep: pac.pac_cep || '',
        pac_telefone: pac.tel || '',
        pac_celular: pac.pac_celular || '',
        pac_email: pac.email || '',
        pac_nomemae: pac.pac_nomemae || '',
        pac_obs: pac.pac_obs || ''
      });
    } else {
      setSelectedPaciente(null);
      setFormData({
        pac_nome: '', pac_sexo: 'M', pac_nascimento: '', pac_cpf: '', pac_rg: '',
        pac_endereco: '', pac_numero: '', pac_complemento: '', pac_bairro: '',
        pac_cidade: '', pac_estado: '', pac_cep: '', pac_telefone: '', pac_celular: '',
        pac_email: '', pac_nomemae: '', pac_obs: ''
      });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedPaciente) {
        await axios.put(`/api/pacientes/${selectedPaciente.id}`, formData);
      } else {
        await axios.post('/api/pacientes', formData);
      }
      setOpen(false);
      fetchPacientes();
    } catch (error) {
      alert('Erro ao salvar paciente');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deseja realmente excluir este paciente?')) {
      try {
        await axios.delete(`/api/pacientes/${id}`);
        fetchPacientes();
      } catch (error) {
        alert('Erro ao excluir');
      }
    }
  };

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>Clientes</Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>Gerencie o cadastro de pacientes</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Plus size={20} />}
          onClick={() => handleOpen()}
          sx={{ 
            borderRadius: 2, 
            px: 3, 
            bgcolor: '#2563eb',
            '&:hover': { bgcolor: '#1d4ed8' },
            textTransform: 'none',
            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
          }}
        >
          Novo Cliente
        </Button>
      </Box>

      <Paper sx={{ p: 0, borderRadius: 3, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0' }}>
          <TextField
            fullWidth
            placeholder="Buscar por nome, CPF ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} color="#94a3b8" />
                </InputAdornment>
              ),
              sx: { borderRadius: 2, bgcolor: '#f8fafc' }
            }}
          />
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Nome</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>CPF</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Telefone</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Celular</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>E-mail</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#64748b' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pacientes.map((pac) => (
                <TableRow key={pac.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ p: 1, bgcolor: '#eff6ff', borderRadius: 1.5 }}>
                        <User size={18} color="#2563eb" />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                        {pac.nome}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#64748b' }}>{pac.pac_cpf || '-'}</TableCell>
                  <TableCell sx={{ color: '#64748b' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Phone size={14} color="#94a3b8" />
                      {pac.tel || '-'}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#64748b' }}>{pac.pac_celular || '-'}</TableCell>
                  <TableCell sx={{ color: '#64748b' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Mail size={14} color="#94a3b8" />
                      {pac.email || '-'}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleOpen(pac)} size="small" sx={{ color: '#3b82f6' }}>
                        <Edit2 size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton onClick={() => handleDelete(pac.id)} size="small" sx={{ color: '#ef4444' }}>
                        <Trash2 size={18} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {pacientes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                    Nenhum paciente encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {selectedPaciente ? 'Editar Cliente' : 'Novo Cliente'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={8}>
              <TextField fullWidth label="Nome Completo" value={formData.pac_nome} onChange={handleChange('pac_nome')} required />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField select fullWidth label="Sexo" value={formData.pac_sexo} onChange={handleChange('pac_sexo')}>
                <MenuItem value="M">Masculino</MenuItem>
                <MenuItem value="F">Feminino</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField fullWidth label="Nascimento" type="date" value={formData.pac_nascimento} onChange={handleChange('pac_nascimento')} InputLabelProps={{ shrink: true }} />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="CPF" value={formData.pac_cpf} onChange={handleChange('pac_cpf')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="RG" value={formData.pac_rg} onChange={handleChange('pac_rg')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Nome da Mãe" value={formData.pac_nomemae} onChange={handleChange('pac_nomemae')} />
            </Grid>

            <Grid item xs={12} sm={8}>
              <TextField fullWidth label="Endereço" value={formData.pac_endereco} onChange={handleChange('pac_endereco')} />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField fullWidth label="Número" value={formData.pac_numero} onChange={handleChange('pac_numero')} />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField fullWidth label="Complemento" value={formData.pac_complemento} onChange={handleChange('pac_complemento')} />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Bairro" value={formData.pac_bairro} onChange={handleChange('pac_bairro')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Cidade" value={formData.pac_cidade} onChange={handleChange('pac_cidade')} />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField select fullWidth label="Estado" value={formData.pac_estado} onChange={handleChange('pac_estado')}>
                {UFS.map(uf => <MenuItem key={uf} value={uf}>{uf}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField fullWidth label="CEP" value={formData.pac_cep} onChange={handleChange('pac_cep')} />
            </Grid>

            <Grid item xs={6} sm={4}>
              <TextField fullWidth label="Telefone" value={formData.pac_telefone} onChange={handleChange('pac_telefone')} />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField fullWidth label="Celular" value={formData.pac_celular} onChange={handleChange('pac_celular')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="E-mail" type="email" value={formData.pac_email} onChange={handleChange('pac_email')} />
            </Grid>

            <Grid item xs={12}>
              <TextField fullWidth label="Observação" multiline rows={3} value={formData.pac_obs} onChange={handleChange('pac_obs')} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: '#64748b' }}>Cancelar</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            sx={{ borderRadius: 2, bgcolor: '#2563eb', px: 4 }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Pacientes;
