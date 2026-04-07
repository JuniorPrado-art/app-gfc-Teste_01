"use client";

import { useState, useEffect, FormEvent } from 'react';

interface Empresa {
  codigo: number;
  empresa: string;
}

interface PosRowData {
  plano_conta: string;
  forma_pagamento: string;
  data: string;
  turno: number;
  conta_caixa: string;
  valor: number;
  documento: string;
  usuario: string;
  numero_nota: string | null;
  empresa: string;
}

export default function TransacoesPOSPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [codigoEmpresa, setCodigoEmpresa] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultados, setResultados] = useState<PosRowData[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/empresas`)
      .then(res => res.json())
      .then(json => {
        if (json.status === 'success') {
          setEmpresas(json.data);
        }
      })
      .catch(e => console.error("Erro carregando empresas:", e));
  }, []);

  const formatCurrency = (val: number | string) => {
    if (val == null) return "R$ 0,00";
    return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!dataInicial || !dataFinal || !codigoEmpresa) {
      setError("Por favor, preencha todos os campos do filtro.");
      return;
    }

    setError(null);
    setLoading(true);
    setHasSearched(false);
    setResultados([]);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/relatorios/transacoes-pos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_inicial: dataInicial,
          data_final: dataFinal,
          codigo_empresa: codigoEmpresa
        })
      });

      const json = await res.json();
      setHasSearched(true);
      if (json.status === 'success') {
        setResultados(json.data);
      } else {
        setError(json.message || "Erro retornado pelo servidor.");
      }
    } catch (err: any) {
      setHasSearched(true);
      setError("Falha na comunicação com a API. Verifique a conexão com o banco.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '16px', border: '1px solid rgba(51, 65, 85, 0.8)', padding: '24px' }}>
        <h1 style={{ color: '#f8fafc', fontSize: '24px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Transações POS <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 'normal' }}>(Lançamentos Manuais)</span>
        </h1>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '14px' }}>Data Inicial</label>
            <input
              type="date"
              value={dataInicial}
              onChange={e => setDataInicial(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(71, 85, 105, 0.8)', borderRadius: '8px', color: 'white' }}
            />
          </div>

          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '14px' }}>Data Final</label>
            <input
              type="date"
              value={dataFinal}
              onChange={e => setDataFinal(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(71, 85, 105, 0.8)', borderRadius: '8px', color: 'white' }}
            />
          </div>

          <div style={{ flex: '2', minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '14px' }}>Empresa</label>
            <select
              value={codigoEmpresa}
              onChange={e => setCodigoEmpresa(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(71, 85, 105, 0.8)', borderRadius: '8px', color: 'white' }}
            >
              <option value="">Selecione uma empresa</option>
              {empresas.map(emp => (
                <option key={emp.codigo} value={emp.codigo}>
                  {emp.codigo} - {emp.empresa}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Buscando...' : 'Pesquisar'}
          </button>
        </form>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', color: '#fca5a5', padding: '16px', borderRadius: '4px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>Mensagem de Erro</h3>
          <p style={{ margin: 0, fontSize: '14px' }}>Erro ao consultar: {error} Por favor, acione o suporte.</p>
        </div>
      )}

      {!error && hasSearched && resultados.length === 0 && (
        <div style={{ background: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid #3b82f6', color: '#93c5fd', padding: '16px', borderRadius: '4px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold', color: '#60a5fa' }}>Nenhum Resultado Encontrado</h3>
          <p style={{ margin: 0, fontSize: '14px' }}>A busca foi concluída com sucesso, mas não há transações para este período e empresa.</p>
        </div>
      )}

      {resultados.length > 0 && (
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '16px', border: '1px solid rgba(51, 65, 85, 0.8)', padding: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
            R E L A T O R I O   P O S ({resultados.length} registros encontrados)
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
              <thead>
                <tr style={{ background: 'rgba(30, 41, 59, 0.8)', color: '#cbd5e1', fontSize: '13px' }}>
                  <th style={{ padding: '12px', borderBottom: '1px solid #334155' }}>PLANO CONTA</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #334155' }}>FORMA PAGAMENTO</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #334155' }}>DATA</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #334155' }}>TURNO</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #334155' }}>CONTA CAIXA</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #334155' }}>VALOR</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #334155' }}>DOCUMENTO</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #334155' }}>USUARIO</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #334155' }}>N. NOTA</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #334155' }}>EMPRESA</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.5)', transition: 'background 0.2s', backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(30, 41, 59, 0.3)' }}>
                    <td style={{ padding: '12px', color: '#f1f5f9', fontSize: '13px' }}>{row.plano_conta}</td>
                    <td style={{ padding: '12px', color: '#f1f5f9', fontSize: '13px' }}>{row.forma_pagamento}</td>
                    <td style={{ padding: '12px', color: '#94a3b8', fontSize: '13px' }}>{row.data}</td>
                    <td style={{ padding: '12px', color: '#94a3b8', fontSize: '13px' }}>{row.turno}</td>
                    <td style={{ padding: '12px', color: '#f1f5f9', fontSize: '13px' }}>{row.conta_caixa}</td>
                    <td style={{ padding: '12px', color: '#10b981', fontSize: '13px', fontWeight: 600 }}>{formatCurrency(row.valor)}</td>
                    <td style={{ padding: '12px', color: '#f1f5f9', fontSize: '13px' }}>{row.documento}</td>
                    <td style={{ padding: '12px', color: '#f1f5f9', fontSize: '13px' }}>{row.usuario}</td>
                    <td style={{ padding: '12px', color: '#cbd5e1', fontSize: '13px' }}>{row.numero_nota || '-'}</td>
                    <td style={{ padding: '12px', color: '#f1f5f9', fontSize: '13px' }}>{row.empresa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
