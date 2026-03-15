export type PrizeType =
  | "free_spin"
  | "coupon"
  | "video"
  | "content"
  | "balance"
  | "rare";

export type Prize = {
  id: number;
  name: string;
  weight: number;
  color: string;
  shortLabel: string;
  type: PrizeType;
};

export const PRIZES: Prize[] = [
  {
    id: 1,
    name: "Rodada grátis",
    weight: 500,
    color: "#f59e0b",
    shortLabel: "Grátis",
    type: "free_spin",
  },
  {
    id: 2,
    name: "Cupom especial",
    weight: 180,
    color: "#ef4444",
    shortLabel: "Cupom",
    type: "coupon",
  },
  {
    id: 3,
    name: "Vídeo exclusivo",
    weight: 120,
    color: "#8b5cf6",
    shortLabel: "Vídeo",
    type: "video",
  },
  {
    id: 4,
    name: "Conteúdo premium",
    weight: 70,
    color: "#ec4899",
    shortLabel: "Premium",
    type: "content",
  },
  {
    id: 5,
    name: "Bônus de saldo",
    weight: 30,
    color: "#10b981",
    shortLabel: "Saldo",
    type: "balance",
  },
  {
    id: 6,
    name: "Prêmio raro",
    weight: 1,
    color: "#06b6d4",
    shortLabel: "Raro",
    type: "rare",
  },
];

