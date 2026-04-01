"use client";

import { useState, useEffect } from 'react';

export default function ConfigBancoAdminPage() {
  const [formData, setFormData] = useState({
    nome_base: '',
    host: '',
    port: '',
    database: '',
    user: '',
    password: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success'} | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/config/load`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data) {
          setFormData({
            nome_base: data.data.nome_base || '',
            host: data.data.host || '',
            port: data.data.port || '',
            database: data.data.database || '',
            user: data.data.user || '',
            password: data.data.password || '' // Usually comes back as ******** from backend
          });
        }
      })
      .catch();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/config/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      if (res.ok) {
        setToast({ message: data.message, type: 'success' });
      } else {
        setToast({ message: data.message || 'Erro ao conectar.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Falha na requisição.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfiguration = async () => {
    setLoading(true);
    setToast(null);

    try {
      const payload = { ...formData };
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/config/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (res.ok) {
        setToast({ message: data.message, type: 'success' });
        setIsEditing(false); // Fecha o modo edição
      } else {
        setToast({ message: data.message || 'Erro ao salvar.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Falha na requisição de salvamento.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <header style={{ marginBottom: 32 }}>
        <h1 className="title-primary">Banco de Dados</h1>
        <p className="text-muted">Reconfigure os dados de conexão do sistema principal.</p>
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

      <div className="dashboard-card" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          {!isEditing ? (
            <button 
              onClick={() => {
                setIsEditing(true);
                // Limpa a senha ofuscada para forçar o recadastro 
                if (formData.password === '********') {
                  setFormData(prev => ({ ...prev, password: '' }));
                }
              }}
              className="gfc-button secondary" 
              style={{ fontSize: '13px' }}
            >
              Habilitar Edição
            </button>
          ) : (
             <button 
              onClick={() => setIsEditing(false)}
              className="gfc-button" 
              style={{ fontSize: '13px', background: 'transparent', color: '#94a3b8' }}
            >
              Cancelar Edição
            </button>
          )}
        </div>

        <form onSubmit={handleTestConnection}>
          
          <div className="input-group">
            <label className="input-label">Nome da Base *</label>
            <input 
              name="nome_base" 
              value={formData.nome_base} 
              onChange={handleInputChange} 
              className="gfc-input" 
              placeholder="Ex: matriz/filial" 
              required 
              disabled={!isEditing}
            />
          </div>

          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Host DB *</label>
              <input 
                name="host" 
                value={formData.host} 
                onChange={handleInputChange} 
                className="gfc-input" 
                placeholder="localhost ou IP" 
                required 
                disabled={!isEditing}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Porta DB</label>
              <input 
                name="port" 
                value={formData.port} 
                onChange={handleInputChange} 
                className="gfc-input" 
                placeholder="5432" 
                type="number"
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Nome do Database (Postgres) *</label>
            <input 
              name="database" 
              value={formData.database} 
              onChange={handleInputChange} 
              className="gfc-input" 
              placeholder="ex: banco_gfc" 
              required 
              disabled={!isEditing}
            />
          </div>

          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Usuário DB *</label>
              <input 
                name="user" 
                value={formData.user} 
                onChange={handleInputChange} 
                className="gfc-input" 
                placeholder="postgres" 
                required 
                disabled={!isEditing}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Senha DB *</label>
              <input 
                name="password" 
                value={formData.password} 
                onChange={handleInputChange} 
                className="gfc-input" 
                type={isEditing ? "text" : "password"} 
                placeholder={isEditing ? "Digite a senha" : "********"} 
                required 
                disabled={!isEditing}
              />
            </div>
          </div>

          {isEditing && (
             <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
              <button 
                type="submit" 
                className="gfc-button secondary" 
                style={{ flex: 1 }}
                disabled={loading}
              >
                {loading ? 'Testando...' : 'Testar Conexão'}
              </button>
              <button 
                type="button" 
                onClick={handleSaveConfiguration}
                className="gfc-button primary" 
                style={{ flex: 1 }}
                disabled={loading}
              >
                Salvar Definitivamente
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

