"use client";

import { useEffect, useState } from 'react';

type UserConfig = {
  id: string;
  username: string;
  email: string;
  cliente?: string;
  password?: string;
};

export default function CadastroUsuarios() {
  const [users, setUsers] = useState<UserConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'error' | 'success' } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [clientesList, setClientesList] = useState<{alias: string, CLIENT_NAME: string}[]>([]);

  const [formData, setFormData] = useState<UserConfig>({
    id: '',
    username: '',
    email: '',
    cliente: '',
    password: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/config/clientes`);
      const data = await res.json();
      if (data.status === 'success' && data.data && data.data.clientes) {
        setClientesList(data.data.clientes);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/config/usuarios`);
      const data = await res.json();
      if (data.status === 'success') {
        setUsers(data.data.users || []);
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (user: UserConfig) => {
    setEditingId(user.id);
    setFormData({
      id: user.id,
      username: user.username,
      email: user.email,
      cliente: user.cliente || '',
      password: '********' // Mantém mascarado, se o usuário não alterar, o backend saberá
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este usuário?')) return;
    
    const newUsers = users.filter(u => u.id !== id);
    setUsers(newUsers);
    
    await saveToServer(newUsers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.email || !formData.password || !formData.cliente) {
      setToast({ message: 'Todos os campos são obrigatórios.', type: 'error' });
      return;
    }

    let updatedUsers = [...users];

    if (editingId) {
      updatedUsers = updatedUsers.map(u => u.id === editingId ? { ...formData } : u);
    } else {
      updatedUsers.push({
        ...formData,
        id: Date.now().toString()
      });
    }

    setUsers(updatedUsers);
    await saveToServer(updatedUsers);
    resetForm();
  };

  const saveToServer = async (usersList: UserConfig[]) => {
    setSaving(true);
    setToast(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/config/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: usersList })
      });
      const data = await res.json();
      
      if (res.ok && data.status === 'success') {
        setToast({ message: data.message || 'Usuários salvos com sucesso.', type: 'success' });
        fetchUsers(); // Recarrega os dados do backend
      } else {
        setToast({ message: data.message || 'Erro ao salvar.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Falha na conexão.', type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ id: '', username: '', email: '', cliente: '', password: '' });
  };

  return (
    <div className="fade-in">
      <header style={{ marginBottom: 32 }}>
        <h1 className="title-primary">Cadastro de Usuário de Cliente</h1>
        <p className="text-muted">Gerencie os acessos locais dos clientes ao sistema.</p>
      </header>

      {toast && (
        <div className="toast fade-in" style={{
          background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          borderColor: toast.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
          color: toast.type === 'error' ? '#fca5a5' : '#6ee7b7',
          marginBottom: '24px'
        }}>
          {toast.message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px', alignItems: 'flex-start' }}>
        
        {/* Lista de Usuários */}
        <div className="dashboard-card">
          <h2 className="card-title" style={{ marginBottom: '16px' }}>Usuários Cadastrados</h2>
          {loading ? (
            <p className="text-muted">Carregando...</p>
          ) : users.length === 0 ? (
            <p className="text-muted">Nenhum usuário cadastrado.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px', color: '#94a3b8', fontWeight: 500 }}>Usuário</th>
                  <th style={{ padding: '12px 8px', color: '#94a3b8', fontWeight: 500 }}>Cliente</th>
                  <th style={{ padding: '12px 8px', color: '#94a3b8', fontWeight: 500 }}>E-mail</th>
                  <th style={{ padding: '12px 8px', color: '#94a3b8', fontWeight: 500, width: '100px', textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '12px 8px', color: 'white' }}>{user.username}</td>
                    <td style={{ padding: '12px 8px', color: '#fbbf24', fontWeight: 'bold' }}>{user.cliente}</td>
                    <td style={{ padding: '12px 8px', color: '#cbd5e1' }}>{user.email}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button 
                          onClick={() => handleEdit(user)}
                          style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer' }}
                          title="Editar"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                          title="Excluir"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Formulário de Criação/Edição */}
        <div className="dashboard-card" style={{ background: 'rgba(30, 41, 59, 0.4)' }}>
          <h2 className="card-title" style={{ marginBottom: '20px' }}>
            {editingId ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Usuário</label>
              <input 
                name="username"
                type="text" 
                value={formData.username}
                onChange={handleInputChange}
                className="gfc-input" 
                placeholder="Ex: cliente01"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Cliente Vinculado</label>
              <select
                name="cliente"
                value={formData.cliente}
                onChange={(e) => setFormData(prev => ({ ...prev, cliente: e.target.value }))}
                className="gfc-input"
                required
              >
                <option value="">Selecione o Cliente</option>
                {clientesList.map(cli => (
                  <option key={cli.alias} value={cli.alias}>{cli.alias} - {cli.CLIENT_NAME}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">E-mail (Para reset de senha)</label>
              <input 
                name="email"
                type="email" 
                value={formData.email}
                onChange={handleInputChange}
                className="gfc-input" 
                placeholder="Ex: cliente@email.com"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Senha</label>
              <input 
                name="password"
                type="password" 
                value={formData.password}
                onChange={handleInputChange}
                className="gfc-input" 
                placeholder="••••••••"
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              {editingId && (
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="gfc-button secondary" 
                  style={{ flex: 1 }}
                  disabled={saving}
                >
                  Cancelar
                </button>
              )}
              <button 
                type="submit" 
                className="gfc-button primary" 
                style={{ flex: 2 }}
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar Usuário'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
