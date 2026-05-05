"use client";

import { useEffect, useState } from 'react';

interface CaixaData {
  empresa: string | number;
  nome_empresa: string;
  data: string;
  turno: string | number;
  usuario: string;
}

export default function CaixasSemGravacaoPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<CaixaData[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const cliente = localStorage.getItem('gfc_cliente') || '';
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/monitoramento/caixas_sem_gravacao?cliente=${cliente}`);
        if (res.status === 504) {
          setError('Aguarde um momento, a conexão do banco esta demorando um pouco mais do que o normal. Tentando novamente...');
          setTimeout(fetchData, 15000);
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
      } catch (err) {
        setError('Não foi possível conectar ao servidor local do GFC.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const renderValue = (val: any) => {
    if (val === null || val === undefined || val === '') return 'None';
    return String(val);
  };

  if (loading) {
    return (
      <div className="fade-in" style={{ padding: '24px', color: '#94a3b8' }}>
        <h2>Carregando Monitoramento de Caixas Sem Gravação...</h2>
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
      
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: '#f87171', fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
          Caixas Sem Gravação
        </h1>
        <p style={{ color: '#e2e8f0', fontSize: '15px' }}>
          O sistema detectou <strong>{records.length}</strong> {records.length === 1 ? 'caixa' : 'caixas'} aguardando gravação de conferência.
        </p>
      </div>

      {records.length > 0 && (
        <div style={{ overflowX: 'auto', borderRadius: '4px', marginBottom: '40px' }}>
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
                <th style={{ padding: '12px 10px', fontWeight: 'bold', borderRight: '1px solid #334155' }}>Data</th>
                <th style={{ padding: '12px 10px', fontWeight: 'bold', borderRight: '1px solid #334155' }}>Turno</th>
                <th style={{ padding: '12px 10px', fontWeight: 'bold' }}>Usuário</th>
              </tr>
            </thead>
            <tbody>
              {records.map((row, idx) => {
                // Formatar a data se necessário, no padrão retornado pelo backend YYYY-MM-DD
                let formattedData = renderValue(row.data);
                if (formattedData.length >= 10) {
                  // Apenas a parte da data YYYY-MM-DD
                  formattedData = formattedData.substring(0, 10).split('-').reverse().join('/');
                }

                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #334155', background: idx % 2 === 0 ? 'transparent' : 'rgba(15, 23, 42, 0.3)' }}>
                    <td style={{ padding: '10px', borderRight: '1px solid #334155' }}>{renderValue(row.nome_empresa)}</td>
                    <td style={{ padding: '10px', borderRight: '1px solid #334155' }}>{formattedData}</td>
                    <td style={{ padding: '10px', borderRight: '1px solid #334155' }}>{renderValue(row.turno)}</td>
                    <td style={{ padding: '10px' }}>{renderValue(row.usuario)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {records.length === 0 && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <div style={{ marginBottom: '16px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <p style={{ fontSize: '18px' }}>Nenhum caixa sem gravação no momento.</p>
        </div>
      )}

    </div>
  );
}
