"use client";

import { useState } from "react";
import { X, Trophy, Sparkles, ExternalLink, MessageCircle, Coins, Image as ImageIcon } from "lucide-react";

interface PrizeModalProps {
  open: boolean;
  prize: any;
  onClose: () => void;
  playerName: string;
  modelName: string;
}

export function PrizeModal({ open, prize, onClose, playerName, modelName }: PrizeModalProps) {
  const [viewingMedia, setViewingMedia] = useState(false);

  if (!open || !prize) return null;

  const CENTRAL_WHATSAPP = "5515996587248";
  const deliveryType = prize.delivery_type || 'whatsapp';
  
  // Transforma os links separados por vírgula em uma array (lista) de fotos
  const mediaUrls = prize.delivery_value ? prize.delivery_value.split(',').filter(Boolean) : [];

  const handleAction = () => {
    if (deliveryType === 'link' && prize.delivery_value) {
      window.open(prize.delivery_value, '_blank');
    } else if (deliveryType === 'whatsapp') {
      const text = `Oi! Aqui é o(a) ${playerName}. Girei a roleta da modelo ${modelName} e ganhei o prêmio: "${prize.name}". Vim resgatar!`;
      window.open(`https://api.whatsapp.com/send?phone=${CENTRAL_WHATSAPP}&text=${encodeURIComponent(text)}`, '_blank');
    } else if (deliveryType === 'media') {
      // Abre a galeria na hora
      setViewingMedia(true);
      return; 
    }
    onClose();
  };

  // 🔥 SE ESTIVER VENDO AS FOTOS, RENDERIZA A GALERIA LINDONA 🔥
  if (viewingMedia && mediaUrls.length > 0) {
      return (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in zoom-in duration-300">
             <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white bg-white/10 p-3 rounded-full transition-colors z-[110]">
                 <X size={24} />
             </button>
             
             <div className="text-center mb-6">
                 <div className="flex items-center justify-center gap-2 mb-2">
                     <Sparkles size={20} className="text-[#FFD700]" />
                     <h2 className="text-2xl font-black uppercase text-[#FFD700] italic">Conteúdo Desbloqueado</h2>
                 </div>
                 <p className="text-[10px] font-black uppercase text-white/50 tracking-widest bg-white/5 inline-block px-4 py-1.5 rounded-full">Prêmio: {prize.name}</p>
             </div>

             <div className="w-full max-w-4xl max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                     {mediaUrls.map((url: string, index: number) => (
                         <div key={index} className="relative aspect-[3/4] bg-[#111] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                             {url.includes('.mp4') ? (
                                 <video src={url} controls className="w-full h-full object-cover" />
                             ) : (
                                 <img src={url} className="w-full h-full object-cover" />
                             )}
                         </div>
                     ))}
                 </div>
             </div>

             <style jsx>{`
               .custom-scrollbar::-webkit-scrollbar { width: 4px; }
               .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
               .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
             `}</style>
          </div>
      );
  }

  // TELA DE VITÓRIA PADRÃO
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-[#0f0f0f] border border-[#FFD700]/30 p-8 rounded-[3rem] max-w-sm w-full relative shadow-[0_0_40px_rgba(255,215,0,0.2)] flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
        
        <div className="h-24 w-24 bg-[#FFD700]/10 rounded-full flex items-center justify-center mb-6 border border-[#FFD700]/30 shadow-xl mx-auto relative">
          <Sparkles className="absolute -top-2 -right-2 text-[#FFD700] animate-pulse" size={20} />
          <Trophy className="text-[#FFD700]" size={40} />
        </div>

        <h2 className="text-3xl font-black uppercase text-white mb-2 tracking-tighter italic">Parabéns!</h2>
        <p className="text-[10px] uppercase font-black tracking-widest text-white/50 mb-6">
          Seu prêmio foi desbloqueado
        </p>

        <div className="bg-gradient-to-r from-[#FF1493]/20 to-[#8B0045]/20 border border-[#FF1493]/30 w-full py-6 rounded-2xl mb-8 shadow-inner relative overflow-hidden">
          {deliveryType === 'credit' && <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase text-emerald-400 tracking-widest">Saldo Adicionado</div>}
          <span className="text-xl sm:text-2xl font-black uppercase text-[#FF1493] drop-shadow-md px-2 text-center block">
            {prize.name}
          </span>
        </div>

        {/* 🔥 NOVO BOTÃO DE MÍDIA 🔥 */}
        {deliveryType === 'media' && (
          <button onClick={handleAction} className="w-full bg-[#00f0ff] text-black py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
            <ImageIcon size={18} /> Ver Conteúdo Agora
          </button>
        )}

        {deliveryType === 'link' && (
          <button onClick={handleAction} className="w-full bg-emerald-500 text-black py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
            <ExternalLink size={18} /> Acessar Conteúdo Agora
          </button>
        )}

        {deliveryType === 'whatsapp' && (
          <button onClick={handleAction} className="w-full bg-[#FF1493] text-white py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[#FF1493]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
            <MessageCircle size={18} /> Resgatar no Suporte
          </button>
        )}

        {deliveryType === 'credit' && (
          <button onClick={onClose} className="w-full bg-[#FFD700] text-black py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[#FFD700]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
            <Coins size={18} /> Fechar e Girar de Novo
          </button>
        )}
      </div>
    </div>
  );
}
