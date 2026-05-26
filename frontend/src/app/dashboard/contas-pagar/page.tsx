"use client";

import { useEffect, useState } from 'react';

interface ContaPagar {
  grid: number;
  empresa: string;
  pessoa: string;
  documento: string;
  data_doc: string;
  vencto: string;
  valor: number;
  motivo_descricao: string;
  obs: string;
  codigo_barras: string | null;
  subtotal_empresa_pessoa: number;
  subtotal_empresa: number;
  total_geral: number;
}

const ITF_PATTERNS: Record<string, string> = {
  '0': '00110',
  '1': '10001',
  '2': '01001',
  '3': '11000',
  '4': '00101',
  '5': '10100',
  '6': '01100',
  '7': '00011',
  '8': '10010',
  '9': '01010'
};

// Converte Linha Digitável (47 ou 48 caracteres) para Código de Barras de 44 dígitos
function getBarcodeFromLinhaDigitavel(linha: string): string {
  const cleaned = linha.replace(/\D/g, '');
  
  if (cleaned.length === 44) {
    return cleaned;
  }
  
  if (cleaned.length === 47) {
    // Layout do Boleto Bancário (Cobrança)
    const banco = cleaned.substring(0, 3);
    const moeda = cleaned.substring(3, 4);
    const c1 = cleaned.substring(4, 9);
    const c2 = cleaned.substring(10, 20);
    const c3 = cleaned.substring(21, 31);
    const dvGeral = cleaned.substring(32, 33);
    const fatorVenc = cleaned.substring(33, 37);
    const valor = cleaned.substring(37, 47);
    
    return `${banco}${moeda}${dvGeral}${fatorVenc}${valor}${c1}${c2}${c3}`;
  }
  
  if (cleaned.length === 48) {
    // Layout de Concessionárias / Contas de Consumo (Água, Luz, Telefone)
    const part1 = cleaned.substring(0, 11);
    const part2 = cleaned.substring(12, 23);
    const part3 = cleaned.substring(24, 35);
    const part4 = cleaned.substring(36, 47);
    return `${part1}${part2}${part3}${part4}`;
  }
  
  return cleaned;
}

// Renderiza a estrutura do código de barras ITF-25 em SVG
function renderBarcodeITF(barcodeStr: string) {
  let code = barcodeStr.replace(/\D/g, '');
  if (code.length % 2 !== 0) {
    code = '0' + code;
  }
  
  const narrowWidth = 1.8;
  const wideWidth = narrowWidth * 3;
  const barHeight = 70;
  
  let currentX = 0;
  const rects: any[] = [];
  
  const drawBar = (isWide: boolean) => {
    const w = isWide ? wideWidth : narrowWidth;
    rects.push(
      <rect
        key={`bar-${rects.length}`}
        x={currentX}
        y={0}
        width={w}
        height={barHeight}
        fill="#000000"
      />
    );
    currentX += w;
  };
  
  const skipSpace = (isWide: boolean) => {
    const w = isWide ? wideWidth : narrowWidth;
    currentX += w;
  };
  
  // Start pattern: narrow bar, narrow space, narrow bar, narrow space
  drawBar(false);
  skipSpace(false);
  drawBar(false);
  skipSpace(false);
  
  // Pairs
  for (let i = 0; i < code.length; i += 2) {
    const d1 = code[i];
    const d2 = code[i + 1];
    
    const p1 = ITF_PATTERNS[d1] || '00000';
    const p2 = ITF_PATTERNS[d2] || '00000';
    
    for (let j = 0; j < 5; j++) {
      drawBar(p1[j] === '1');
      skipSpace(p2[j] === '1');
    }
  }
  
  // Stop pattern: wide bar, narrow space, narrow bar
  drawBar(true);
  skipSpace(false);
  drawBar(false);
  
  return { rects, width: currentX, height: barHeight };
}

