"use client";

import { useState, useEffect } from 'react';

export default function AlterarSenha() {
  const [formData, setFormData] = useState({
    senha_atual: '',
    nova_senha: '',
    confirmar_senha: ''
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'error' | 'success' } | null>(null);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const user = localStorage.getItem('gfc_user');
    if (user) setUsername(user);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);

    if (formData.nova_senha !== formData.confirmar_senha) {
      setToast({ message: 'A nova senha e a confirmação não coincidem.', type: 'error' });
      return;
    }

    if (formData.nova_senha.length < 6) {
      setToast({ message: 'A nova senha deve ter pelo menos 6 caracteres.', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          senha_atual: formData.senha_atual,
          nova_senha: formData.nova_senha
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setToast({ message: data.message, type: 'success' });
        setFormData({ senha_atual: '', nova_senha: '', confirmar_senha: '' });
      } else {
        setToast({ message: data.message || 'Erro ao alterar a senha.', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Falha na conexão com o servidor.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <header style={{ marginBottom: 32 }}>
        <h1 className="title-primary">Alterar Senha</h1>
        <p className="text-muted">Atualize sua senha de acesso ao sistema.</p>
      </header>

      {toast && (
        <div className="toast fade-in" style={{
          background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          borderColor: toast.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
          color: toast.type === 'error' ? '#fca5a5' : '#6ee7b7',
          marginBottom: '24px'
        }}>
          {toast.message}
        </div>
      )}

      <div className="dashboard-card" style={{ maxWidth: '400px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="input-group">
            <label className="input-label">Senha Atual</label>
            <input 
              name="senha_atual"
              type="password" 
              value={formData.senha_atual}
              onChange={handleInputChange}
              className="gfc-input" 
              placeholder="••••••••"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Nova Senha</label>
            <input 
              name="nova_senha"
              type="password" 
              value={formData.nova_senha}
              onChange={handleInputChange}
              className="gfc-input" 
              placeholder="••••••••"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Confirmar Nova Senha</label>
            <input 
              name="confirmar_senha"
              type="password" 
              value={formData.confirmar_senha}
              onChange={handleInputChange}
              className="gfc-input" 
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            className="gfc-button primary" 
            disabled={loading}
            style={{ marginTop: '8px' }}
          >
            {loading ? 'Salvando...' : 'Atualizar Senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
