"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import pkg from '../../../package.json';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const [role, setRole] = useState<string>('');
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Carrega a permissão (Admin ou Client) e envia pro login se logoff
    const storedRole = localStorage.getItem('gfc_role');
    if (!storedRole) {
      window.location.href = '/login';
      return;
    }
    setRole(storedRole);

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/config/visibility`)
      .then(r => r.json())
      .then(data => setVisibility(data))
      .catch(e => console.error("Erro carregando permissões: ", e));
  }, []);

  const isActive = (path: string) => pathname?.includes(path) ? 'active' : '';

  const toggleVisibility = async (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const isNowVisible = visibility[key] === false ? true : false;
    const newVis = { ...visibility, [key]: isNowVisible };
    setVisibility(newVis);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/config/visibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVis)
    });
  };

  const renderMenuItem = (label: React.ReactNode, icon: React.ReactNode, path: string, key: string) => {
    // Se for cliente e foi ocultado pelo Admin, não renderiza
    if (role !== 'admin' && visibility[key] === false) return null;
    
    return (
      <div style={{ position: 'relative', marginBottom: '4px' }}>
        <Link href={path} className={`menu-item ${isActive(path)}`}>
          {icon}
          {label}
        </Link>
        {role === 'admin' && (
          <span 
            onClick={(e) => toggleVisibility(key, e)} 
            style={{ 
              position: 'absolute', right: '12px', top: '10px', cursor: 'pointer', 
              fontSize: '10px', padding: '2px 6px', 
              background: visibility[key] === false ? 'rgba(239, 68, 68, 0.8)' : 'rgba(100, 116, 139, 0.5)', 
              borderRadius: '4px', color: 'white'
            }}
          >
            {visibility[key] === false ? 'Oculto (Mostrar)' : 'Ocultar'}
          </span>
        )}
      </div>
    );
  };

  const isGroupVisible = (keys: string[]) => {
    if (role === 'admin') return true;
    return keys.some(k => visibility[k] !== false); // Se ao menos 1 não for falso
  };

  return (
    <div className="dashboard-layout fade-in">
      
      {/* Sidebar Inteligente Premium */}
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px', marginBottom: '32px' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <img src="/logo.png" alt="Comercial Informática" style={{ height: '32px', width: 'auto', borderRadius: '4px' }} />
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>Painel GFC</div>
          </Link>
          <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4', paddingLeft: '4px' }}>
            Gerenciador de<br/>Ferramentas Customizadas
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          
          {isGroupVisible(['prevendas', 'sincronia']) && (
            <div className="menu-group">
              <h3 className="menu-title">Monitoramento</h3>
              {renderMenuItem('Pré-vendas', <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, '/dashboard/pre-vendas', 'prevendas')}
              {renderMenuItem('Sincronia', <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>, '/dashboard/sincronia', 'sincronia')}
            </div>
          )}

          {isGroupVisible(['dre', 'custo_medio']) && (
            <div className="menu-group">
              <h3 className="menu-title">Relatórios</h3>
              {renderMenuItem(
                <div style={{ display: 'block', lineHeight: '1.2' }}>
                  <div style={{ fontSize: '13px' }}>Transações - POS</div>
                </div>, 
                null, 
                '/dashboard/transacoes-pos', 
                'dre'
              )}
              {renderMenuItem(
                <div style={{ display: 'block', lineHeight: '1.2', marginTop: '8px' }}>
                  <div style={{ fontSize: '13px' }}>Transações - Possíveis Duplicadas</div>
                </div>, 
                null, 
                '/dashboard/transacoes-duplicadas', 
                'custo_medio'
              )}
            </div>
          )}

          {isGroupVisible(['chamados']) && (
            <div className="menu-group">
              <h3 className="menu-title">Suporte e Chamados</h3>
              {renderMenuItem('Chamados Abertos', <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, '/dashboard/chamados', 'chamados')}
            </div>
          )}

          {/* O Menu Configurações SEMPRE some para o Cliente. Só aparece se a Role for Admin. */}
          {role === 'admin' && (
            <div className="menu-group">
              <h3 className="menu-title" style={{ color: '#fbbf24' }}>Configurações (Admin)</h3>
              <Link href="/dashboard/configuracoes/banco" className={`menu-item ${isActive('/configuracoes/banco')}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                Banco de Dados
              </Link>
              <Link href="/dashboard/configuracoes/email" className={`menu-item ${isActive('/configuracoes/email')}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                Conf. Email Aplicativo
              </Link>
              <Link href="/dashboard/configuracoes/alertas" className={`menu-item ${isActive('/configuracoes/alertas')}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/></svg>
                Cadastro de Inf Clientes
              </Link>
              <Link href="/dashboard/configuracoes/usuarios" className={`menu-item ${isActive('/configuracoes/usuarios')}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Cadastro de Usuário de Cliente
              </Link>
            </div>
          )}
        </nav>

        <a 
          href="https://comercialinformatica.com/" 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ 
            display: 'block', 
            color: '#64748b', 
            fontSize: '11px', 
            textDecoration: 'none', 
            padding: '12px 12px',
            transition: 'color 0.2s',
            marginTop: 'auto'
          }}
        >
          Comercial Informática
        </a>
        
        <div style={{ textAlign: 'center', marginBottom: '8px', color: '#64748b', fontSize: '10px' }}>
          Versão {pkg.version}
        </div>

        <div style={{ padding: '16px 0', borderTop: '1px solid var(--glass-border)' }}>
          <button 
            onClick={() => { localStorage.removeItem('gfc_role'); window.location.href = '/login'; }}
            className="menu-item" 
            style={{ color: '#ef4444', width: '100%', background: 'none', border: 'none', textAlign: 'left', fontFamily: 'inherit' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal Dinâmico */}
      <main className="dashboard-main">
        {children}
      </main>
      
    </div>
  );
}

