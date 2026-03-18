"use client";

import { useState, useEffect } from "react";
import {
  Search,
  User,
  MessageCircle,
  Key,
  Loader2,
  Mail,
  UserMinus,
  RotateCcw,
  Plus,
  Check,
  UserPlus,
  X,
} from "lucide-react";

export function PlayersManager() {
  const [players, setPlayers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingName, setUpdatingName] = useState<string | null>(null);
  const [manualAmount, setManualAmount] = useState<{ [key: string]: string }>(
    {}
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    name: "",
    whatsapp: "",
    email: "",
    password: "",
    credits: 0,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  async function fetchPlayers() {
    setLoading(true);
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/Players?select=*`, {
        method: "GET",
        headers: {
          apikey: supabaseKey!,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });
      const data = await res.json();
      if (Array.isArray(data)) setPlayers(data);
    } catch (error) {
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlayers();
  }, []);

  const createPlayer = async () => {
    if (!newPlayer.name || !newPlayer.password)
      return alert("Nome e Senha são obrigatórios!");
    setLoading(true);
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/Players`, {
        method: "POST",
        headers: {
          apikey: supabaseKey!,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(newPlayer),
      });
      if (res.ok) {
        const data = await res.json();
        setPlayers([...players, data[0]]);
        setIsModalOpen(false);
        setNewPlayer({
          name: "",
          whatsapp: "",
          email: "",
          password: "",
          credits: 0,
        });
      } else {
        alert("Erro ao criar jogador. Verifique se o nome já existe.");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateCredits = async (
    playerName: string,
    currentCredits: number,
    amountToAdd: number,
    isReset = false
  ) => {
    if (!playerName) return;
    setUpdatingName(playerName);
    const newTotal = isReset ? 0 : (Number(currentCredits) || 0) + amountToAdd;
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/Players?name=eq.${playerName}`,
        {
          method: "PATCH",
          headers: {
            apikey: supabaseKey!,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ credits: newTotal }),
        }
      );
      if (res.ok) {
        setPlayers((prev) =>
          prev.map((p) =>
            p.name === playerName ? { ...p, credits: newTotal } : p
          )
        );
        setManualAmount((prev) => ({ ...prev, [playerName]: "" }));
      }
    } finally {
      setUpdatingName(null);
    }
  };

  const deletePlayer = async (playerName: string) => {
    if (!playerName || !window.confirm(`Excluir jogador ${playerName}?`))
      return;
    setUpdatingName(playerName);
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/Players?name=eq.${playerName}`,
        {
          method: "DELETE",
          headers: {
            apikey: supabaseKey!,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );
      if (res.ok)
        setPlayers((prev) => prev.filter((p) => p.name !== playerName));
    } finally {
      setUpdatingName(null);
    }
  };

  const filtered = players.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.email?.toLowerCase().includes(term) ||
      p.whatsapp?.includes(term) ||
      p.name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="animate-in fade-in duration-500 text-white">
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF1493]/50"
            size={20}
          />
          <input
            placeholder="Buscar jogador..."
            className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm text-white outline-none focus:border-[#FF1493] transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#FF1493] hover:opacity-90 text-white font-black uppercase text-[10px] px-8 py-4 md:py-0 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,20,147,0.4)] transition-all active:scale-95"
        >
          <UserPlus size={18} /> Novo Jogador
        </button>
      </div>

      {loading && players.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/20 uppercase font-black text-[10px] tracking-widest">
          <Loader2 className="animate-spin text-[#FF1493] mb-4" size={32} />{" "}
          Sincronizando...
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((p, index) => (
            <div
              key={p.name || index}
              className="bg-[#121212] border border-white/5 p-6 rounded-[2.5rem] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-xl hover:border-white/10 transition-all"
            >
              <div className="flex items-start justify-between w-full lg:w-auto lg:flex-1">
                <div className="flex items-center gap-5">
                  <div className="h-14 w-14 rounded-2xl bg-[#FF1493]/10 flex items-center justify-center text-[#FF1493] shrink-0 border border-[#FF1493]/20">
                    <User size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black uppercase tracking-tight truncate text-white">
                      {p.name}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-1.5 text-[9px] text-white/40 font-bold uppercase">
                      <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                        <MessageCircle size={12} className="text-[#FF1493]" />{" "}
                        {p.whatsapp}
                      </span>
                      <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                        <Mail size={12} className="text-[#FF1493]" /> {p.email}
                      </span>
                      <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                        <Key size={12} className="text-[#FF1493]" />{" "}
                        {p.password}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => deletePlayer(p.name)}
                  disabled={updatingName === p.name}
                  className="text-white/20 hover:text-red-500 transition-colors p-2 flex flex-col items-center shrink-0 ml-4"
                >
                  <UserMinus size={18} />
                  <span className="text-[7px] font-bold uppercase mt-1">
                    Excluir
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-6 w-full lg:w-auto justify-between border-t lg:border-t-0 border-white/5 pt-4 lg:pt-0">
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[9px] text-white/30 uppercase font-black">
                      Saldo
                    </p>
                    <p className="text-2xl font-black text-[#FF1493] leading-none">
                      {p.credits || 0}{" "}
                      <span className="text-[10px] text-white/20">CR</span>
                    </p>
                  </div>
                  <button
                    onClick={() => updateCredits(p.name, p.credits, 0, true)}
                    disabled={updatingName === p.name}
                    className="p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 active:scale-90"
                    title="Zerar"
                  >
                    <RotateCcw size={18} />
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-1 items-center">
                    {[15, 60].map((val) => (
                      <button
                        key={val}
                        onClick={() => updateCredits(p.name, p.credits, val)}
                        disabled={updatingName === p.name}
                        className="bg-[#FF1493]/10 hover:bg-[#FF1493] text-[#FF1493] hover:text-white w-10 h-10 rounded-xl text-[10px] font-black border border-[#FF1493]/20 transition-all"
                      >
                        +{val}
                      </button>
                    ))}
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-2 h-10 ml-1">
                      <input
                        type="number"
                        placeholder="00"
                        value={manualAmount[p.name] || ""}
                        onChange={(e) =>
                          setManualAmount({
                            ...manualAmount,
                            [p.name]: e.target.value,
                          })
                        }
                        className="bg-transparent w-10 text-center text-[10px] outline-none text-white font-bold"
                      />
                      <button
                        onClick={() =>
                          updateCredits(
                            p.name,
                            p.credits,
                            Number(manualAmount[p.name] || 0)
                          )
                        }
                        disabled={
                          updatingName === p.name || !manualAmount[p.name]
                        }
                        className="text-[#FF1493] hover:opacity-80 p-1"
                      >
                        <Check size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 relative shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-white/20 hover:text-white"
            >
              <X size={24} />
            </button>
            <h2 className="text-xl font-black uppercase tracking-tighter mb-6 text-[#FF1493]">
              Cadastrar Jogador
            </h2>

            <div className="space-y-4">
              <input
                placeholder="NOME (Único)"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-[#FF1493]"
                value={newPlayer.name}
                onChange={(e) =>
                  setNewPlayer({ ...newPlayer, name: e.target.value })
                }
              />
              <input
                placeholder="WHATSAPP"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-[#FF1493]"
                value={newPlayer.whatsapp}
                onChange={(e) =>
                  setNewPlayer({ ...newPlayer, whatsapp: e.target.value })
                }
              />
              <input
                placeholder="EMAIL"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-[#FF1493]"
                value={newPlayer.email}
                onChange={(e) =>
                  setNewPlayer({ ...newPlayer, email: e.target.value })
                }
              />
              <input
                placeholder="SENHA"
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-[#FF1493]"
                value={newPlayer.password}
                onChange={(e) =>
                  setNewPlayer({ ...newPlayer, password: e.target.value })
                }
              />
              <input
                placeholder="SALDO INICIAL"
                type="number"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-[#FF1493]"
                value={newPlayer.credits}
                onChange={(e) =>
                  setNewPlayer({
                    ...newPlayer,
                    credits: Number(e.target.value),
                  })
                }
              />

              <button
                onClick={createPlayer}
                className="w-full bg-[#FF1493] hover:opacity-90 text-white font-black uppercase py-4 rounded-xl mt-4 shadow-[0_0_15px_rgba(255,20,147,0.4)] transition-all"
              >
                Salvar Jogador
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
