"use client";

import { useEffect, useState } from "react";
import { X, Trophy, Frown, Sparkles } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

type PrizeModalProps = {
  open: boolean;
  onClose: () => void;
  prize: any | null;
};

export function PrizeModal({ open, onClose, prize }: PrizeModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !prize) return null;

  // Verificação robusta para ver se é o prêmio de "Tente Novamente"
  const prizeName = prize.name || prize.shortLabel || "";
  const isRetry = prizeName.trim().toUpperCase() === "TENTE OUTRA VEZ";

  return (
    <Dialog.Root open={open} onOpenChange={(val) => !val && onClose()}>
      <Dialog.Portal>
        {/* Overlay do fundo com desfoque */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl animate-in fade-in duration-400" />
        
        {/* Conteúdo do Modal */}
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-[2.5rem] bg-[#0f0f0f] border border-white/10 p-10 text-center shadow-2xl animate-in zoom-in-95 duration-400 focus:outline-none">
          
          {/* Botão de Fechar */}
          <Dialog.Close className="absolute right-6 top-6 text-white/30 hover:text-white transition-colors active:scale-90">
            <X size={22} />
          </Dialog.Close>

          {/* LÓGICA DE RENDEREZAÇÃO CONDICIONAL */}
          {isRetry ? (
            // VISUAL 1: CARINHA TRISTE (TENTE OUTRA VEZ)
            <>
              {/* Ícone de Carinha Triste com brilho cinza apagado */}
              <div className="mx-auto mb-5 h-20 w-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                <Frown size={40} className="text-white/30" />
              </div>
              
              <Dialog.Title className="text-xl font-black uppercase text-white tracking-tighter italic mb-1">
                Você Ganhou!
              </Dialog.Title>
              
              {/* Mensagem Carinhosa do Rafael */}
              <Dialog.Description className="text-[11px] font-medium uppercase text-white/40 tracking-widest leading-relaxed mb-10 max-w-[280px] mx-auto">
                (que pena amor, mas tente novamente e boa sorte na próxima)
              </Dialog.Description>
            </>
          ) : (
            // VISUAL 2: TROFÉU PADRÃO (VITÓRIA)
            <>
              {/* Ícone de Troféu Dourado com brilho quente */}
              <div className="mx-auto mb-5 h-20 w-20 rounded-full bg-[#FFD700]/10 flex items-center justify-center border border-[#FFD700]/20 shadow-[0_0_30px_rgba(255,215,0,0.15)]">
                <Trophy size={40} className="text-[#FFD700]" />
              </div>
              
              <Dialog.Title className="text-xl font-black uppercase text-white tracking-tighter italic mb-1">
                Você Ganhou!
              </Dialog.Title>
              
              <Dialog.Description className="text-[11px] font-medium uppercase text-white/40 tracking-widest leading-relaxed mb-10 max-w-[280px] mx-auto">
                Boa, anjo! Você tirou a sorte grande e garantiu este prêmio especial da roleta.
              </Dialog.Description>
            </>
          )}

          {/* Caixa de Texto do Prêmio */}
          <div className="relative mb-8 rounded-2xl bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] p-6 shadow-inner ring-1 ring-white/10 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FFD700]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <span className="text-[9px] font-black uppercase text-[#FFD700] tracking-[0.2em] mb-1 block flex items-center gap-1.5 justify-center opacity-80">
              <Sparkles size={11} className="text-[#FFD700]" /> Prêmio Confirmado
            </span>
            <span className="text-xl font-black uppercase text-white tracking-tighter">
              {prizeName}
            </span>
          </div>

          {/* Botão Fechar com Gradiente */}
          <button 
            onClick={onClose} 
            className="w-full h-14 rounded-2xl bg-gradient-to-b from-[#FFD700] via-[#c99f24] to-[#7a5c00] text-sm font-black uppercase tracking-widest text-black shadow-lg shadow-[#FFD700]/10 transition-all active:scale-95 hover:brightness-110"
          >
            Fechar
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
