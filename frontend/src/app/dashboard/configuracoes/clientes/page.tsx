"use client";

import { useState, useEffect } from 'react';

type ClienteConfig = {
  alias: string;
  CLIENT_NAME: string;
  DB_HOST: string;
  DB_PORT: string;
  DB_NAME: string;
  DB_USER: string;
  DB_PASS: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  emails: string;
};

export default function ConfigClientes() {
  const [clientes, setClientes] = useState<ClienteConfig[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<ClienteConfig>({
    alias: '', CLIENT_NAME: '', DB_HOST: '', DB_PORT: '5432', DB_NAME: '',
    DB_USER: '', DB_PASS: '', TELEGRAM_BOT_TOKEN: '', TELEGRAM_CHAT_ID: '',
    VAPID_PUBLIC_KEY: '', VAPID_PRIVATE_KEY: '', emails: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success'} | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const fetchClientes = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/config/clientes`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data && data.data.clientes) {
          setClientes(data.data.clientes);
        }
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Auto format ALIAS (uppercase, no spaces)
    if (name === 'alias') {
      setFormData({ ...formData, [name]: value.toUpperCase().replace(/\s/g, '_') });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleAddClick = () => {
    setFormData({
      alias: '', CLIENT_NAME: '', DB_HOST: '', DB_PORT: '5432', DB_NAME: '',
      DB_USER: '', DB_PASS: '', TELEGRAM_BOT_TOKEN: '', TELEGRAM_CHAT_ID: '',
      VAPID_PUBLIC_KEY: '', VAPID_PRIVATE_KEY: '', emails: ''
    });
    setEditingIndex(null);
    setIsFormVisible(true);
    setToast(null);
  };

  const handleEditClick = (index: number) => {
    setFormData({ ...clientes[index] });
    setEditingIndex(index);
    setIsFormVisible(true);
    setToast(null);
  };

  const handleDeleteClick = async (index: number) => {
    if (!confirm('Deseja realmente remover este cliente?')) return;
    const novosClientes = [...clientes];
    novosClientes.splice(index, 1);
    
    await saveToServer(novosClientes);
  };

  const handleSaveConfiguration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.alias) {
      setToast({ message: 'O Alias do Cliente é obrigatório.', type: 'error' });
      return;
    }

    const novosClientes = [...clientes];
    
    if (editingIndex !== null) {
      // Check duplicate alias on edit if changed
      if (novosClientes[editingIndex].alias !== formData.alias && novosClientes.find(c => c.alias === formData.alias)) {
        setToast({ message: 'Já existe um cliente com este Alias.', type: 'error' });
        return;
      }
      novosClientes[editingIndex] = formData;
    } else {
      if (novosClientes.find(c => c.alias === formData.alias)) {
        setToast({ message: 'Já existe um cliente com este Alias.', type: 'error' });
        return;
      }
      novosClientes.push(formData);
    }

    await saveToServer(novosClientes);
  };

  const saveToServer = async (novosClientes: ClienteConfig[]) => {
    setLoading(true);
    setToast(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/config/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientes: novosClientes }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setToast({ message: data.message, type: 'success' });
        setClientes(novosClientes);
        setIsFormVisible(false);
      } else {
        setToast({ message: data.message || 'Erro ao salvar.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Falha na requisição de salvamento.', type: 'error' });
    } finally {
      setLoading(false);
      fetchClientes(); // Refresh to get the hidden passwords
    }
  };

  return (
    <div className="fade-in">
      <header style={{ marginBottom: 32 }}>
        <h1 className="title-primary">Cadastro de Clientes</h1>
        <p className="text-muted">Gerencie os clientes multi-tenant, suas credenciais de banco de dados e configurações de alertas.</p>
      </header>
      
      {toast && (
        <div className={`toast fade-in`} style={{
            background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            borderColor: toast.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            color: toast.type === 'error' ? '#fca5a5' : '#6ee7b7',
            marginBottom: '24px'
        }}>
          {toast.message}
        </div>
      )}

      {!isFormVisible ? (
        <div>
          <button onClick={handleAddClick} className="gfc-button secondary" style={{ marginBottom: '16px' }}>
            + Adicionar Novo Cliente
          </button>

          <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
            {clientes.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>Nenhum cliente cadastrado.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'rgba(30, 41, 59, 0.5)', borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8' }}>Alias</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8' }}>Nome Cliente</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8' }}>Banco de Dados</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', color: '#94a3b8' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((cli, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '12px 16px', color: '#f8fafc', fontWeight: 'bold' }}>{cli.alias}</td>
                      <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{cli.CLIENT_NAME}</td>
                      <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{cli.DB_HOST}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button onClick={() => handleEditClick(idx)} className="gfc-button" style={{ background: 'transparent', padding: '4px 8px', fontSize: '12px', color: '#3b82f6', marginRight: '8px' }}>Editar</button>
                        <button onClick={() => handleDeleteClick(idx)} className="gfc-button" style={{ background: 'transparent', padding: '4px 8px', fontSize: '12px', color: '#ef4444' }}>Remover</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div className="dashboard-card" style={{ maxWidth: '800px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#f8fafc' }}>{editingIndex !== null ? 'Editar Cliente' : 'Novo Cliente'}</h2>
            <button onClick={() => setIsFormVisible(false)} className="gfc-button" style={{ background: 'transparent', color: '#94a3b8', fontSize: '13px' }}>Voltar</button>
          </div>

          <form onSubmit={handleSaveConfiguration}>
            
            <h3 style={{ fontSize: '14px', color: '#fbbf24', borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '16px' }}>Identificação</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Alias (ID Único sem espaços) *</label>
                <input name="alias" value={formData.alias} onChange={handleInputChange} className="gfc-input" placeholder="CLI_EMPRESA_A" required disabled={editingIndex !== null} />
                <p className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}>Este alias será o vínculo do usuário com os dados.</p>
              </div>
              <div className="input-group">
                <label className="input-label">Nome Fantasia do Cliente</label>
                <input name="CLIENT_NAME" value={formData.CLIENT_NAME} onChange={handleInputChange} className="gfc-input" placeholder="Empresa A LTDA" />
              </div>
            </div>

            <h3 style={{ fontSize: '14px', color: '#fbbf24', borderBottom: '1px solid #334155', paddingBottom: '8px', marginTop: '24px', marginBottom: '16px' }}>Conexão de Banco de Dados</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">DB_HOST</label>
                <input name="DB_HOST" value={formData.DB_HOST} onChange={handleInputChange} className="gfc-input" />
              </div>
              <div className="input-group">
                <label className="input-label">DB_PORT</label>
                <input name="DB_PORT" value={formData.DB_PORT} onChange={handleInputChange} className="gfc-input" />
              </div>
              <div className="input-group">
                <label className="input-label">DB_NAME</label>
                <input name="DB_NAME" value={formData.DB_NAME} onChange={handleInputChange} className="gfc-input" />
              </div>
              <div className="input-group">
                <label className="input-label">DB_USER</label>
                <input name="DB_USER" value={formData.DB_USER} onChange={handleInputChange} className="gfc-input" />
              </div>
              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label className="input-label">DB_PASS</label>
                <input name="DB_PASS" type="password" value={formData.DB_PASS} onChange={handleInputChange} className="gfc-input" />
              </div>
            </div>

            <h3 style={{ fontSize: '14px', color: '#fbbf24', borderBottom: '1px solid #334155', paddingBottom: '8px', marginTop: '24px', marginBottom: '16px' }}>Notificações & Alertas</h3>
            <div className="input-group">
              <label className="input-label">E-mails de Destino (Separados por ponto e vírgula)</label>
              <textarea name="emails" rows={2} value={formData.emails} onChange={handleInputChange} className="gfc-input" placeholder="email@cliente.com;" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div className="input-group">
                <label className="input-label">TELEGRAM_BOT_TOKEN</label>
                <input name="TELEGRAM_BOT_TOKEN" type="password" value={formData.TELEGRAM_BOT_TOKEN} onChange={handleInputChange} className="gfc-input" />
              </div>
              <div className="input-group">
                <label className="input-label">TELEGRAM_CHAT_ID</label>
                <input name="TELEGRAM_CHAT_ID" value={formData.TELEGRAM_CHAT_ID} onChange={handleInputChange} className="gfc-input" />
              </div>
              <div className="input-group">
                <label className="input-label">VAPID_PUBLIC_KEY (WebPush)</label>
                <input name="VAPID_PUBLIC_KEY" value={formData.VAPID_PUBLIC_KEY} onChange={handleInputChange} className="gfc-input" />
              </div>
              <div className="input-group">
                <label className="input-label">VAPID_PRIVATE_KEY (WebPush)</label>
                <input name="VAPID_PRIVATE_KEY" type="password" value={formData.VAPID_PRIVATE_KEY} onChange={handleInputChange} className="gfc-input" />
              </div>
            </div>

            <div style={{ marginTop: '32px' }}>
              <button type="submit" className="gfc-button secondary" style={{ width: '100%', borderColor: '#10b981', color: '#10b981' }} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Cliente'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
