"use client";

import { X, Gift } from "lucide-react";

interface PrizeModalProps {
  open: boolean;
  prize: any;
  onClose: () => void;
}

export function PrizeModal({ open, prize, onClose }: PrizeModalProps) {
  if (!open || !prize) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-[#1a000d] border border-[#FF1493]/30 p-8 rounded-[3rem] max-w-sm w-full relative shadow-2xl shadow-[#FF1493]/20 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
        
        <div className="h-24 w-24 bg-[#FF1493]/10 rounded-full flex items-center justify-center mb-6 border border-[#FF1493]/30 shadow-lg mx-auto">
          <Gift className="text-[#FF1493]" size={48} />
        </div>

        <h2 className="text-3xl font-black uppercase text-white mb-2 tracking-tighter">Você Ganhou!</h2>
        <p className="text-[10px] uppercase font-black tracking-widest text-[#FFD700] mb-6">
          Tire um print desta tela
        </p>

        <div className="bg-black/50 border border-white/10 w-full py-6 rounded-2xl mb-6">
          <span className="text-2xl font-black uppercase text-[#FF1493]">
            {prize.name}
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-[#FF1493] to-[#9c0a58] text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
        >
          Resgatar
        </button>
      </div>
    </div>
  );
}
