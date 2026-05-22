"use client";

import { useEffect, useState } from 'react';

interface EstoqueData {
  empresa_nome: string;
  produto_nome: string;
  media_mensal_litros: number | null;
  media_diaria_litros: number | null;
  estoque_atual: number | null;
  data_estoque: string | null;
  dias_restantes: number | null;
  alerta: string;
}

export default function ControleEstoqueCombustivelPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<EstoqueData[]>([]);
  const [search, setSearch] = useState('');
  const [selectedAlerta, setSelectedAlerta] = useState('TODOS');

  useEffect(() => {
    async function fetchData() {
      try {
        const cliente = localStorage.getItem('gfc_cliente') || '';
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/monitoramento/estoque?cliente=${cliente}`);
        if (res.status === 504) {
          setError('Aguarde um momento, a conexão do banco está demorando um pouco mais do que o normal. Tentando novamente...');
          setTimeout(fetchData, 15000);
          return;
        }

        const json = await res.ok ? await res.json() : null;
        
        if (res.ok && json && json.status === 'success') {
          setRecords(json.data || []);
          setError(null);
        } else if (json && json.status === 'timeout') {
          setError('Aguarde um momento, a conexão do banco está demorando um pouco mais do que o normal. Tentando novamente...');
          setTimeout(fetchData, 15000);
          return;
        } else {
          setError(json?.message || 'Erro ao carregar os dados de estoque.');
        }
      } catch (err) {
        setError('Não foi possível conectar ao servidor local do GFC.');
      } finally {
        setLoading(false);
      }
    }
    
    // Ler o parâmetro 'filtro' da URL
    const params = new URLSearchParams(window.location.search);
    const filtroUrl = params.get('filtro');
    if (filtroUrl) {
      const filtroUpper = filtroUrl.toUpperCase();
      if (filtroUpper === 'CRITICO') setSelectedAlerta('CRITICO');
      else if (filtroUpper === 'ATENCAO') setSelectedAlerta('ATENCAO');
      else if (filtroUpper === 'OK') setSelectedAlerta('OK');
      else if (filtroUpper === 'SEM_REGISTRO') setSelectedAlerta('SEM_REGISTRO');
    }

    fetchData();
  }, []);

  const formatNumber = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '0,00';
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDays = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '-';
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + (val === 1 ? ' dia' : ' dias');
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Sem registro';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        const parts = dateStr.split(' ');
        if (parts.length === 2) {
          const dParts = parts[0].split('-');
          if (dParts.length === 3) {
            return `${dParts[2]}/${dParts[1]}/${dParts[0]} ${parts[1]}`;
          }
        }
        return dateStr;
      }
      return date.toLocaleString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const formatAlerta = (alerta: string) => {
    if (!alerta) return '';
    if (alerta.includes('CRITICO')) return '🔴 CRÍTICO - ABASTECIMENTO URGENTE';
    if (alerta.includes('ATENCAO')) return '🟡 ATENÇÃO - ESTOQUE BAIXO';
    if (alerta.includes('ESTOQUE OK')) return '🟢 ESTOQUE OK';
    if (alerta.includes('SEM REGISTRO')) return '⚠️ SEM REGISTRO DE ESTOQUE';
    if (alerta.includes('SEM MEDIA')) return '⚠️ SEM MÉDIA DE VENDA';
    return alerta;
  };

  const getAlertaBadgeStyle = (alerta: string) => {
    if (alerta.includes('CRITICO')) {
      return {
        background: 'rgba(239, 68, 68, 0.15)',
        color: '#fca5a5',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 'bold',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
      };
    }
    if (alerta.includes('ATENCAO')) {
      return {
        background: 'rgba(234, 179, 8, 0.15)',
        color: '#fef08a',
        border: '1px solid rgba(234, 179, 8, 0.4)',
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 'bold',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
      };
    }
    if (alerta.includes('OK')) {
      return {
        background: 'rgba(34, 197, 94, 0.15)',
        color: '#bbf7d0',
        border: '1px solid rgba(34, 197, 94, 0.4)',
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 'bold',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
      };
    }
    return {
      background: 'rgba(148, 163, 184, 0.15)',
      color: '#cbd5e1',
      border: '1px solid rgba(148, 163, 184, 0.4)',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 'bold',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px'
    };
  };

  const filteredRecords = records.filter(row => {
    const matchesSearch = 
      row.empresa_nome.toLowerCase().includes(search.toLowerCase()) ||
      row.produto_nome.toLowerCase().includes(search.toLowerCase());
    
    if (selectedAlerta === 'TODOS') return matchesSearch;
    if (selectedAlerta === 'CRITICO') return matchesSearch && row.alerta.includes('CRITICO');
    if (selectedAlerta === 'ATENCAO') return matchesSearch && row.alerta.includes('ATENCAO');
    if (selectedAlerta === 'OK') return matchesSearch && row.alerta.includes('OK');
    if (selectedAlerta === 'SEM_REGISTRO') return matchesSearch && (row.alerta.includes('REGISTRO') || row.alerta.includes('MEDIA'));
    return matchesSearch;
  });

  const countCritico = records.filter(r => r.alerta.includes('CRITICO')).length;
  const countAtencao = records.filter(r => r.alerta.includes('ATENCAO')).length;
  const countOk = records.filter(r => r.alerta.includes('OK')).length;

  if (loading) {
    return (
      <div className="fade-in" style={{ padding: '40px 24px', color: '#94a3b8', textAlign: 'center', marginTop: '100px' }}>
        <div className="spinner" style={{
          border: '4px solid rgba(255, 255, 255, 0.1)',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          borderLeftColor: '#3b82f6',
          margin: '0 auto 20px auto'
        }}></div>
        <h2 style={{ fontSize: '20px', fontWeight: 500 }}>Carregando Controle de Estoque de Combustível...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fade-in" style={{ padding: '24px', maxWidth: '800px', margin: '100px auto 0 auto' }}>
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '24px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Falha na Conexão / Leitura</h3>
          </div>
          <p style={{ fontSize: '15px', lineHeight: '1.6', margin: 0 }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Cabeçalho */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ color: '#38bdf8', fontSize: '26px', fontWeight: 600, marginBottom: '8px', letterSpacing: '-0.5px' }}>
            Controle Estoque Combustivel
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '15px', margin: 0 }}>
            Acompanhe o estoque atual, a média diária/mensal de vendas e a previsão de duração por posto de combustível.
          </p>
        </div>
        
        {/* Indicador de Data Mais Recente Geral */}
        {records.length > 0 && (
          <div style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid #334155', borderRadius: '8px', padding: '10px 16px', fontSize: '12px', color: '#94a3b8' }}>
            <span style={{ fontWeight: 500, color: '#e2e8f0' }}>Total Monitorado: </span>
            {records.length} produtos de combustível
          </div>
        )}
      </div>

      {/* Mini Cards de Estatísticas Rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        
        <div onClick={() => setSelectedAlerta('CRITICO')} style={{ 
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(15, 23, 42, 0.4) 100%)', 
          border: selectedAlerta === 'CRITICO' ? '2px solid #ef4444' : '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '12px', padding: '20px', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
          boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '14px' }}>🚨 Críticos (≤ 4 dias)</span>
            <span style={{ background: '#ef4444', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px' }}>Alerta</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#fca5a5' }}>{countCritico}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Necessitam de abastecimento imediato</div>
        </div>

        <div onClick={() => setSelectedAlerta('ATENCAO')} style={{ 
          background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(15, 23, 42, 0.4) 100%)', 
          border: selectedAlerta === 'ATENCAO' ? '2px solid #eab308' : '1px solid rgba(234, 179, 8, 0.2)',
          borderRadius: '12px', padding: '20px', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
          boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: '#eab308', fontWeight: 600, fontSize: '14px' }}>⚠️ Atenção (≤ 7 dias)</span>
            <span style={{ background: '#eab308', color: 'black', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px' }}>Baixo</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#fef08a' }}>{countAtencao}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Estoque em nível de atenção</div>
        </div>

        <div onClick={() => setSelectedAlerta('OK')} style={{ 
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(15, 23, 42, 0.4) 100%)', 
          border: selectedAlerta === 'OK' ? '2px solid #22c55e' : '1px solid rgba(34, 197, 94, 0.2)',
          borderRadius: '12px', padding: '20px', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
          boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: '#22c55e', fontWeight: 600, fontSize: '14px' }}>🟢 Estoque Seguro</span>
            <span style={{ background: '#22c55e', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px' }}>OK</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#bbf7d0' }}>{countOk}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Operação com estoque estável</div>
        </div>

      </div>

      {/* Controles de Busca e Filtros */}
      <div style={{ 
        background: 'rgba(30, 41, 59, 0.3)', 
        border: '1px solid #334155', 
        borderRadius: '12px', 
        padding: '20px', 
        marginBottom: '24px', 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '16px', 
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        
        {/* Barra de Pesquisa */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              placeholder="Buscar por posto ou combustível..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid #475569',
                borderRadius: '8px',
                padding: '10px 14px 10px 38px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '12px' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            {search && (
              <button 
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: '12px', top: '10px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filtros de Alerta Rápidos */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setSelectedAlerta('TODOS')} 
            style={{
              background: selectedAlerta === 'TODOS' ? '#38bdf8' : 'rgba(30, 41, 59, 0.6)',
              color: selectedAlerta === 'TODOS' ? '#0f172a' : '#cbd5e1',
              border: '1px solid #334155', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Todos ({records.length})
          </button>
          <button 
            onClick={() => setSelectedAlerta('CRITICO')} 
            style={{
              background: selectedAlerta === 'CRITICO' ? '#ef4444' : 'rgba(30, 41, 59, 0.6)',
              color: selectedAlerta === 'CRITICO' ? '#fff' : '#fca5a5',
              border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Críticos ({countCritico})
          </button>
          <button 
            onClick={() => setSelectedAlerta('ATENCAO')} 
            style={{
              background: selectedAlerta === 'ATENCAO' ? '#eab308' : 'rgba(30, 41, 59, 0.6)',
              color: selectedAlerta === 'ATENCAO' ? '#0f172a' : '#fef08a',
              border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Atenção ({countAtencao})
          </button>
          <button 
            onClick={() => setSelectedAlerta('OK')} 
            style={{
              background: selectedAlerta === 'OK' ? '#22c55e' : 'rgba(30, 41, 59, 0.6)',
              color: selectedAlerta === 'OK' ? '#fff' : '#bbf7d0',
              border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Seguro ({countOk})
          </button>
          <button 
            onClick={() => setSelectedAlerta('SEM_REGISTRO')} 
            style={{
              background: selectedAlerta === 'SEM_REGISTRO' ? '#64748b' : 'rgba(30, 41, 59, 0.6)',
              color: '#cbd5e1',
              border: '1px solid #334155', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Sem Info ({records.filter(r => r.alerta.includes('SEM REGISTRO') || r.alerta.includes('SEM MÉDIA')).length})
          </button>
        </div>

      </div>

      {/* Tabela de Dados */}
      {filteredRecords.length > 0 ? (
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #334155', boxShadow: '0 10px 30px 0 rgba(0, 0, 0, 0.25)' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse', 
            color: '#f8fafc',
            fontSize: '13px',
            background: 'rgba(15, 23, 42, 0.4)'
          }}>
            <thead>
              <tr style={{ background: 'rgba(30, 41, 59, 0.8)', borderBottom: '2px solid #475569', textAlign: 'left' }}>
                <th style={{ padding: '16px 12px', fontWeight: 'bold', borderRight: '1px solid #334155', color: '#38bdf8' }}>Posto (Empresa)</th>
                <th style={{ padding: '16px 12px', fontWeight: 'bold', borderRight: '1px solid #334155', color: '#38bdf8' }}>Combustível (Produto)</th>
                <th style={{ padding: '16px 12px', fontWeight: 'bold', borderRight: '1px solid #334155', color: '#38bdf8', textAlign: 'right' }}>Média Mensal (L)</th>
                <th style={{ padding: '16px 12px', fontWeight: 'bold', borderRight: '1px solid #334155', color: '#38bdf8', textAlign: 'right' }}>Média Diária (L)</th>
                <th style={{ padding: '16px 12px', fontWeight: 'bold', borderRight: '1px solid #334155', color: '#38bdf8', textAlign: 'right' }}>Estoque Atual (L)</th>
                <th style={{ padding: '16px 12px', fontWeight: 'bold', borderRight: '1px solid #334155', color: '#38bdf8', textAlign: 'center' }}>Dias Restantes</th>
                <th style={{ padding: '16px 12px', fontWeight: 'bold', borderRight: '1px solid #334155', color: '#38bdf8', textAlign: 'center' }}>Status / Alerta</th>
                <th style={{ padding: '16px 12px', fontWeight: 'bold', color: '#38bdf8' }}>Última Leitura Estoque</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((row, idx) => {
                
                let rowBg = idx % 2 === 0 ? 'transparent' : 'rgba(30, 41, 59, 0.2)';
                if (row.alerta.includes('CRITICO')) {
                  rowBg = 'rgba(239, 68, 68, 0.04)';
                } else if (row.alerta.includes('ATENCAO')) {
                  rowBg = 'rgba(234, 179, 8, 0.02)';
                }

                return (
                  <tr key={idx} style={{ 
                    borderBottom: '1px solid #334155', 
                    background: rowBg,
                    transition: 'background 0.2s'
                  }}>
                    
                    {/* Posto */}
                    <td style={{ padding: '14px 12px', borderRight: '1px solid #334155', fontWeight: 600 }}>{row.empresa_nome}</td>
                    
                    {/* Produto */}
                    <td style={{ padding: '14px 12px', borderRight: '1px solid #334155', color: '#e2e8f0' }}>{row.produto_nome}</td>
                    
                    {/* Média Mensal */}
                    <td style={{ padding: '14px 12px', borderRight: '1px solid #334155', textAlign: 'right', fontFamily: 'monospace', fontSize: '14px' }}>
                      {formatNumber(row.media_mensal_litros)}
                    </td>
                    
                    {/* Média Diária */}
                    <td style={{ padding: '14px 12px', borderRight: '1px solid #334155', textAlign: 'right', fontFamily: 'monospace', fontSize: '14px' }}>
                      {formatNumber(row.media_diaria_litros)}
                    </td>
                    
                    {/* Estoque Atual */}
                    <td style={{ padding: '14px 12px', borderRight: '1px solid #334155', textAlign: 'right', fontFamily: 'monospace', fontSize: '14px', fontWeight: 600, color: row.alerta.includes('CRITICO') ? '#ef4444' : '#f8fafc' }}>
                      {formatNumber(row.estoque_atual)}
                    </td>
                    
                    {/* Dias Restantes */}
                    <td style={{ padding: '14px 12px', borderRight: '1px solid #334155', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', color: row.alerta.includes('CRITICO') ? '#fca5a5' : row.alerta.includes('ATENCAO') ? '#fef08a' : '#bbf7d0' }}>
                      {formatDays(row.dias_restantes)}
                    </td>
                    
                    {/* Alerta */}
                    <td style={{ padding: '14px 12px', borderRight: '1px solid #334155', textAlign: 'center' }}>
                      <span style={getAlertaBadgeStyle(row.alerta)}>
                        {formatAlerta(row.alerta)}
                      </span>
                    </td>
                    
                    {/* Última Leitura */}
                    <td style={{ padding: '14px 12px', color: '#94a3b8', fontSize: '12px' }}>
                      {formatDate(row.data_estoque)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ 
          background: 'rgba(30, 41, 59, 0.2)', 
          border: '1px solid #334155', 
          borderRadius: '12px', 
          textAlign: 'center', 
          padding: '80px 0', 
          color: '#94a3b8' 
        }}>
          <div style={{ marginBottom: '20px' }}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto', opacity: 0.7 }}>
              <circle cx="12" cy="12" r="10" /><line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <h3 style={{ fontSize: '18px', color: '#e2e8f0', marginBottom: '8px' }}>Nenhum registro encontrado</h3>
          <p style={{ fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
            Nenhum produto de combustível corresponde aos critérios de pesquisa ou de filtro de alertas ativos.
          </p>
          <button 
            onClick={() => { setSearch(''); setSelectedAlerta('TODOS'); }}
            style={{ 
              marginTop: '20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', 
              padding: '8px 20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' 
            }}
          >
            Limpar Filtros
          </button>
        </div>
      )}

    </div>
  );
}
