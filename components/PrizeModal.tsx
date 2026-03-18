"use client";

import { X, Trophy, Sparkles } from "lucide-react";

interface PrizeModalProps {
  open: boolean;
  prize: any;
  onClose: () => void;
}

export function PrizeModal({ open, prize, onClose }: PrizeModalProps) {
  if (!open || !prize) return null;

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

        <div className="bg-gradient-to-r from-[#FF1493]/20 to-[#8B0045]/20 border border-[#FF1493]/30 w-full py-6 rounded-2xl mb-8 shadow-inner">
          <span className="text-2xl font-black uppercase text-[#FF1493] drop-shadow-md">
            {prize.name}
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#FF1493] text-white py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[#FF1493]/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          Resgatar Prêmio
        </button>
      </div>
    </div>
  );
}
