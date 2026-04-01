"use client";

export default function DREPage() {
  return (
    <div className="fade-in" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', padding: '60px 40px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '24px', border: '1px solid rgba(51, 65, 85, 0.8)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
        <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        </div>
        <h1 style={{ color: '#f8fafc', fontSize: '28px', fontWeight: 700, marginBottom: '16px', letterSpacing: '-0.02em' }}>
          Relatório de DRE
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '18px', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
          Estamos preparando algo incrível aqui. Volte em breve!
        </p>
      </div>
    </div>
  );
}
