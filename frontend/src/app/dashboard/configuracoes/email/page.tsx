"use client";

import { useState, useEffect } from 'react';

export default function ConfigEmail() {
  const [formData, setFormData] = useState({
    host: 'smtp.gmail.com',
    port: '587',
    email: '',
    password: ''
  });
  
  const [isEditing, setIsEditing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success'} | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/config/email`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data && Object.keys(data.data).length > 0) {
          setFormData({
            host: data.data.host || 'smtp.gmail.com',
            port: data.data.port || '587',
            email: data.data.email || '',
            password: data.data.password || ''
          });
          setIsEditing(false);
        } else {
          setIsEditing(true);
        }
      });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSaveConfiguration = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/config/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      if (res.ok) {
        setToast({ message: data.message, type: 'success' });
        setIsEditing(false);
      } else {
        setToast({ message: data.message || 'Erro ao salvar.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Falha na requisição de salvamento.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <header style={{ marginBottom: 32 }}>
        <h1 className="title-primary">Conf. Email Aplicativo</h1>
        <p className="text-muted">Configure o servidor SMTP (ex: Gmail) utilizado para o envio de alertas pelo sistema.</p>
      </header>
      
      {toast && (
        <div className={`toast fade-in`} style={{
            background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            borderColor: toast.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            color: toast.type === 'error' ? '#fca5a5' : '#6ee7b7',
            marginBottom: '24px'
        }}>
          {toast.message}
        </div>
      )}

      <div className="dashboard-card" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          {!isEditing ? (
            <button 
              onClick={() => {
                setIsEditing(true);
                if (formData.password === '********') {
                  setFormData(prev => ({ ...prev, password: '' }));
                }
              }}
              className="gfc-button secondary" 
              style={{ fontSize: '13px' }}
            >
              Habilitar Edição
            </button>
          ) : (
             <button 
              onClick={() => setIsEditing(false)}
              className="gfc-button" 
              style={{ fontSize: '13px', background: 'transparent', color: '#94a3b8' }}
            >
              Cancelar Edição
            </button>
          )}
        </div>

        <form onSubmit={handleSaveConfiguration}>
          
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Servidor SMTP *</label>
              <input 
                name="host" 
                value={formData.host} 
                onChange={handleInputChange} 
                className="gfc-input" 
                placeholder="smtp.gmail.com" 
                required 
                disabled={!isEditing}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Porta *</label>
              <input 
                name="port" 
                value={formData.port} 
                onChange={handleInputChange} 
                className="gfc-input" 
                placeholder="587" 
                type="number"
                required
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">E-mail do Remetente *</label>
            <input 
              name="email" 
              type="email"
              value={formData.email} 
              onChange={handleInputChange} 
              className="gfc-input" 
              placeholder="ex: alertas@suaempresa.com" 
              required 
              disabled={!isEditing}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Senha de Aplicativo *</label>
            <input 
              name="password" 
              value={formData.password} 
              onChange={handleInputChange} 
              className="gfc-input" 
              type={isEditing ? "text" : "password"} 
              placeholder={isEditing ? "Senha App" : "********"} 
              required 
              disabled={!isEditing}
            />
            <p className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>
              Para Gmail, ative a verificação em duas etapas e crie uma "Senha de App" de 16 dígitos.
            </p>
          </div>

          {isEditing && (
            <div style={{ marginTop: '32px' }}>
              <button 
                type="submit" 
                className="gfc-button primary" 
                style={{ width: '100%' }}
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar Servidor de E-mail'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

