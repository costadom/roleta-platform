"use client";
import { useState, useEffect } from 'react';

export default function TesteRetornoPix() {
  const [pixData, setPixData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [pagamentoConfirmado, setPagamentoConfirmado] = useState(false);
  const [erroPushin, setErroPushin] = useState<string | null>(null);

  // SEU ID REAL DO SUPABASE
  const USER_ID = "d31bc0bd-64cb-4ce0-b93c-2c886f86116e"; 

  const gerarPix = async () => {
    setLoading(true);
    setPagamentoConfirmado(false);
    setErroPushin(null);
    setPixData(null);

    try {
      const response = await fetch('/api/checkout/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 1, userId: USER_ID }),
      });
      const data = await response.json();

      // Se a PushinPay der erro (como o 400), a tela não quebra, ela mostra o motivo!
      if (!response.ok || !data.qr_code_base64) {
        setErroPushin(JSON.stringify(data, null, 2));
      } else {
        setPixData(data);
      }
    } catch (error: any) {
      setErroPushin(error.message);
    }
    setLoading(false);
  };

  // O Radar
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
      }, 5000);
    }

    return () => clearInterval(intervalo);
  }, [pixData, pagamentoConfirmado]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-[#FF1493] text-2xl font-black mb-8 uppercase">Teste de Retorno PIX</h1>

      {/* MENSAGEM DE ERRO NA TELA */}
      {erroPushin && (
        <div className="bg-red-900/50 border-2 border-red-500 p-4 rounded-xl mb-6 max-w-md w-full">
          <h3 className="text-red-400 font-bold mb-2 uppercase">A PushinPay recusou o PIX:</h3>
          <pre className="text-xs text-red-200 whitespace-pre-wrap">{erroPushin}</pre>
        </div>
      )}

      {!pixData ? (
        <button 
          onClick={gerarPix}
          disabled={loading}
          className="bg-[#FF1493] text-white px-8 py-4 rounded-xl font-bold uppercase tracking-wider hover:bg-[#ff1493]/80 transition-colors"
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
        </div>
      )}
    </div>
  );
}
