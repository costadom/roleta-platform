import { Prize } from "@/src/data/prizes";

type PrizeModalProps = {
  open: boolean;
  prize: Prize | null;
  onClose: () => void;
};

export function PrizeModal({ open, prize, onClose }: PrizeModalProps) {
  if (!open || !prize) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xs rounded-3xl bg-gradient-to-b from-[#2b000c] via-[#150008] to-black p-[1px] shadow-[0_30px_80px_rgba(0,0,0,0.95)]">
        <div className="rounded-3xl bg-gradient-to-b from-[#3b000f] via-[#1a0107] to-black px-6 py-6">
          <div className="mb-3 flex items-center justify-center">
            <div className="inline-flex rounded-full bg-gradient-to-r from-[#f7d38a] via-[#f3c96a] to-[#8a5b13] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-black">
              Parabéns!
            </div>
          </div>

          <div className="mb-4 text-center">
            <p className="text-xs text-white/70">Você acaba de ganhar</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {prize.name}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#f7d38a] via-[#f3c96a] to-[#8a5b13] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-black shadow-[0_20px_38px_rgba(250,204,21,0.7)] transition hover:brightness-110 active:translate-y-px"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

