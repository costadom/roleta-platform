"use client";
import { useState, useEffect } from 'react';

export default function TesteRetornoPix() {
  const [pixData, setPixData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [pagamentoConfirmado, setPagamentoConfirmado] = useState(false);

  // SEU ID REAL JÁ COLOCADO AQUI:
  const USER_ID = "d31bc0bd-64cb-4ce0-b93c-2c886f86116e"; 

  const gerarPix = async () => {
    setLoading(true);
    setPagamentoConfirmado(false);
    try {
      const response = await fetch('/api/checkout/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 1, userId: USER_ID }),
      });
      const data = await response.json();
      setPixData(data);
    } catch (error) {
      console.error("Erro ao gerar PIX:", error);
    }
    setLoading(false);
  };

  // O "Radar": Fica perguntando pro banco se o dinheiro já caiu
  useEffect(() => {
    let intervalo: NodeJS.Timeout;

    if (pixData && !pagamentoConfirmado) {
      intervalo = setInterval(async () => {
        try {
          const res = await fetch(`/api/checkout/check-status?userId=${USER_ID}`);
          const data = await res.json();
          
          if (data.status === 'pago') {
            setPagamentoConfirmado(true);
            clearInterval(intervalo);
          }
        } catch (error) {
          console.error("Erro no radar:", error);
        }
      }, 5000); // Checa a cada 5 segundos
    }

    return () => clearInterval(intervalo);
  }, [pixData, pagamentoConfirmado]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-[#FF1493] text-2xl font-black mb-8 uppercase">Teste de Retorno PIX</h1>

      {!pixData ? (
        <button 
          onClick={gerarPix}
          disabled={loading}
          className="bg-[#FF1493] text-white px-8 py-4 rounded-xl font-bold uppercase tracking-wider"
        >
          {loading ? 'Gerando PIX...' : 'Gerar PIX R$ 1,00'}
        </button>
      ) : !pagamentoConfirmado ? (
        <div className="bg-white/10 p-8 rounded-2xl flex flex-col items-center border border-[#FF1493]/30">
          <h2 className="text-[#FFD700] mb-4 font-bold">Aguardando Pagamento...</h2>
          <img 
            src={pixData.qr_code_base64} 
            alt="QR Code" 
            className="w-64 h-64 border-4 border-white rounded-lg mb-4"
          />
          <input 
            readOnly 
            value={pixData.qr_code} 
            className="w-full bg-black/50 p-3 rounded text-xs text-white/70 text-center mb-2"
          />
          <p className="text-xs text-white/50 animate-pulse mt-4">
            O radar está checando o banco de dados a cada 5 segundos...
          </p>
        </div>
      ) : (
        <div className="bg-[#FF1493]/20 p-8 rounded-2xl flex flex-col items-center border border-[#FF1493] animate-bounce">
          <h2 className="text-[#00ff00] text-3xl font-black mb-2 uppercase">✅ Pagamento Aprovado!</h2>
          <p className="text-white">Os créditos já caíram na conta do Supabase.</p>
          <button 
            onClick={() => { setPixData(null); setPagamentoConfirmado(false); }}
            className="mt-6 text-sm text-[#FFD700] underline"
          >
            Fazer novo teste
          </button>
        </div>
      )}
    </div>
  );
}
