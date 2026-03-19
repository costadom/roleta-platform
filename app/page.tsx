"use client";
import { useState } from 'react';

export default function TestePix() {
  const [pixData, setPixData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [debugRaw, setDebugRaw] = useState<string>("");

  const testarCheckout = async () => {
    setLoading(true);
    setDebugRaw("Iniciando chamada...");
    setPixData(null);

    try {
      const response = await fetch('/api/checkout/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: 1, 
          userId: 'USUARIO_TESTE_01' 
        }),
      });

      const data = await response.json();
      // AQUI ESTÁ O ESPIÃO REVELADOR: Mostra tudo o que a PushinPay mandou
      setDebugRaw(JSON.stringify(data, null, 2));
      
      if (response.ok) {
        setPixData(data);
      }
    } catch (error: any) {
      setDebugRaw("Erro: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#000', color: '#fff', minHeight: '100vh' }}>
      <h2 style={{ color: '#00ff00' }}>🕵️ Espião Revelador Savanah</h2>
      
      <button onClick={testarCheckout} disabled={loading} style={{ background: '#00ff00', padding: '10px', fontWeight: 'bold' }}>
        {loading ? 'Consultando...' : '🚀 GERAR PIX REAL'}
      </button>

      <div style={{ marginTop: '20px' }}>
        <h4 style={{ color: '#aaa' }}>Resposta Bruta da PushinPay (O que veio de lá):</h4>
        <pre style={{ 
          backgroundColor: '#111', 
          padding: '15px', 
          border: '1px solid #333', 
          color: '#00ff00',
          overflowX: 'auto',
          fontSize: '12px'
        }}>
          {debugRaw || "Aguardando clique..."}
        </pre>
      </div>

      {/* Tenta mostrar o QR Code de várias formas possíveis */}
      {(pixData?.qr_code || pixData?.qr_code_base64 || pixData?.data?.qr_code) && (
        <div style={{ marginTop: '20px', padding: '10px', border: '2px solid #00ff00' }}>
          <h3 style={{ color: '#00ff00' }}>✅ QR CODE ENCONTRADO!</h3>
          <p>Se você está vendo isso, a integração funcionou!</p>
        </div>
      )}
    </div>
  );
}
