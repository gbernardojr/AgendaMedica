import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, IconButton, TextField, Dialog, 
  DialogTitle, DialogContent, DialogActions, Grid, Tooltip, FormControlLabel,
  Switch, Chip
} from '@mui/material';
import { Plus, Edit2, Trash2, UserCog, ShieldCheck, ShieldAlert } from 'lucide-react';
import axios from 'axios';

const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '', password: '', nome: '', admin: false,
    perm_agenda: true, perm_clientes: true, perm_profissionais: false, perm_procedimentos: false
  });

  const fetchUsuarios = async () => {
    try {
      const res = await axios.get('/usuarios');
      setUsuarios(res.data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleOpen = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        username: user.username,
        password: '',
        nome: user.nome,
        admin: user.admin,
        perm_agenda: user.perm_agenda,
        perm_clientes: user.perm_clientes,
        perm_profissionais: user.perm_profissionais,
        perm_procedimentos: user.perm_procedimentos
      });
    } else {
      setSelectedUser(null);
      setFormData({
        username: '', password: '', nome: '', admin: false,
        perm_agenda: true, perm_clientes: true, perm_profissionais: false, perm_procedimentos: false
      });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedUser) {
        await axios.put(`/usuarios/${selectedUser.id}`, formData);
      } else {
        await axios.post('/usuarios', formData);
      }
      setOpen(false);
      fetchUsuarios();
    } catch (error) {
      alert(error.response?.data?.msg || 'Erro ao salvar usuário');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deseja realmente excluir este usuário?')) {
      try {
        await axios.delete(`/usuarios/${id}`);
        fetchUsuarios();
      } catch (error) {
        alert(error.response?.data?.msg || 'Erro ao excluir');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>Usuários e Permissões</Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>Gerencie quem pode acessar cada módulo do sistema</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Plus size={20} />}
          onClick={() => handleOpen()}
          sx={{ borderRadius: 2, px: 3, bgcolor: '#2563eb', textTransform: 'none' }}
        >
          Novo Usuário
        </Button>
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Usuário</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Nome</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Perfil</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Permissões</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usuarios.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#2563eb' }}>{u.username}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ p: 1, bgcolor: '#f1f5f9', borderRadius: 1.5 }}>
                        <UserCog size={18} color="#475569" />
                      </Box>
                      <Typography variant="body2">{u.nome}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {u.admin ? (
                      <Chip label="Administrador" size="small" icon={<ShieldCheck size={14} />} color="primary" variant="outlined" />
                    ) : (
                      <Chip label="Padrão" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {u.perm_agenda && <Chip label="Agenda" size="small" variant="filled" sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#e0f2fe', color: '#0369a1' }} />}
                      {u.perm_clientes && <Chip label="Clientes" size="small" variant="filled" sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#dcfce7', color: '#15803d' }} />}
                      {u.perm_profissionais && <Chip label="Profi." size="small" variant="filled" sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#fef3c7', color: '#b45309' }} />}
                      {u.perm_procedimentos && <Chip label="Proce." size="small" variant="filled" sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#f3e8ff', color: '#7e22ce' }} />}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleOpen(u)} size="small" sx={{ color: '#3b82f6' }}><Edit2 size={18} /></IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton onClick={() => handleDelete(u.id)} size="small" sx={{ color: '#ef4444' }}><Trash2 size={18} /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {selectedUser ? 'Editar Usuário' : 'Novo Usuário'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth label="Login / Usuário" 
                disabled={!!selectedUser}
                value={formData.username} 
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth label={selectedUser ? "Nova Senha (deixe em branco para manter)" : "Senha"} 
                type="password"
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth label="Nome Exibido" 
                value={formData.nome} 
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={formData.admin} onChange={(e) => setFormData({...formData, admin: e.target.checked})} />}
                label="Deixar este usuário como Administrador"
              />
              <Typography variant="caption" display="block" color="textSecondary">
                Administradores têm acesso total a todos os módulos e configurações.
              </Typography>
            </Grid>
            
            {!formData.admin && (
              <>
                <Grid item xs={12}><Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 600 }}>Permissões de Acesso</Typography></Grid>
                <Grid item xs={6}>
                  <FormControlLabel control={<Switch checked={formData.perm_agenda} onChange={(e) => setFormData({...formData, perm_agenda: e.target.checked})} />} label="Agenda" />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel control={<Switch checked={formData.perm_clientes} onChange={(e) => setFormData({...formData, perm_clientes: e.target.checked})} />} label="Clientes" />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel control={<Switch checked={formData.perm_profissionais} onChange={(e) => setFormData({...formData, perm_profissionais: e.target.checked})} />} label="Profissionais" />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel control={<Switch checked={formData.perm_procedimentos} onChange={(e) => setFormData({...formData, perm_procedimentos: e.target.checked})} />} label="Procedimentos" />
                </Grid>
              </>
            )}
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

export default UsuariosPage;
