import { X } from "lucide-react";

export function PrizeModal({
  open,
  prize,
  onClose,
}: {
  open: boolean;
  prize: any;
  onClose: () => void;
}) {
  if (!open || !prize) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#121212] border border-white/10 rounded-3xl p-8 w-full max-w-sm text-center relative shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="text-5xl mb-4 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">
          🏆
        </div>

        <h2 className="text-xl font-black uppercase text-white mb-2 tracking-wide">
          Você ganhou!
        </h2>

        <p className="text-[11px] text-white/60 mb-8 px-2">
          Boa, anjo! Você tirou a sorte grande e garantiu este prêmio especial
          da roleta.
        </p>

        <div className="bg-black/50 border border-white/10 rounded-2xl p-5 mb-8 shadow-inner relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-600"></div>
          <p className="text-[9px] text-amber-400 font-bold uppercase tracking-[0.2em] mb-2">
            Prêmio Confirmado
          </p>
          <p className="text-lg font-black text-white uppercase drop-shadow-md">
            {prize.name}
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-[#f7d38a] via-[#f3c96a] to-[#8a5b13] text-black font-black uppercase tracking-[0.15em] text-xs py-4 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_10px_30px_rgba(245,158,11,0.2)]"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
