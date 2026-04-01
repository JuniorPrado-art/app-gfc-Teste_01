"use client";

import { useEffect, useState } from 'react';

interface SincroniaData {
  sid: string | number;
  servidor: string | null;
  ultimo_avanco: string;
  ultimo_recebimento: string;
  posicao: string | number;
  is_delayed: boolean;
}

export default function SincroniaPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<SincroniaData[]>([]);
  const [alerting, setAlerting] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success'} | null>(null);
  const [rotinaAtiva, setRotinaAtiva] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/monitoramento/sincronia`);
        const json = await res.json();
        
        if (res.ok && json.status === 'success') {
          setRecords(json.data || []);
        } else {
          setError(json.message || 'Erro ao carregar os dados.');
        }

        const statusRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/monitoramento/status-rotina?tipo=sincronia`);
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

  const handleToggleAlerta = async () => {
    setAlerting(true);
    setToast(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/monitoramento/toggle-rotina`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'sincronia', ativo: !rotinaAtiva })
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

  const renderValue = (val: any) => {
    if (val === null || val === undefined || val === '') return 'None';
    return String(val);
  };

  // Formata timestamp puro do banco para algo mais legível na UI
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'None') return dateString;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="fade-in" style={{ padding: '24px', color: '#94a3b8' }}>
        <h2>Carregando Monitoramento de Sincronias...</h2>
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

  const delayedCount = records.filter(r => r.is_delayed).length;

  return (
    <div className="fade-in" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#fbbf24', fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
            Monitoramento de Sincronia
          </h1>
          <p style={{ color: '#e2e8f0', fontSize: '15px' }}>
            Temos <strong>{delayedCount}</strong> {delayedCount === 1 ? 'posto atrasado' : 'postos atrasados'} na rede.
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

      <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', border: '1px solid #334155', padding: '1px' }}>
        <div style={{ overflowX: 'auto', borderRadius: '8px' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse', 
            color: '#f8fafc',
            fontSize: '13px',
          }}>
            <thead>
              <tr style={{ background: 'rgba(30, 41, 59, 0.9)', borderBottom: '1px solid #475569', textAlign: 'left' }}>
                <th style={{ padding: '16px 12px', width: '50px', textAlign: 'center' }}></th>
                <th style={{ padding: '16px 12px', fontWeight: 'bold' }}>Sid</th>
                <th style={{ padding: '16px 12px', fontWeight: 'bold' }}>Posto</th>
                <th style={{ padding: '16px 12px', fontWeight: 'bold' }}>Último Avanço</th>
                <th style={{ padding: '16px 12px', fontWeight: 'bold' }}>Último Receb./Envio</th>
                <th style={{ padding: '16px 12px', fontWeight: 'bold' }}>Posição</th>
              </tr>
            </thead>
            <tbody>
              {records.length > 0 ? records.map((row, idx) => (
                <tr key={idx} style={{ 
                  borderBottom: '1px solid #334155', 
                  background: row.is_delayed ? 'rgba(234, 179, 8, 0.05)' : (idx % 2 === 0 ? 'transparent' : 'rgba(15, 23, 42, 0.3)'),
                  transition: 'background 0.2s'
                }}>
                  <td style={{ padding: '12px', textAlign: 'center', verticalAlign: 'middle' }}>
                    {row.is_delayed ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ overflow: 'visible' }}>
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="#22c55e" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                      </svg>
                    )}
                  </td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{renderValue(row.sid)}</td>
                  <td style={{ padding: '12px', color: '#e2e8f0' }}>{renderValue(row.servidor)}</td>
                  <td style={{ padding: '12px' }}>{formatDate(row.ultimo_avanco)}</td>
                  <td style={{ padding: '12px' }}>{formatDate(row.ultimo_recebimento)}</td>
                  <td style={{ padding: '12px', fontWeight: 500 }}>{renderValue(row.posicao)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                    Nenhum registro de sincronia encontrado no Banco de Dados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

