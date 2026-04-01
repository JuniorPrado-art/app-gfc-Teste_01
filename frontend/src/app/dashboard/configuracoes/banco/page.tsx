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

  const [loading, setLoading] = useState(true);

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
            password: data.data.password || ''
          });
        }
      })
      .catch()
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fade-in">
      <header style={{ marginBottom: 32 }}>
        <h1 className="title-primary">Banco de Dados</h1>
        <p className="text-muted">Visualização dos dados de conexão em nuvem do sistema principal.</p>
      </header>

      <div className="dashboard-card" style={{ maxWidth: '700px', borderLeft: '4px solid #3b82f6', backgroundColor: '#eff6ff', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ color: '#3b82f6', fontSize: '20px' }}>ℹ️</div>
          <div>
            <h3 style={{ color: '#1e3a8a', fontSize: '15px', fontWeight: '600', margin: '0 0 6px 0' }}>Gerenciamento Seguro (Cloud)</h3>
            <p style={{ color: '#1e40af', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
              As credenciais deste aplicativo/banco de dados estão protegidas e são configuradas diretamente via <strong>Variáveis de Ambiente</strong> no painel de administração da sua Nuvem (Render). A edição manual foi desativada por motivos de segurança e para sustentar o formato de múltiplos clientes.
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-card" style={{ maxWidth: '700px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#334155', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: formData.host ? '#10b981' : '#cbd5e1' }}></span>
          {loading ? 'Carregando conexão...' : (formData.host ? 'Conexão Cloud Ativa' : 'Nenhuma Conexão Configurada')}
        </h2>

        <div className="grid-2" style={{ marginBottom: '16px' }}>
          <div className="input-group" style={{ gridColumn: 'span 2' }}>
            <label className="input-label">Nome do Cliente/Base</label>
            <input 
              value={formData.nome_base} 
              className="gfc-input" 
              disabled={true}
              style={{ backgroundColor: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
            />
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: '16px' }}>
          <div className="input-group">
            <label className="input-label">Host DB (Render / Supabase)</label>
            <input 
              value={formData.host} 
              className="gfc-input" 
              disabled={true}
              style={{ backgroundColor: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Porta DB</label>
            <input 
              value={formData.port} 
              className="gfc-input" 
              disabled={true}
              style={{ backgroundColor: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
            />
          </div>
        </div>

        <div className="grid-2">
          <div className="input-group">
            <label className="input-label">Nome do Database (Postgres)</label>
            <input 
              value={formData.database} 
              className="gfc-input" 
              disabled={true}
              style={{ backgroundColor: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Usuário DB</label>
            <input 
              value={formData.user} 
              className="gfc-input" 
              disabled={true}
              style={{ backgroundColor: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
