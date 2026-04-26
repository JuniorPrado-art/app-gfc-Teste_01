"use client";

import { useEffect, useState } from 'react';

// Tipagem baseada nas colunas padrão extraídas logicamente da query e do print
interface PreVendaData {
  empresa: string | number;
  nome_empresa: string;
  numero: string | number;
  hora: string;
  placa?: string;
  cliente?: string;
  valor?: number;
  pagamento?: string;
  vendedor?: string;
  obs?: string;
}

export default function PreVendasPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<PreVendaData[]>([]);
  const [alerting, setAlerting] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success'} | null>(null);
  const [rotinaAtiva, setRotinaAtiva] = useState(false);

  useEffect(() => {
    // Busca inicial de dados:
    // Conecta à rota /api/monitoramento/prevendas e também verifica
    // o status da rotina em background.
    async function fetchData() {
      try {
        const cliente = localStorage.getItem('gfc_cliente') || '';
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/monitoramento/prevendas?cliente=${cliente}`);
        if (res.status === 504) {
          setError('Aguarde um momento, a conexão do banco esta demorando um pouco mais do que o normal. Tentando novamente...');
          setTimeout(fetchData, 15000); // Tenta novamente
          return;
        }

        const json = await res.json();
        
        if (res.ok && json.status === 'success') {
          setRecords(json.data || []);
          setError(null);
        } else if (json.status === 'timeout') {
          setError('Aguarde um momento, a conexão do banco esta demorando um pouco mais do que o normal. Tentando novamente...');
          setTimeout(fetchData, 15000);
          return;
        } else {
          setError(json.message || 'Erro ao carregar os dados.');
        }

        const statusRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/monitoramento/status-rotina?tipo=prevendas&cliente=${cliente}`);
        const statusJson = await statusRes.json();
        if (statusRes.ok && statusJson.status === 'success') {
          setRotinaAtiva(statusJson.ativo);
        }
      } catch (err) {
        setError('Não foi possível conectar ao servidor local do GFC.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Função para Iniciar / Parar Alerta:
  // Controla o motor do backend que dispara os e-mails e mensagens no Telegram.
  const handleToggleAlerta = async () => {
    setAlerting(true);
    setToast(null);
    try {
      const cliente = localStorage.getItem('gfc_cliente') || '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/monitoramento/toggle-rotina`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'prevendas', ativo: !rotinaAtiva, cliente })
      });
      const data = await res.json();
      if (res.ok) {
        setRotinaAtiva(data.ativo);
        setToast({ message: data.message, type: 'success' });
      } else {
        setToast({ message: data.message || 'Erro ao alterar rotina de alerta.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Falha na comunicação com o servidor.', type: 'error' });
    } finally {
      setAlerting(false);
    }
  };

  // Agrupamento Visual por Empresa:
  // Como os dados vêm de várias filiais misturados no banco, o frontend agrupa 
  // os registros de pré-vendas com base no código de cada posto/empresa.
  const groupedData = records.reduce((acc, curr) => {
    // A chave do grupo conterá o código da empresa e o nome fantasia dela
    const key = `${curr.empresa} - ${curr.nome_empresa || 'NOME INDISPONÍVEL'}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(curr);
    return acc;
  }, {} as Record<string, PreVendaData[]>);

  // Função para formatar o valor monetário de forma flexível testando nolos
  const formatCurrency = (val: any) => {
    if (val === null || val === undefined || val === 'None') return 'R$ 0,00';
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  const renderValue = (val: any) => {
    if (val === null || val === undefined || val === '') return 'None';
    return String(val);
  };

  if (loading) {
    return (
      <div className="fade-in" style={{ padding: '24px', color: '#94a3b8' }}>
        <h2>Carregando Monitoramento de Pré-Vendas...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fade-in" style={{ padding: '24px' }}>
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '16px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <h3>Atenção: Falha de Leitura</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Cabeçalho como no Print */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#f87171', fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
            Sistema de Alerta de Pré-Vendas
          </h1>
          <p style={{ color: '#e2e8f0', fontSize: '15px' }}>
            O robô detectou <strong>{records.length}</strong> {records.length === 1 ? 'registro pendente' : 'registros pendentes'} que precisam de atenção.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setToast({ message: 'Estamos preparando algo incrível aqui. Volte em breve!', type: 'success' })}
            className="gfc-button" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(30, 41, 59, 1)', color: '#f8fafc', border: '1px solid #475569' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Abertura de Chamado
          </button>

          <button 
            onClick={handleToggleAlerta} 
            disabled={alerting} 
            className="gfc-button primary" 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              background: rotinaAtiva ? '#ef4444' : '#3b82f6', 
              borderColor: rotinaAtiva ? '#ef4444' : '#3b82f6',
              boxShadow: rotinaAtiva ? '0 0 12px rgba(239, 68, 68, 0.4)' : ''
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/></svg>
            {alerting ? 'Processando...' : (rotinaAtiva ? 'Finalizar Alerta' : 'Criar Alerta')}
          </button>
        </div>
      </div>

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

      {Object.entries(groupedData).map(([groupTitle, items]) => (
        <div key={groupTitle} style={{ marginBottom: '40px' }}>
          
          <h2 style={{ color: '#e2e8f0', fontSize: '18px', fontWeight: 600, paddingBottom: '8px', borderBottom: '1px solid #475569', marginBottom: '16px' }}>
            Empresa: {groupTitle} ({items.length} {items.length === 1 ? 'registro' : 'registros'})
          </h2>

          <div style={{ overflowX: 'auto', borderRadius: '4px' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              color: '#f8fafc',
              fontSize: '13px',
              border: '1px solid #334155'
            }}>
              <thead>
                <tr style={{ background: 'rgba(30, 41, 59, 0.8)', borderBottom: '1px solid #475569', textAlign: 'left' }}>
                  <th style={{ padding: '12px 10px', fontWeight: 'bold', borderRight: '1px solid #334155' }}>Empresa</th>
                  <th style={{ padding: '12px 10px', fontWeight: 'bold', borderRight: '1px solid #334155' }}>Número</th>
                  <th style={{ padding: '12px 10px', fontWeight: 'bold', borderRight: '1px solid #334155' }}>Data/Hora</th>
                  <th style={{ padding: '12px 10px', fontWeight: 'bold', borderRight: '1px solid #334155' }}>Placa</th>
                  <th style={{ padding: '12px 10px', fontWeight: 'bold', borderRight: '1px solid #334155' }}>Cliente</th>
                  <th style={{ padding: '12px 10px', fontWeight: 'bold', borderRight: '1px solid #334155' }}>Valor</th>
                  <th style={{ padding: '12px 10px', fontWeight: 'bold', borderRight: '1px solid #334155' }}>Pagamento</th>
                  <th style={{ padding: '12px 10px', fontWeight: 'bold', borderRight: '1px solid #334155' }}>Vendedor</th>
                  <th style={{ padding: '12px 10px', fontWeight: 'bold' }}>Observação</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #334155', background: idx % 2 === 0 ? 'transparent' : 'rgba(15, 23, 42, 0.3)' }}>
                    <td style={{ padding: '10px', borderRight: '1px solid #334155' }}>{renderValue(row.nome_empresa)}</td>
                    <td style={{ padding: '10px', borderRight: '1px solid #334155', fontWeight: 'bold' }}>{renderValue(row.numero)}</td>
                    <td style={{ padding: '10px', borderRight: '1px solid #334155' }}>
                      {/* Como o print mostra duas datas acopladas, formatamos apenas caso a hora exista limpa */}
                      {renderValue(row.hora)}
                    </td>
                    <td style={{ padding: '10px', borderRight: '1px solid #334155' }}>{renderValue(row.placa)}</td>
                    <td style={{ padding: '10px', borderRight: '1px solid #334155' }}>{renderValue(row.cliente)}</td>
                    <td style={{ padding: '10px', borderRight: '1px solid #334155' }}>{formatCurrency(row.valor)}</td>
                    <td style={{ padding: '10px', borderRight: '1px solid #334155' }}>{renderValue(row.pagamento)}</td>
                    <td style={{ padding: '10px', borderRight: '1px solid #334155' }}>{renderValue(row.vendedor?.toUpperCase())}</td>
                    <td style={{ padding: '10px', maxWidth: '300px' }}>{renderValue(row.obs?.toUpperCase())}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      ))}

      {records.length === 0 && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <div style={{ marginBottom: '16px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <p style={{ fontSize: '18px' }}>Nenhuma Pré-Venda que necessite atenção no momento.</p>
        </div>
      )}

    </div>
  );
}

