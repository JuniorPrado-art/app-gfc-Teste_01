"use client";

import { useState, useEffect, FormEvent } from 'react';

interface Empresa {
  codigo: number;
  empresa: string;
}

interface DuplicadaRowData {
  conta_debitar: string;
  nome_cartao: string;
  data: string;
  turno: number;
  nome_caixa: string;
  documento: string; // Fica como AUTORIZACAO
  vencto: string;
  numero_nota: string | null;
  status: string | null;
  valor: number;
  usuario: string;
  nome_empresa: string;
  autorizacao_tef: string;
}

export default function TransacoesDuplicadasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [codigoEmpresa, setCodigoEmpresa] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultados, setResultados] = useState<DuplicadaRowData[]>([]);

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
    if (val == null) return "0,00";
    return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formataData = (dataStr: string) => {
    if (!dataStr) return "-";
    const [ano, mes, dia] = dataStr.split(' ')[0].split('-');
    if (!dia || !mes || !ano) return dataStr;
    return `${dia}/${mes}/${ano}`;
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!dataInicial || !dataFinal || !codigoEmpresa) {
      setError("Por favor, preencha todos os campos do filtro.");
      return;
    }
    
    setError(null);
    setLoading(true);
    setResultados([]);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/relatorios/transacoes-duplicadas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_inicial: dataInicial,
          data_final: dataFinal,
          codigo_empresa: codigoEmpresa
        })
      });
      
      const json = await res.json();
      if (json.status === 'success') {
        if (json.data.length === 0) {
          setError("empty");
        } else {
          setResultados(json.data);
        }
      } else {
        setError(json.message || "error");
      }
    } catch (err: any) {
      setError("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ padding: '24px', maxWidth: '1800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '16px', border: '1px solid rgba(51, 65, 85, 0.8)', padding: '24px' }}>
        <h1 style={{ color: '#f8fafc', fontSize: '24px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Transações - Possíveis Duplicadas <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 'normal' }}>(Análise Criteriosa)</span>
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
            {loading ? 'Consultando...' : 'Pesquisar'}
          </button>
        </form>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', color: '#fca5a5', padding: '16px', borderRadius: '4px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>Mensagem de Erro</h3>
          <p style={{ margin: 0, fontSize: '14px' }}>Não há resultados a serem apresentados ou ocorreu um erro na busca. Por favor, acione o suporte.</p>
        </div>
      )}

      {resultados.length > 0 && (
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '16px', border: '1px solid rgba(51, 65, 85, 0.8)', padding: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
            R E L A T O R I O   D U P L I C A D O S ({resultados.length} registros suspeitos)
          </h2>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1500px' }}>
              <thead>
                <tr style={{ background: 'rgba(30, 41, 59, 0.8)', color: '#cbd5e1', fontSize: '12px', whiteSpace: 'nowrap' }}>
                  <th style={{ padding: '12px', borderBottom: '1px solid #334155' }}>PLANO DE CONTA</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #334155' }}>FORMA DE PAGAMENTO</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #334155' }}>DATA</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #334155' }}>TURNO</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #334155' }}>CONTA CAIXA</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #334155' }}>AUTORIZACAO</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #334155' }}>VENCIMENTO</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #334155' }}>NUMERO NOTA</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #334155' }}>STATUS NOTA</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #334155', textAlign: 'right' }}>VALOR</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #334155' }}>USUARIO</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #334155' }}>EMPRESA</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #334155' }}>AUTENTICAÇÃO TEF</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.5)', transition: 'background 0.2s', backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(30, 41, 59, 0.3)' }}>
                    <td style={{ padding: '10px 12px', color: '#f1f5f9', fontSize: '13px' }}>{row.conta_debitar}</td>
                    <td style={{ padding: '10px 12px', color: '#f1f5f9', fontSize: '13px', whiteSpace: 'nowrap' }}>{row.nome_cartao}</td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '13px', whiteSpace: 'nowrap' }}>{formataData(row.data)}</td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}>{row.turno}</td>
                    <td style={{ padding: '10px 12px', color: '#f1f5f9', fontSize: '13px', whiteSpace: 'nowrap' }}>{row.nome_caixa}</td>
                    <td style={{ padding: '10px 12px', color: '#eab308', fontSize: '13px' }}>{row.documento}</td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '13px', whiteSpace: 'nowrap' }}>{formataData(row.vencto)}</td>
                    <td style={{ padding: '10px 12px', color: '#cbd5e1', fontSize: '13px', textAlign: 'center' }}>{row.numero_nota || ''}</td>
                    <td style={{ padding: '10px 12px', color: '#cbd5e1', fontSize: '13px', fontWeight: 500 }}>{row.status || ''}</td>
                    <td style={{ padding: '10px 12px', color: '#f43f5e', fontSize: '13px', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>{formatCurrency(row.valor)}</td>
                    <td style={{ padding: '10px 12px', color: '#f1f5f9', fontSize: '13px' }}>{row.usuario}</td>
                    <td style={{ padding: '10px 12px', color: '#f1f5f9', fontSize: '13px', whiteSpace: 'nowrap' }}>{row.nome_empresa}</td>
                    <td style={{ padding: '10px 12px', color: '#cbd5e1', fontSize: '13px', whiteSpace: 'nowrap' }}>{row.autorizacao_tef == 'Sem Autorização TEF' ? 'Sem Autorização' : row.autorizacao_tef}</td>
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
