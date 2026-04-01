"use client";

import { useState, useEffect } from 'react';

function isValidCNPJ(cnpj: string): boolean {
  const digitsOnly = cnpj.replace(/[^\d]+/g, '');
  if (digitsOnly.length !== 14) return false;
  if (/^(\d)\1+$/.test(digitsOnly)) return false;
  
  let tamanho = digitsOnly.length - 2;
  let numeros = digitsOnly.substring(0, tamanho);
  const digitos = digitsOnly.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;
  
  tamanho = tamanho + 1;
  numeros = digitsOnly.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) return false;
  
  return true;
}

export default function ConfigAlertas() {
  const [formData, setFormData] = useState({
    cnpj: '',
    emails: ''
  });
  
  const [isEditing, setIsEditing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success'} | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/config/alertas`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data && Object.keys(data.data).length > 0) {
          setFormData({
            cnpj: data.data.cnpj || '',
            emails: data.data.emails || ''
          });
          setIsEditing(false);
        } else {
          setIsEditing(true);
        }
      });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'cnpj') {
      let val = value.replace(/\D/g, "");
      if (val.length > 14) val = val.substring(0, 14);
      val = val.replace(/^(\d{2})(\d)/, "$1.$2");
      val = val.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
      val = val.replace(/\.(\d{3})(\d)/, ".$1/$2");
      val = val.replace(/(\d{4})(\d)/, "$1-$2");
      setFormData({ ...formData, [name]: val });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSaveConfiguration = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    if (!isValidCNPJ(formData.cnpj)) {
      setToast({ message: 'CNPJ inválido. Verifique os dados digitados e tente novamente.', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/config/alertas`, {
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
        <h1 className="title-primary">Cadastro de Inf Clientes</h1>
        <p className="text-muted">Cadastre a identificação do cliente e os destinatários que receberão os alertas diários e monitoramentos.</p>
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
              onClick={() => setIsEditing(true)}
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
          
          <div className="input-group">
            <label className="input-label">CNPJ do Cliente *</label>
            <input 
              name="cnpj" 
              value={formData.cnpj} 
              onChange={handleInputChange} 
              className="gfc-input" 
              placeholder="00.000.000/0000-00" 
              required 
              disabled={!isEditing}
            />
          </div>

          <div className="input-group">
            <label className="input-label">E-mails de Destino *</label>
            <textarea 
              name="emails" 
              rows={3}
              value={formData.emails} 
              onChange={handleInputChange} 
              className="gfc-input" 
              placeholder="contato@empresa.com; ti@empresa.com.br" 
              required 
              disabled={!isEditing}
              style={{ padding: '12px', resize: 'vertical' }}
            />
            <p className="text-muted" style={{ fontSize: '13px', marginTop: '6px', color: '#fbbf24' }}>
              <strong>Atenção:</strong> Se for enviar para mais de um e-mail, separe-os obrigatoriamente utilizando ponto e vírgula (;). Exemplo: <code>email1@a.com; email2@b.com</code>.
            </p>
          </div>

          {isEditing && (
            <div style={{ marginTop: '32px' }}>
              <button 
                type="submit" 
                className="gfc-button secondary" 
                style={{ width: '100%', borderColor: '#10b981', color: '#10b981' }}
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar Destinatários'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

