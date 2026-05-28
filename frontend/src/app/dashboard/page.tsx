"use client";

import { useEffect, useState } from 'react';

export default function DashboardIndex() {
  const [sincroniaCount, setSincroniaCount] = useState<number | null | 'timeout'>(null);
  const [prevendasCount, setPrevendasCount] = useState<number | null | 'timeout'>(null);
  const [caixasCount, setCaixasCount] = useState<number | null>(null);
  const [estoqueCriticoCount, setEstoqueCriticoCount] = useState<number | null>(null);
  const [contasPagarCount, setContasPagarCount] = useState<number | null>(null);
  const [contasPagarTotal, setContasPagarTotal] = useState<number>(0);
  const [role, setRole] = useState<string>('');
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const storedRole = localStorage.getItem('gfc_role');
    if (storedRole) setRole(storedRole);

    // Verifica as permissões de visibilidade das telas configuradas no Admin
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/config/visibility`)
      .then(r => r.json())
      .then(data => setVisibility(data))
      .catch(e => console.error("Erro carregando permissões: ", e));

    // Monitoramento da Sincronia:
    // Realiza um polling (requisição recorrente) a cada 15 segundos caso o servidor backend
    // retorne 504 (timeout) devido a conexões lentas do banco de dados do cliente.
    // O objetivo é evitar que a tela fique em branco e tentar automaticamente a conexão.
    const fetchSincronia = () => {
      const cliente = localStorage.getItem('gfc_cliente') || '';
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/monitoramento/sincronia?cliente=${cliente}`)
        .then(async res => {
          if (res.status === 504) {
            setSincroniaCount('timeout');
            setTimeout(fetchSincronia, 15000); // Tenta de novo em 15s
            return null;
          }
          return res.json();
        })
        .then(data => {
          if (data && data.status === 'success' && data.data) {
            const atrasados = data.data.filter((item: any) => item.is_delayed).length;
            setSincroniaCount(atrasados);
          } else if (data && data.status === 'timeout') {
            setSincroniaCount('timeout');
            setTimeout(fetchSincronia, 15000);
          }
        })
        .catch(err => console.error("Erro ao carregar status da sincronia"));
    };

    // Monitoramento de Pré-Vendas Pendentes:
    // Segue o mesmo padrão de polling de 15 segundos da Sincronia.
    const fetchPrevendas = () => {
      const cliente = localStorage.getItem('gfc_cliente') || '';
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/monitoramento/prevendas?cliente=${cliente}`)
        .then(async res => {
          if (res.status === 504) {
            setPrevendasCount('timeout');
            setTimeout(fetchPrevendas, 15000); // Tenta de novo em 15s
            return null;
          }
          return res.json();
        })
        .then(data => {
          if (data && data.status === 'success' && data.data) {
            setPrevendasCount(data.data.length);
          } else if (data && data.status === 'timeout') {
            setPrevendasCount('timeout');
            setTimeout(fetchPrevendas, 15000);
          }
        })
        .catch(err => console.error("Erro ao carregar status das pré-vendas"));
    };

    // Monitoramento de Caixas Sem Gravação
    const fetchCaixas = () => {
      const cliente = localStorage.getItem('gfc_cliente') || '';
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/monitoramento/caixas_sem_gravacao?cliente=${cliente}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.status === 'success' && data.data) {
            setCaixasCount(data.data.length);
          }
        })
        .catch(err => console.error("Erro ao carregar caixas sem gravação"));
    };

    // Monitoramento de Controle de Estoque
    const fetchEstoque = () => {
      const cliente = localStorage.getItem('gfc_cliente') || '';
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/monitoramento/estoque?cliente=${cliente}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.status === 'success' && data.data) {
            const criticos = data.data.filter((item: any) => item.alerta && item.alerta.includes('CRITICO')).length;
            setEstoqueCriticoCount(criticos);
          }
        })
        .catch(err => console.error("Erro ao carregar status do estoque"));
    };

    // Monitoramento de Contas a Pagar
    const fetchContasPagar = () => {
      const cliente = localStorage.getItem('gfc_cliente') || '';
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/monitoramento/contas_pagar?cliente=${cliente}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.status === 'success' && data.data) {
            setContasPagarCount(data.data.length);
            const total = data.data.reduce((acc: number, item: any) => acc + (item.valor || 0), 0);
            setContasPagarTotal(total);
          }
        })
        .catch(err => console.error("Erro ao carregar contas a pagar"));
    };

    fetchSincronia();
    fetchPrevendas();
    fetchCaixas();
    fetchEstoque();
    fetchContasPagar();
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
            Visão Geral
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
            ) : sincroniaCount === 'timeout' ? (
              <div className="stat-value" style={{ color: '#fbbf24', fontSize: '13px', lineHeight: '1.4', marginTop: '4px' }}>Conexão lenta. Aguarde um momento...</div>
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
            ) : prevendasCount === 'timeout' ? (
              <div className="stat-value" style={{ color: '#fbbf24', fontSize: '13px', lineHeight: '1.4', marginTop: '4px' }}>Conexão lenta. Aguarde um momento...</div>
            ) : prevendasCount > 0 ? (
              <div className="stat-value" style={{ color: '#ef4444', fontSize: '20px' }}>{prevendasCount} Pendente{prevendasCount > 1 ? 's' : ''}</div>
            ) : (
              <div className="stat-value" style={{ color: '#10b981', fontSize: '20px' }}>Normalizada</div>
            )}
          </a>
        )}
      </div>

      {/* Bloco de Avisos Importantes */}
      {(isVisible('caixas_sem_gravacao') || isVisible('contas_pagar') || isVisible('estoque_critico') || isVisible('exclusoes')) && (
        <div className="dashboard-card" style={{ marginBottom: '24px' }}>
          <div className="card-header" style={{ justifyContent: 'center' }}>
            <h2 className="title-primary" style={{ textTransform: 'uppercase', margin: 0, textAlign: 'center' }}>Avisos Importantes</h2>
          </div>

          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {isVisible('caixas_sem_gravacao') && (
              <a href="/dashboard/caixas-sem-gravacao" className="stat-box" style={{ textDecoration: 'none', cursor: 'pointer', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div className="stat-label" style={{ marginBottom: '8px' }}>Caixas sem gravação</div>
                <div className="stat-value" style={{ color: '#94a3b8', fontSize: '14px' }}>
                  {caixasCount !== null ? `${caixasCount} caixas` : '...'}
                </div>
              </a>
            )}

            {isVisible('estoque_critico') && (
              <a href="/dashboard/estoque?filtro=critico" className="stat-box" style={{ textDecoration: 'none', cursor: 'pointer', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div className="stat-label" style={{ marginBottom: '8px' }}>Estoque crítico de combustível</div>
                <div className="stat-value" style={{ color: estoqueCriticoCount && estoqueCriticoCount > 0 ? '#ef4444' : '#94a3b8', fontSize: '14px' }}>
                  {estoqueCriticoCount !== null ? `${estoqueCriticoCount} crítico${estoqueCriticoCount !== 1 ? 's' : ''}` : '...'}
                </div>
              </a>
            )}

            {isVisible('contas_pagar') && (
              <a href="/dashboard/contas-pagar" className="stat-box" style={{ textDecoration: 'none', cursor: 'pointer', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div className="stat-label" style={{ marginBottom: '8px' }}>Contas a pagar (Hoje)</div>
                <div className="stat-value" style={{ color: contasPagarCount && contasPagarCount > 0 ? '#ef4444' : '#94a3b8', fontSize: '14px', fontWeight: 'bold' }}>
                  {contasPagarCount !== null ? `${contasPagarCount} contas (R$ ${contasPagarTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` : '...'}
                </div>
              </a>
            )}

            {isVisible('exclusoes') && (
              <div className="stat-box" style={{ opacity: 0.6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div className="stat-label">Exclusões</div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

