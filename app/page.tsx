"use client";

import { useState } from "react";
import { User, Volume2, ShoppingCart, ChevronRight } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { RouletteWheel } from "@/components/RouletteWheel";
import { PRIZES } from "@/src/data/prizes";
import { weightedRandomIndex } from "@/src/lib/weightedRandom";
import { Prize } from "@/src/data/prizes";
import { PrizeModal } from "@/components/PrizeModal";

export default function Home() {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const segments = PRIZES.map((prize) => ({
    color: prize.color,
    label: prize.shortLabel,
  }));

  const handleSpin = () => {
    if (isSpinning) return;

    const weights = PRIZES.map((p) => p.weight);
    const index = weightedRandomIndex(weights);
    const sliceAngle = 360 / PRIZES.length;
    const sliceCenter = index * sliceAngle + sliceAngle / 2;

    // Garantir várias voltas completas e parar no prêmio sorteado
    const baseSpins = 5;
    const finalRotation =
      baseSpins * 360 + (360 - sliceCenter) + Math.random() * 4 - 2; // pequeno ruído

    setIsSpinning(true);
    setSelectedPrize(null);
    setModalOpen(false);

    // Atualiza rotação acumulada
    setRotation((prev) => prev + finalRotation);

    // Tempo deve coincidir com a duration da transição da roleta (3200ms)
    setTimeout(() => {
      setIsSpinning(false);
      setSelectedPrize(PRIZES[index]);
      setModalOpen(true);
    }, 3300);
  };

  return (
    <div className="min-h-screen bg-[#120008] font-sans text-white">
      <MobileShell>
        <div className="relative flex h-full flex-col">
          {/* Top info + ícones */}
          <div className="flex items-center justify-between text-xs text-white/70">
            <span className="rounded-full bg-black/40 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-amber-100/90">
              Roleta Premium
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              Online{" "}
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.35)]" />
            </span>
          </div>

          {/* Ícones de ações no topo */}
          <div className="pointer-events-none absolute right-4 top-10 z-30 flex flex-row items-center gap-2">
            <button className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/65 text-white shadow-[0_10px_25px_rgba(0,0,0,0.85)] ring-1 ring-white/10 backdrop-blur-md transition hover:bg-white/10">
              <User className="h-4 w-4" />
            </button>
            <button className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/65 text-white shadow-[0_10px_25px_rgba(0,0,0,0.85)] ring-1 ring-white/10 backdrop-blur-md transition hover:bg-white/10">
              <Volume2 className="h-4 w-4" />
            </button>
            <button className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/65 text-white shadow-[0_10px_25px_rgba(0,0,0,0.85)] ring-1 ring-white/10 backdrop-blur-md transition hover:bg-white/10">
              <ShoppingCart className="h-4 w-4" />
            </button>
          </div>

          {/* Conteúdo principal */}
          <div className="mt-5 flex flex-1 flex-row gap-3">
            {/* Área da roleta */}
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="flex justify-center mt-10 scale-[0.85] origin-center">
                <RouletteWheel
                  segments={segments}
                  rotation={rotation}
                  spinning={isSpinning}
                />
              </div>

              {/* Info abaixo da roleta */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-white/70">
                <span>Multiplicadores até x500</span>
                <span className="flex items-center gap-1">
                  Probabilidades justas
                  <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </div>

          {/* Área inferior com saldo, aposta e botões */}
          <div className="mt-4 grid grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,1.1fr)] items-end gap-2">
            {/* Card Saldo */}
            <div className="rounded-2xl bg-black/60 px-3 py-2 text-xs shadow-[0_16px_45px_rgba(0,0,0,0.95)] ring-1 ring-white/15 backdrop-blur-md">
              <span className="text-[11px] text-white/70">Saldo</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-sm font-semibold text-white">
                  R$ 1.234,50
                </span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                  VIP
                </span>
              </div>
            </div>

            {/* Botão Girar */}
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={handleSpin}
                disabled={isSpinning}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-b from-[#f97373] via-[#ef4444] to-[#7a0614] px-4 py-3 text-sm font-semibold tracking-wide text-white shadow-[0_20px_40px_rgba(248,113,113,0.7)] ring-1 ring-white/20 transition hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
              >
                Girar agora
              </button>
            </div>

            {/* Card Giro R$1,00 */}
            <div className="flex items-end justify-end">
              <div className="rounded-2xl bg-black/60 px-3 py-2 text-right text-xs shadow-[0_16px_45px_rgba(0,0,0,0.95)] ring-1 ring-white/15 backdrop-blur-md">
                <span className="text-[11px] text-white/70">Giro</span>
                <div className="mt-1 text-sm font-semibold text-amber-200">
                  R$ 1,00
                </div>
              </div>
            </div>
          </div>

          {/* Barra inferior com Depósito e CTA Girar */}
          <div className="mt-3 flex items-center gap-2">
            <button className="inline-flex flex-1 items-center justify-center rounded-2xl border border-white/25 bg-black/55 px-3 py-2 text-xs font-semibold text-white shadow-[0_14px_32px_rgba(0,0,0,0.9)] backdrop-blur-md transition hover:bg-white/10">
              Depositar
            </button>
            <button
              type="button"
              onClick={handleSpin}
              disabled={isSpinning}
              className="inline-flex flex-[1.4] items-center justify-center rounded-2xl bg-gradient-to-r from-[#f7d38a] via-[#f3c96a] to-[#8a5b13] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-black shadow-[0_20px_38px_rgba(250,204,21,0.8)] transition hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
            >
              Girar
            </button>
          </div>
        </div>
      </MobileShell>
      <PrizeModal
        open={modalOpen}
        prize={selectedPrize}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}