export default function ContasPagarHojePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<ContaPagar[]>([]);
  const [search, setSearch] = useState('');
  
  // State para controle do modal do Código de Barras
  const [activeBarcode, setActiveBarcode] = useState<string | null>(null);
  const [activeDocName, setActiveDocName] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);

  async function fetchData() {
    try {
      const cliente = localStorage.getItem('gfc_cliente') || '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/monitoramento/contas_pagar?cliente=${cliente}`);
      
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
        setError(json?.message || 'Erro ao carregar os dados de contas a pagar.');
      }
    } catch (err) {
      setError('Não foi possível conectar ao servidor local do GFC.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const handleCopyBarcode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Filtragem dos registros
  const filteredRecords = records.filter(row => {
    const term = search.toLowerCase();
    return (
      row.empresa.toLowerCase().includes(term) ||
      row.pessoa.toLowerCase().includes(term) ||
      row.documento.toLowerCase().includes(term) ||
      (row.motivo_descricao && row.motivo_descricao.toLowerCase().includes(term))
    );
  });

  // Agrupamento dos registros filtrados: Empresa -> Pessoa -> Contas
  const groupedData: Record<string, Record<string, ContaPagar[]>> = {};
  
  filteredRecords.forEach(item => {
    if (!groupedData[item.empresa]) {
      groupedData[item.empresa] = {};
    }
    if (!groupedData[item.empresa][item.pessoa]) {
      groupedData[item.empresa][item.pessoa] = [];
    }
    groupedData[item.empresa][item.pessoa].push(item);
  });

  // Estatísticas Rápidas baseadas nos dados originais (não filtrados)
  const totalContas = records.length;
  const totalValor = records.reduce((sum, r) => sum + r.valor, 0);
  const totalEmpresas = Array.from(new Set(records.map(r => r.empresa))).length;
  const totalFornecedores = Array.from(new Set(records.map(r => r.pessoa))).length;

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
        <h2 style={{ fontSize: '20px', fontWeight: 500 }}>Carregando Contas a Pagar...</h2>
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
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Falha na Conexão</h3>
          </div>
          <p style={{ fontSize: '15px', lineHeight: '1.6', margin: 0 }}>{error}</p>
        </div>
      </div>
    );
  }

  // Obter detalhes do barcode ativo para o modal
  const activeBarcodeCleaned = activeBarcode ? getBarcodeFromLinhaDigitavel(activeBarcode) : '';
  const activeBarcodeDetails = activeBarcodeCleaned ? renderBarcodeITF(activeBarcodeCleaned) : null;

  return (
    <div className="fade-in" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', minHeight: '80vh' }}>
      
      {/* Cabeçalho */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ color: '#38bdf8', fontSize: '26px', fontWeight: 600, marginBottom: '8px', letterSpacing: '-0.5px' }}>
            Contas a Pagar (Hoje)
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '15px', margin: 0 }}>
            Visualização consolidada de contas a pagar com vencimento no dia de hoje ({new Date().toLocaleDateString('pt-BR')}), organizadas por empresa e credor.
          </p>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(15, 23, 42, 0.4) 100%)', 
          border: '1px solid rgba(56, 189, 248, 0.15)',
          borderRadius: '12px', padding: '20px', boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.15)'
        }}>
          <div style={{ color: '#38bdf8', fontWeight: 600, fontSize: '13px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            💰 Total Geral a Pagar
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#f8fafc' }}>
            {formatCurrency(totalValor)}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            {totalContas} {totalContas === 1 ? 'lançamento pendente' : 'lançamentos pendentes'} hoje
          </div>
        </div>

        <div style={{ 
          background: 'rgba(30, 41, 59, 0.3)', 
          border: '1px solid #334155',
          borderRadius: '12px', padding: '20px'
        }}>
          <div style={{ color: '#cbd5e1', fontWeight: 600, fontSize: '13px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🏢 Empresas com Pendência
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#e2e8f0' }}>
            {totalEmpresas}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            Divisão por filiais e empresas do grupo
          </div>
        </div>

        <div style={{ 
          background: 'rgba(30, 41, 59, 0.3)', 
          border: '1px solid #334155',
          borderRadius: '12px', padding: '20px'
        }}>
          <div style={{ color: '#cbd5e1', fontWeight: 600, fontSize: '13px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🤝 Credores / Fornecedores
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#e2e8f0' }}>
            {totalFornecedores}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            Pessoas físicas e jurídicas a receber
          </div>
        </div>

      </div>

      {/* Controles de Busca */}
      <div style={{ 
        background: 'rgba(30, 41, 59, 0.3)', 
        border: '1px solid #334155', 
        borderRadius: '12px', 
        padding: '16px 20px', 
        marginBottom: '28px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '12px' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar contas por empresa, credor/fornecedor, documento ou motivo..."
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

      {/* Listagem Separada por Empresa -> Pessoa */}
      {Object.keys(groupedData).length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {Object.entries(groupedData).map(([empresaNome, pessoasMap]) => {
            
            // Calcula total da empresa
            const totalEmpresaVal = Object.values(pessoasMap)
              .flatMap(contas => contas)
              .reduce((sum, c) => sum + c.valor, 0);

            return (
              <div 
                key={empresaNome} 
                style={{ 
                  background: 'rgba(15, 23, 42, 0.4)', 
                  border: '1px solid #334155', 
                  borderRadius: '12px', 
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
                }}
              >
                
                {/* Header Empresa */}
                <div style={{ 
                  background: 'rgba(30, 41, 59, 0.8)', 
                  padding: '16px 20px', 
                  borderBottom: '1px solid #334155',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="10" width="20" height="12" rx="2" ry="2"/><path d="M12 22V10"/><path d="M17 22V14a2 2 0 0 0-2-2h-3"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10H8a15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                    <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '17px', fontWeight: 600 }}>
                      {empresaNome}
                    </h2>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.08)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                    Subtotal Empresa: {formatCurrency(totalEmpresaVal)}
                  </div>
                </div>

                {/* Bloco de Fornecedores / Credores */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {Object.entries(pessoasMap).map(([pessoaNome, contas]) => {
                    const totalPessoaVal = contas.reduce((sum, c) => sum + c.valor, 0);

                    return (
                      <div 
                        key={pessoaNome} 
                        style={{ 
                          background: 'rgba(30, 41, 59, 0.2)', 
                          border: '1px solid rgba(51, 65, 85, 0.5)', 
                          borderRadius: '8px', 
                          padding: '16px' 
                        }}
                      >
                        
                        {/* Header Pessoa */}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          marginBottom: '14px', 
                          borderBottom: '1px dashed #334155',
                          paddingBottom: '10px',
                          flexWrap: 'wrap',
                          gap: '8px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                            </svg>
                            <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '14px' }}>
                              Credor: {pessoaNome}
                            </span>
                          </div>
                          <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>
                            Subtotal Credor: <span style={{ color: '#cbd5e1' }}>{formatCurrency(totalPessoaVal)}</span>
                          </span>
                        </div>

                        {/* Tabela de Lançamentos do Credor */}
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: '#f1f5f9' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left', color: '#94a3b8' }}>
                                <th style={{ padding: '8px 4px', fontWeight: 'bold' }}>Documento</th>
                                <th style={{ padding: '8px 4px', fontWeight: 'bold' }}>Lançado Em</th>
                                <th style={{ padding: '8px 4px', fontWeight: 'bold' }}>Histórico / Motivo</th>
                                <th style={{ padding: '8px 4px', fontWeight: 'bold' }}>Observação</th>
                                <th style={{ padding: '8px 4px', fontWeight: 'bold', textAlign: 'right' }}>Valor</th>
                                <th style={{ padding: '8px 4px', fontWeight: 'bold', textAlign: 'center' }}>Ações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {contas.map((conta, idx) => (
                                <tr key={idx} style={{ borderBottom: idx === contas.length - 1 ? 'none' : '1px solid rgba(51, 65, 85, 0.3)' }}>
                                  <td style={{ padding: '10px 4px', fontWeight: 'bold', color: '#e2e8f0' }}>{conta.documento}</td>
                                  <td style={{ padding: '10px 4px', color: '#94a3b8' }}>{formatDate(conta.data_doc)}</td>
                                  <td style={{ padding: '10px 4px', color: '#cbd5e1' }}>{conta.motivo_descricao || 'Sem motivo'}</td>
                                  <td style={{ padding: '10px 4px', color: '#94a3b8', fontStyle: 'italic', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={conta.obs}>
                                    {conta.obs || '-'}
                                  </td>
                                  <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 600, color: '#fca5a5', fontFamily: 'monospace', fontSize: '14px' }}>
                                    {formatCurrency(conta.valor)}
                                  </td>
                                  <td style={{ padding: '10px 4px', textAlign: 'center' }}>
                                    {conta.codigo_barras ? (
                                      <button
                                        onClick={() => {
                                          setActiveBarcode(conta.codigo_barras);
                                          setActiveDocName(`Doc: ${conta.documento} - ${conta.pessoa}`);
                                        }}
                                        style={{
                                          background: 'rgba(56, 189, 248, 0.1)',
                                          color: '#38bdf8',
                                          border: '1px solid rgba(56, 189, 248, 0.3)',
                                          borderRadius: '4px',
                                          padding: '4px 10px',
                                          fontSize: '11px',
                                          fontWeight: 'bold',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                        onMouseOver={(e) => {
                                          e.currentTarget.style.background = '#38bdf8';
                                          e.currentTarget.style.color = '#0f172a';
                                        }}
                                        onMouseOut={(e) => {
                                          e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)';
                                          e.currentTarget.style.color = '#38bdf8';
                                        }}
                                      >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                          <line x1="3" y1="5" x2="3" y2="19"/><line x1="6" y1="5" x2="6" y2="19"/>
                                          <line x1="10" y1="5" x2="10" y2="19"/><line x1="14" y1="5" x2="14" y2="19"/>
                                          <line x1="18" y1="5" x2="18" y2="19"/><line x1="21" y1="5" x2="21" y2="19"/>
                                        </svg>
                                        Código de barra
                                      </button>
                                    ) : (
                                      <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                                        Sem código
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
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
          <h3 style={{ fontSize: '18px', color: '#e2e8f0', marginBottom: '8px' }}>Nenhum lançamento encontrado</h3>
          <p style={{ fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
            Nenhuma conta a pagar com vencimento para o dia de hoje corresponde aos critérios da busca.
          </p>
          <button 
            onClick={() => setSearch('')}
            style={{ 
              marginTop: '20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', 
              padding: '8px 20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' 
            }}
          >
            Limpar Busca
          </button>
        </div>
      )}

      {/* Modal Premium do Código de Barras */}
      {activeBarcode && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          
          <div style={{
            background: 'rgba(30, 41, 59, 0.95)',
            border: '1px solid #475569',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '650px',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            position: 'relative'
          }}>
            
            {/* Header Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f8fafc' }}>
                  Código de Barras para Pagamento
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
                  {activeDocName}
                </p>
              </div>
              <button 
                onClick={() => setActiveBarcode(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
              >
                ✕
              </button>
            </div>

            {/* Linha Digitável */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                Linha Digitável (Código)
              </label>
              
              <div style={{ 
                background: 'rgba(15, 23, 42, 0.6)', 
                border: '1px solid #334155', 
                borderRadius: '8px', 
                padding: '14px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '15px', 
                  color: '#f1f5f9', 
                  wordBreak: 'break-all', 
                  lineHeight: '1.4',
                  letterSpacing: '0.5px',
                  flex: 1
                }}>
                  {activeBarcode}
                </div>
                <button
                  onClick={() => handleCopyBarcode(activeBarcode)}
                  style={{
                    background: copySuccess ? '#10b981' : '#38bdf8',
                    color: copySuccess ? '#ffffff' : '#0f172a',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {copySuccess ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Copiado!
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                      Copiar Código
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Código de barras renderizado (ITF-25) */}
            {activeBarcodeCleaned && activeBarcodeDetails && (
              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '12px', textAlign: 'left' }}>
                  Código de Barras Escaneável (ITF-25)
                </label>
                
                <div style={{ 
                  background: '#ffffff', 
                  padding: '24px 20px', 
                  borderRadius: '12px', 
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
                  width: '100%',
                  overflowX: 'auto'
                }}>
                  <svg 
                    width={activeBarcodeDetails.width} 
                    height={activeBarcodeDetails.height} 
                    viewBox={`0 0 ${activeBarcodeDetails.width} ${activeBarcodeDetails.height}`}
                    style={{ display: 'block', maxWidth: '100%' }}
                  >
                    {activeBarcodeDetails.rects}
                  </svg>
                  
                  <div style={{ 
                    marginTop: '12px', 
                    fontSize: '13px', 
                    fontFamily: 'monospace', 
                    color: '#0f172a', 
                    letterSpacing: '2px', 
                    fontWeight: 600 
                  }}>
                    {activeBarcodeCleaned}
                  </div>
                </div>
                
                <p style={{ margin: '12px 0 0 0', fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                  Aproxime a câmera do seu celular ou leitor ótico para capturar o código.
                </p>
              </div>
            )}

            {/* Footer Modal */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '28px', borderTop: '1px solid #334155', paddingTop: '16px' }}>
              <button
                onClick={() => setActiveBarcode(null)}
                style={{
                  background: 'transparent',
                  border: '1px solid #475569',
                  color: '#cbd5e1',
                  borderRadius: '6px',
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
