"use client";
import { useState } from 'react';

export default function CheckoutTeste() {
  const [pixData, setPixData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const gerarPix = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/checkout/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 1, userId: 'RAFAEL_BOSS_01' }),
      });
      const data = await response.json();
      setPixData(data);
    } catch (error) {
      console.error("Erro:", error);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '40px', backgroundColor: '#000', color: '#fff', minHeight: '100vh', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#00ff00', marginBottom: '10px' }}>SAVANAH LABZ</h1>
      <p style={{ color: '#888' }}>Teste de Integração de Pagamento Real</p>

      {!pixData ? (
        <button 
          onClick={gerarPix} 
          disabled={loading}
          style={{ 
            background: '#00ff00', color: '#000', padding: '15px 30px', 
            fontSize: '18px', fontWeight: 'bold', borderRadius: '50px', 
            border: 'none', cursor: 'pointer', marginTop: '20px' 
          }}
        >
          {loading ? 'GERANDO...' : '🚀 GERAR PIX DE R$ 1,00'}
        </button>
      ) : (
        <div style={{ marginTop: '30px', backgroundColor: '#111', padding: '20px', borderRadius: '20px', display: 'inline-block' }}>
          <h3 style={{ color: '#00ff00' }}>QR Code Gerado!</h3>
          
          {/* AQUI ESTÁ A MÁGICA: DESENHANDO A IMAGEM NA TELA */}
          <img 
            src={pixData.qr_code_base64} 
            alt="QR Code PIX" 
            style={{ width: '250px', height: '250px', border: '10px solid #fff', borderRadius: '10px', marginTop: '10px' }} 
          />

          <div style={{ marginTop: '20px' }}>
            <p style={{ fontSize: '14px', color: '#aaa' }}>Ou use o Copia e Cola:</p>
            <input 
              readOnly 
              value={pixData.qr_code} 
              style={{ width: '100%', padding: '10px', background: '#222', color: '#fff', border: '1px solid #333', textAlign: 'center' }} 
            />
            <button 
              onClick={() => { navigator.clipboard.writeText(pixData.qr_code); alert('Copiado!'); }}
              style={{ marginTop: '10px', background: 'transparent', color: '#00ff00', border: 'none', cursor: 'pointer' }}
            >
              📋 Copiar Código
            </button>
          </div>

          <p style={{ marginTop: '20px', color: '#ffcc00', fontSize: '13px' }}>
            ⚠️ Após pagar, o Webhook da PushinPay avisará o sistema!
          </p>
        </div>
      )}
    </div>
  );
}
