"use client";

import { useState, useEffect, FormEvent } from 'react';

interface Empresa {
  codigo: number;
  empresa: string;
}

interface DuplicadaRowData {
  plano_de_conta: string;
  forma_pagamento: string;
  data: string;
  turno: number;
  conta_caixa: string;
  autorizacao_tef: string;
  vencimento: string;
  numero_nota: string | null;
  status_nota: string | null;
  valor: number;
  usuario: string;
  empresa: string;
}

export default function TransacoesDuplicadasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [codigoEmpresa, setCodigoEmpresa] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultados, setResultados] = useState<DuplicadaRowData[]>([]);
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
    if (val == null) return "0,00";
    return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formataData = (dataStr: string) => {
    if (!dataStr) return "";
    const [ano, mes, dia] = dataStr.split(' ')[0].split('-');
    if (!dia || !mes || !ano) return dataStr;
    return `${dia}/${mes}/${ano}`;
  };

  const padRight = (str: string, length: number) => {
    const s = String(str || '').substring(0, length);
    return s + ' '.repeat(length - s.length);
  };
  
  const padLeft = (str: string, length: number) => {
    const s = String(str || '').substring(0, length);
    return ' '.repeat(length - s.length) + s;
  };
  
  const padCenter = (str: string, length: number) => {
    const s = String(str || '').substring(0, length);
    const m = length - s.length;
    const l = Math.floor(m / 2);
    const r = m - l;
    return ' '.repeat(l) + s + ' '.repeat(r);
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!dataInicial || !dataFinal || !codigoEmpresa) {
      setError("Por favor, preencha todos os campos do filtro.");
      return;
    }
    
    setError(null);
    setLoading(true);
    setHasSearched(true);
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

  // Build the ASCII Table
  const buildAsciiTable = () => {
    const headerSep = "+----------------+--------------------------------+--------------+---------+---------------------------------+------------+--------------+--------------+--------------+--------------+--------------+--------------------------------+-------------------+";
    const headerTitle = "|PLANO DE CONTA  |      FORMA DE PAGAMENTO        |    DATA      |  TURNO  |          CONTA CAIXA            |AUTORIZACAO |  VENCIMENTO  | NUMERO NOTA  | STATUS NOTA  |    VALOR     |   USUARIO    |           EMPRESA              | AUTENTICAÇÃO TEF  |";
    
    let table = padCenter("R E L A T O R I O   D U P L I C A D O S", headerSep.length) + "\n\n";
    table += headerSep + "\n" + headerTitle + "\n" + headerSep + "\n";
    
    resultados.forEach(row => {
      const plano_de_conta = " " + padRight(row.plano_de_conta, 15);
      const forma_pagamento = " " + padRight(row.forma_pagamento, 31);
      const data = " " + padRight(formataData(row.data), 13);
      const turno = padCenter(row.turno.toString(), 9);
      const conta_caixa = " " + padRight(row.conta_caixa, 32);
      const autorizacao = " " + padRight(row.autorizacao_tef == 'Sem Autorização TEF' ? 'Sem Autoriza' : row.autorizacao_tef, 11);
      const vencimento = " " + padRight(formataData(row.vencimento), 13);
      const num_nota = padCenter(row.numero_nota || '', 14);
      const status_nota = " " + padRight(row.status_nota || '', 13);
      const valor = padLeft(formatCurrency(row.valor), 11) + "   ";
      const usuario = " " + padRight(row.usuario, 13);
      const empresa = " " + padRight(row.empresa, 31);
      const tef = " " + padRight(row.autorizacao_tef == 'Sem Autorização TEF' ? 'Sem Autorização' : row.autorizacao_tef, 18);
      
      table += `|${plano_de_conta}|${forma_pagamento}|${data}|${turno}|${conta_caixa}|${autorizacao}|${vencimento}|${num_nota}|${status_nota}|${valor}|${usuario}|${empresa}|${tef}|\n`;
    });
    table += headerSep;
    return table;
  };

  return (
    <div className="fade-in" style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
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
          <p style={{ margin: 0, fontSize: '14px' }}>Não há resultados a serem apresentados ou ocorreu um erro na busca. Por favor, acionar o suporte.</p>
        </div>
      )}

      {resultados.length > 0 && (
        <div style={{ background: '#4c2e6b', padding: '24px', borderRadius: '8px', border: '1px solid #7e5299', overflowX: 'auto' }}>
          <pre style={{ margin: 0, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontSize: '12px', color: '#fdfdfd', minWidth: '1300px' }}>
            {buildAsciiTable()}
          </pre>
        </div>
      )}
    </div>
  );
}
