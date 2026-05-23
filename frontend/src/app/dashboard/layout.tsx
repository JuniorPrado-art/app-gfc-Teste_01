"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import pkg from '../../../package.json';


function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const [role, setRole] = useState<string>('');
  const [user, setUser] = useState<string>('');
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [pushPermission, setPushPermission] = useState<string>('default');

  useEffect(() => {
    // Carrega a permissão (Admin ou Client) e envia pro login se logoff
    const storedRole = localStorage.getItem('gfc_role');
    if (!storedRole) {
      window.location.href = '/login';
      return;
    }
    setRole(storedRole);
    const storedUser = localStorage.getItem('gfc_user');
    if (storedUser) setUser(storedUser);

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/config/visibility`)
      .then(r => r.json())
      .then(data => setVisibility(data))
      .catch(e => console.error("Erro carregando permissões: ", e));

    // Inicialização de Notificações WebPush (Apenas em navegadores compatíveis):
    // 1. O código registra o 'Service Worker' (sw.js) que escuta as mensagens do servidor mesmo com a aba fechada.
    // 2. Se a permissão já estiver concedida, inscreve o usuário no push usando a chave VAPID.
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setPushPermission(Notification.permission);
      navigator.serviceWorker.register('/sw.js').then(swReg => {
        if (Notification.permission === 'granted') {
          subscribeUserToPush(swReg);
        }
      }).catch(console.error);
    }

  }, []);


  // Função que inscreve o navegador do usuário no servidor para receber Push Notifications nativas.
  // Ela busca a Chave Pública VAPID cadastrada para esse Cliente no servidor, gera uma inscrição
  // criptografada e envia para a rota POST /api/notifications/subscribe.
  const subscribeUserToPush = async (swRegistration?: ServiceWorkerRegistration) => {
    try {
      const reg = swRegistration || await navigator.serviceWorker.ready;
      const cliente = localStorage.getItem('gfc_cliente') || '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/notifications/vapidPublicKey?cliente=${cliente}`);
      const data = await res.json();
      if (data.status === 'success') {
        const applicationServerKey = urlB64ToUint8Array(data.publicKey);
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey
        });
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/notifications/subscribe?cliente=${cliente}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription)
        });
      }
    } catch (err) {
      console.error('Falha ao se inscrever no WebPush: ', err);
    }
  };

  const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();
    setPushPermission(permission);
    if (permission === 'granted') {
      subscribeUserToPush();
    }
  };

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

  const renderMenuGroup = (
    title: string,
    icon: React.ReactNode,
    subpaths: string[],
    keys: string[],
    childrenItems: React.ReactNode
  ) => {
    if (!isGroupVisible(keys) && keys.length > 0) return null;

    const hasActive = subpaths.some(path => pathname === path || (path !== '/dashboard' && pathname?.startsWith(path)));

    return (
      <div className={`menu-group-collapsible ${hasActive ? 'has-active-submenu' : ''}`}>
        <div className="menu-group-title">
          {icon}
          <span>{title}</span>
        </div>
        <div className="submenu-list">
          {childrenItems}
        </div>
      </div>
    );
  };

  const isSubPage = pathname !== '/dashboard' && pathname !== '/dashboard/';

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
            Gerenciador de<br />Ferramentas Customizadas
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>

          {renderMenuGroup(
            'Monitoramento',
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
            ['/dashboard/pre-vendas', '/dashboard/sincronia'],
            ['prevendas', 'sincronia'],
            <>
              {renderMenuItem('Pré-vendas', <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>, '/dashboard/pre-vendas', 'prevendas')}
              {renderMenuItem('Sincronia', <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" /></svg>, '/dashboard/sincronia', 'sincronia')}
            </>
          )}

          {renderMenuGroup(
            'Avisos Importantes',
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
            ['/dashboard/caixas-sem-gravacao', '/dashboard/descontos', '/dashboard/estoque', '/dashboard/exclusoes'],
            ['caixas_sem_gravacao', 'descontos_concedidos', 'estoque_critico', 'exclusoes'],
            <>
              {renderMenuItem('Caixas Sem Gravação', null, '/dashboard/caixas-sem-gravacao', 'caixas_sem_gravacao')}
              {renderMenuItem('Descontos Concedidos', null, '/dashboard/descontos', 'descontos_concedidos')}
              {renderMenuItem('Controle Estoque Combustivel', null, '/dashboard/estoque', 'estoque_critico')}
              {renderMenuItem('Exclusões', null, '/dashboard/exclusoes', 'exclusoes')}
            </>
          )}

          {renderMenuGroup(
            'Relatórios',
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
            ['/dashboard/transacoes-pos', '/dashboard/transacoes-duplicadas'],
            ['dre', 'custo_medio'],
            <>
              {renderMenuItem('Transações - POS', null, '/dashboard/transacoes-pos', 'dre')}
              {renderMenuItem('Transações - Possíveis Duplicadas', null, '/dashboard/transacoes-duplicadas', 'custo_medio')}
            </>
          )}

          {renderMenuGroup(
            'Suporte e Chamados',
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
            ['/dashboard/chamados'],
            ['chamados'],
            <>
              {renderMenuItem('Chamados Abertos', <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>, '/dashboard/chamados', 'chamados')}
            </>
          )}

          {/* O Menu Configurações SEMPRE some para o Cliente. Só aparece se a Role for Admin. */}
          {role === 'admin' && renderMenuGroup(
            'Configurações',
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0-1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
            ['/dashboard/configuracoes/email', '/dashboard/configuracoes/clientes', '/dashboard/configuracoes/usuarios'],
            [],
            <>
              <Link href="/dashboard/configuracoes/email" className={`menu-item ${isActive('/configuracoes/email')}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                Conf. Email Aplicativo
              </Link>
              <Link href="/dashboard/configuracoes/clientes" className={`menu-item ${isActive('/configuracoes/clientes')}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                Cadastro de Banco de Cliente
              </Link>
              <Link href="/dashboard/configuracoes/usuarios" className={`menu-item ${isActive('/configuracoes/usuarios')}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                Cadastro de Usuário de Cliente
              </Link>
            </>
          )}
        </nav>


        {pushPermission === 'default' && (
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <button
              onClick={requestNotificationPermission}
              style={{ background: '#3b82f6', border: 'none', borderRadius: '4px', padding: '6px 12px', color: '#fff', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              🔔 Ativar Notificações
            </button>
          </div>
        )}

        <div style={{ marginTop: 'auto', padding: '12px 12px 0 12px', textAlign: 'center', color: '#cbd5e1', fontSize: '12px', fontWeight: 600 }}>
          Olá, {user}
        </div>

        <div style={{ textAlign: 'center', marginTop: '4px', marginBottom: '8px' }}>
          <button
            onClick={() => window.location.href = '/dashboard/alterar-senha'}
            style={{ background: 'transparent', border: '1px solid #334155', borderRadius: '4px', padding: '4px 8px', color: '#94a3b8', fontSize: '11px', cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.background = '#334155'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            Alterar senha
          </button>
        </div>

        <a
          href="https://comercialinformatica.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            color: '#64748b',
            fontSize: '11px',
            textDecoration: 'none',
            padding: '4px 12px 12px 12px',
            transition: 'color 0.2s',
            textAlign: 'center'
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal Dinâmico */}
      <main className="dashboard-main">
        {isSubPage && (
          <div style={{ marginBottom: '20px' }}>
            <Link 
              href="/dashboard" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: '#94a3b8',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 500,
                background: 'rgba(30, 41, 59, 0.4)',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '6px 12px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = '#38bdf8';
                e.currentTarget.style.borderColor = '#38bdf8';
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = '#94a3b8';
                e.currentTarget.style.borderColor = '#334155';
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.4)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Voltar para página principal
            </Link>
          </div>
        )}
        {children}
      </main>

    </div>
  );
}

