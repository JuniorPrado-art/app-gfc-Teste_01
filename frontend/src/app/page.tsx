"use client";

import { useState, useEffect } from 'react';

export default function ConfiguratorLogin() {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    nome_base: '',
    host: 'localhost',
    port: '5432',
    database: '',
    user: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success'} | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/config/load`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setIsConfigured(true);
        } else {
          setIsConfigured(false);
        }
      })
      .catch(() => setIsConfigured(false));
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
      // Alterado para 127.0.0.1 para evitar problemas do Windows IPv6 convertendo localhost
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
      setToast({ message: 'Falha na requisição. O servidor local Python (/execution/app.py) está rodando na porta 5000?', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfiguration = async () => {
    setLoading(true);
    setToast(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/config/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      if (res.ok) {
        setToast({ message: data.message, type: 'success' });
        // Redireciona para o Login após salvar as configurações do Banco
        setTimeout(() => {
          window.location.href = '/login';
        }, 800);
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
    <div className="page-container">
      <div className="glass-panel fade-in" style={{ padding: '40px', maxWidth: '540px', width: '100%' }}>
        <h1 className="title-primary">Agente GFC</h1>
        
        {isConfigured === null ? (
          <p className="text-muted" style={{ marginBottom: '32px' }}>Verificando integridade do sistema...</p>
        ) : isConfigured ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: '#ef4444' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'white', marginBottom: '12px' }}>Acesso Restrito</h2>
            <p className="text-muted" style={{ marginBottom: '24px' }}>
              Este aplicativo já está configurado. Para alterar as credenciais do banco de dados ou reconfigurá-lo, acesso o Painel do Administrador.
            </p>
            <a href="/login" className="gfc-button primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Ir para o Login
            </a>
          </div>
        ) : (
          <>
            <p className="text-muted" style={{ marginBottom: '32px' }}>
              Configuração inicial do sistema. Preencha os dados do cliente e credenciais do banco.
            </p>

        {toast && (
          <div className={`toast ${toast.type}`}>
            {toast.message}
          </div>
        )}

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
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '12px 0 24px 0' }} />

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
              />
            </div>
            <div className="input-group">
              <label className="input-label">Senha DB *</label>
              <input 
                name="password" 
                value={formData.password} 
                onChange={handleInputChange} 
                className="gfc-input" 
                type="password" 
                placeholder="*********" 
                required 
              />
            </div>
          </div>

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
              className="gfc-button" 
              style={{ flex: 1 }}
              disabled={loading}
            >
              Salvar Configuração
            </button>
          </div>
        </form>
          </>
        )}
      </div>
    </div>
  );
}

