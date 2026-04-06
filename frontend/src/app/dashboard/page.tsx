"use client";

import { useEffect, useState } from 'react';

export default function DashboardIndex() {
  const [config, setConfig] = useState<any>(null);
  const [sincroniaCount, setSincroniaCount] = useState<number | null>(null);
  const [prevendasCount, setPrevendasCount] = useState<number | null>(null);
  const [role, setRole] = useState<string>('');
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const storedRole = localStorage.getItem('gfc_role');
    if (storedRole) setRole(storedRole);

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/config/visibility`)
      .then(r => r.json())
      .then(data => setVisibility(data))
      .catch(e => console.error("Erro carregando permissões: ", e));

    // Busca algumas informações para popular a tela e ficar amigável
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/config/load`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setConfig(data.data);
        }
      })
      .catch(err => console.error("Erro ao carregar dados locais"));
      
    // Busca os dados da Sincronia para exibir no card da Visão Geral
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/monitoramento/sincronia`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data) {
          const atrasados = data.data.filter((item: any) => item.is_delayed).length;
          setSincroniaCount(atrasados);
        }
      })
      .catch(err => console.error("Erro ao carregar status da sincronia"));

    // Busca os dados das Pré-vendas Pendentes
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/monitoramento/prevendas`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data) {
          setPrevendasCount(data.data.length);
        }
      })
      .catch(err => console.error("Erro ao carregar status das pré-vendas"));
  }, []);

  const isVisible = (key: string) => {
    if (role === 'admin') return true;
    return visibility[key] !== false;
  };

  return (
    <div className="fade-in">
      <header style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="title-primary">
            Visão Geral {config?.nome_base ? `- ${config.nome_base}` : ''}
          </h1>
          <p className="text-muted" style={{ marginBottom: '4px' }}>Bem-vindo ao sistema GFC - Gerenciador de Ferramentas Customizadas</p>
        </div>

        <button className="gfc-button secondary" style={{ padding: '10px', borderRadius: '50%' }} title="Atualizar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
        </button>
      </header>

      {/* Cards de Resumo Principais */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {isVisible('sincronia') && (
          <a href="/dashboard/sincronia" className="stat-box" style={{ textDecoration: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}>
            <div className="stat-label">Sincronia</div>
            {sincroniaCount === null ? (
               <div className="stat-value" style={{ color: '#94a3b8', fontSize: '20px' }}>Carregando...</div>
            ) : sincroniaCount > 0 ? (
               <div className="stat-value" style={{ color: '#ef4444', fontSize: '20px' }}>{sincroniaCount} Posto{sincroniaCount > 1 ? 's' : ''} Atrasado{sincroniaCount > 1 ? 's' : ''}</div>
            ) : (
               <div className="stat-value" style={{ color: '#10b981', fontSize: '20px' }}>Normalizada</div>
            )}
          </a>
        )}
        {isVisible('prevendas') && (
          <a href="/dashboard/pre-vendas" className="stat-box" style={{ textDecoration: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}>
            <div className="stat-label">Pré-vendas</div>
            {prevendasCount === null ? (
               <div className="stat-value" style={{ color: '#94a3b8', fontSize: '20px' }}>Carregando...</div>
            ) : prevendasCount > 0 ? (
               <div className="stat-value" style={{ color: '#ef4444', fontSize: '20px' }}>{prevendasCount} Pendente{prevendasCount > 1 ? 's' : ''}</div>
            ) : (
               <div className="stat-value" style={{ color: '#10b981', fontSize: '20px' }}>Normalizada</div>
            )}
          </a>
        )}
      </div>

      {/* Área de Gráficos/Info Mockada */}
      {isVisible('chamados') && (
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Chamados Abertos Hoje</h2>
          </div>
          <div style={{ color: '#94a3b8', fontSize: 14 }}>
            <p>Aqui teremos uma relação dos chamados abertos hoje, com seu status.</p>
            <p style={{ marginTop: 12 }}>Aguarde em breve.</p>
          </div>
        </div>
      )}
    </div>
  );
}

