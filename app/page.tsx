"use client";
import { useState } from 'react';

export default function TestePix() {
  const [pixData, setPixData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testarCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/checkout/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: 1, // Teste de 1 Real
          userId: 'USUARIO_TESTE_01' 
        }),
      });
      const data = await response.json();
      setPixData(data);
    } catch (error) {
      console.error("Erro no teste:", error);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #fff', marginTop: '20px' }}>
      <h3>🚀 Teste de Checkout Savanah</h3>
      <button 
        onClick={testarCheckout}
        disabled={loading}
        style={{ background: '#00ff00', color: '#000', padding: '10px', borderRadius: '5px', cursor: 'pointer' }}
      >
        {loading ? 'Gerando PIX...' : 'Gerar PIX de R$ 1,00'}
      </button>

      {pixData?.qr_code && (
        <div style={{ marginTop: '20px' }}>
          <p>Copia e Cola gerado com sucesso! ✅</p>
          <textarea readOnly value={pixData.qr_code} style={{ width: '100%', height: '100px', color: '#000' }} />
          <p>Agora é só pagar no seu banco para testar o Webhook!</p>
        </div>
      )}
    </div>
  );
}
