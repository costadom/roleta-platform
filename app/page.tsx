"use client";
import { useState } from 'react';

export default function TestePix() {
  const [pixData, setPixData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorLog, setErrorLog] = useState<string>("");

  const testarCheckout = async () => {
    setLoading(true);
    setErrorLog("Iniciando chamada para a API...");
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

      setErrorLog(prev => prev + `\nStatus da Resposta: ${response.status} ${response.statusText}`);

      const data = await response.json();
      
      if (!response.ok) {
        setErrorLog(prev => prev + `\n❌ Erro na PushinPay: ${JSON.stringify(data)}`);
      } else {
        setErrorLog(prev => prev + `\n✅ Resposta recebida com sucesso!`);
        setPixData(data);
      }
    } catch (error: any) {
      setErrorLog(prev => prev + `\n🚨 Erro Crítico: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a1a', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#00ff00' }}>🕵️ Espião de Checkout Savanah</h2>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #444', borderRadius: '8px' }}>
        <button 
          onClick={testarCheckout}
          disabled={loading}
          style={{ 
            background: loading ? '#555' : '#00ff00', 
            color: '#000', 
            padding: '12px 24px', 
            fontSize: '16px',
            fontWeight: 'bold',
            borderRadius: '5px', 
            cursor: loading ? 'not-allowed' : 'pointer',
            border: 'none'
          }}
        >
          {loading ? 'Consultando PushinPay...' : '🚀 Gerar PIX Real (R$ 1,00)'}
        </button>
      </div>

      {/* PAINEL DO ESPIÃO */}
      <div style={{ backgroundColor: '#000', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#aaa' }}>Console de Diagnóstico:</h4>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '14px', color: '#00ff00' }}>
          {errorLog || "Aguardando clique no botão..."}
        </pre>
      </div>

      {pixData?.qr_code && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#003300', borderRadius: '8px' }}>
          <h3 style={{ color: '#0ff' }}>✅ SUCESSO! QR CODE GERADO:</h3>
          <p style={{ fontSize: '12px' }}>Copie o código abaixo e cole no seu banco:</p>
          <textarea 
            readOnly 
            value={pixData.qr_code} 
            style={{ width: '100%', height: '80px', backgroundColor: '#222', color: '#fff', border: '1px solid #0ff', padding: '10px' }} 
          />
        </div>
      )}
    </div>
  );
}
