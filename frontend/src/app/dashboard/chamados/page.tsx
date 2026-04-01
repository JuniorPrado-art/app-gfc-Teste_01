"use client";

export default function ChamadosPage() {
  return (
    <div className="fade-in" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', padding: '60px 40px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '24px', border: '1px solid rgba(51, 65, 85, 0.8)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <h1 style={{ color: '#f8fafc', fontSize: '28px', fontWeight: 700, marginBottom: '16px', letterSpacing: '-0.02em' }}>
          Suporte e Chamados
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '18px', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
          Estamos preparando algo incrível aqui. Volte em breve!
        </p>
      </div>
    </div>
  );
}
