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
  Check,
  UserPlus,
  X,
  Wallet,
  DollarSign
} from "lucide-react";

// Adicionamos o modelId como propriedade para separar os clientes!
export function PlayersManager({ modelId }: { modelId: string | null }) {
  const [players, setPlayers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingName, setUpdatingName] = useState<string | null>(null);
  
  // Campos para inserção manual (separando Dinheiro Real de Créditos)
  const [manualReal, setManualReal] = useState<{ [key: string]: string }>({});
  const [manualCredit, setManualCredit] = useState<{ [key: string]: string }>({});

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
    if (!modelId) return;
    setLoading(true);
    try {
      // Busca apenas os jogadores DESTA modelo
      const res = await fetch(`${supabaseUrl}/rest/v1/Players?model_id=eq.${modelId}&select=*`, {
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
  }, [modelId]);

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
        // Associa o novo jogador à modelo atual
        body: JSON.stringify({ ...newPlayer, model_id: modelId }),
      });
      if (res.ok) {
        const data = await res.json();
        setPlayers([...players, data[0]]);
        setIsModalOpen(false);
        setNewPlayer({ name: "", whatsapp: "", email: "", password: "", credits: 0 });
      } else {
        alert("Erro ao criar jogador. Verifique se o nome já existe.");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetCredits = async (playerName: string) => {
    if (!playerName || !window.confirm(`Deseja ZERAR os créditos de ${playerName}?`)) return;
    setUpdatingName(playerName);
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/Players?name=eq.${playerName}&model_id=eq.${modelId}`, {
        method: "PATCH",
        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ credits: 0 }),
      });
      if (res.ok) {
        setPlayers((prev) => prev.map((p) => p.name === playerName ? { ...p, credits: 0 } : p));
      }
    } finally {
      setUpdatingName(null);
    }
  };

  // A MÁGICA FINANCEIRA DOS 70/30
  const addCreditsWithRevenue = async (playerName: string, currentCredits: number, realAmount: number, creditsToAdd: number) => {
    if (!playerName || realAmount < 0 || creditsToAdd <= 0) return;
    setUpdatingName(playerName);
    
    try {
      // 1. Adiciona os créditos na conta do jogador
      const newTotal = (Number(currentCredits) || 0) + creditsToAdd;
      await fetch(`${supabaseUrl}/rest/v1/Players?name=eq.${playerName}&model_id=eq.${modelId}`, {
        method: "PATCH",
        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ credits: newTotal }),
      });

      // 2. Calcula os 70% da modelo e atualiza o Saldo (Cofre) dela
      let modelShare = 0;
      if (realAmount > 0) {
        modelShare = realAmount * 0.70; // 70% da modelo
        
        // Pega o saldo atual dela
        const resModel = await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}&select=balance`, {
          headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` }
        });
        const dataModel = await resModel.json();
        const currentBalance = dataModel[0]?.balance || 0;

        // Soma os 70% no saldo atual
        await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}`, {
          method: "PATCH",
          headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ balance: currentBalance + modelShare }),
        });
      }

      // 3. Atualiza a tela
      setPlayers((prev) => prev.map((p) => p.name === playerName ? { ...p, credits: newTotal } : p));
      setManualReal((prev) => ({ ...prev, [playerName]: "" }));
      setManualCredit((prev) => ({ ...prev, [playerName]: "" }));

      if (modelShare > 0) {
        alert(`Sucesso! ${creditsToAdd} CR adicionados.\nR$ ${modelShare.toFixed(2)} (70%) foram creditados no saldo da modelo.`);
      }

    } catch (err) {
      alert("Erro ao processar transação.");
    } finally {
      setUpdatingName(null);
    }
  };

  const deletePlayer = async (playerName: string) => {
    if (!playerName || !window.confirm(`Excluir jogador ${playerName}?`)) return;
    setUpdatingName(playerName);
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/Players?name=eq.${playerName}&model_id=eq.${modelId}`, {
        method: "DELETE",
        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` },
      });
      if (res.ok) setPlayers((prev) => prev.filter((p) => p.name !== playerName));
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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF1493]/50" size={20} />
          <input
            placeholder="Buscar jogador desta roleta..."
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
          <Loader2 className="animate-spin text-[#FF1493] mb-4" size={32} />
          Sincronizando...
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.length === 0 && !loading && (
            <div className="text-center py-10 text-white/30 text-xs font-black uppercase">Nenhum cliente cadastrado nesta roleta ainda.</div>
          )}
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
                    <h3 className="font-black uppercase tracking-tight truncate text-white">{p.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-1.5 text-[9px] text-white/40 font-bold uppercase">
                      <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5"><MessageCircle size={12} className="text-[#FF1493]" /> {p.whatsapp}</span>
                      <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5"><Key size={12} className="text-[#FF1493]" /> {p.password}</span>
                    </div>
                  </div>
                </div>

                <button onClick={() => deletePlayer(p.name)} disabled={updatingName === p.name} className="text-white/20 hover:text-red-500 transition-colors p-2 flex flex-col items-center shrink-0 ml-4">
                  <UserMinus size={18} /><span className="text-[7px] font-bold uppercase mt-1">Excluir</span>
                </button>
              </div>

              <div className="flex flex-col items-end gap-4 w-full lg:w-auto border-t lg:border-t-0 border-white/5 pt-4 lg:pt-0">
                <div className="flex items-center gap-4 w-full justify-between lg:justify-end">
                  <div className="text-left lg:text-right">
                    <p className="text-[9px] text-white/30 uppercase font-black">Saldo Atual</p>
                    <p className="text-2xl font-black text-[#FF1493] leading-none">{p.credits || 0} <span className="text-[10px] text-white/20">CR</span></p>
                  </div>
                  <button onClick={() => resetCredits(p.name)} disabled={updatingName === p.name} className="p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 active:scale-90" title="Zerar Créditos">
                    <RotateCcw size={18} />
                  </button>
                </div>

                {/* PAINEL DE ADIÇÃO DE CRÉDITOS 70/30 */}
                <div className="flex flex-col gap-2 w-full">
                  <p className="text-[8px] text-emerald-400 font-black uppercase text-right tracking-widest">+ Inserir Créditos (Automático 70/30)</p>
                  <div className="flex flex-wrap justify-end gap-2">
                    {/* Botões Rápidos */}
                    <button onClick={() => addCreditsWithRevenue(p.name, p.credits, 10, 15)} disabled={updatingName === p.name} className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-black py-2 px-3 rounded-xl border border-emerald-500/30 transition-all active:scale-95 text-center">
                      <span className="block text-[10px] font-black uppercase">R$ 10</span><span className="block text-[8px] font-bold">+15 CR</span>
                    </button>
                    <button onClick={() => addCreditsWithRevenue(p.name, p.credits, 20, 25)} disabled={updatingName === p.name} className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-black py-2 px-3 rounded-xl border border-emerald-500/30 transition-all active:scale-95 text-center">
                      <span className="block text-[10px] font-black uppercase">R$ 20</span><span className="block text-[8px] font-bold">+25 CR</span>
                    </button>
                    <button onClick={() => addCreditsWithRevenue(p.name, p.credits, 50, 60)} disabled={updatingName === p.name} className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-black py-2 px-3 rounded-xl border border-emerald-500/30 transition-all active:scale-95 text-center">
                      <span className="block text-[10px] font-black uppercase">R$ 50</span><span className="block text-[8px] font-bold">+60 CR</span>
                    </button>

                    {/* Inserção Manual */}
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-2">
                      <div className="flex items-center border-r border-white/10 pr-2">
                        <DollarSign size={12} className="text-white/30 mr-1"/>
                        <input type="number" placeholder="R$ Pago" value={manualReal[p.name] || ""} onChange={(e) => setManualReal({ ...manualReal, [p.name]: e.target.value })} className="bg-transparent w-12 text-center text-[10px] outline-none text-emerald-400 font-bold placeholder:text-white/20"/>
                      </div>
                      <div className="flex items-center pl-2">
                        <Wallet size={12} className="text-white/30 mr-1"/>
                        <input type="number" placeholder="CR" value={manualCredit[p.name] || ""} onChange={(e) => setManualCredit({ ...manualCredit, [p.name]: e.target.value })} className="bg-transparent w-10 text-center text-[10px] outline-none text-[#FF1493] font-bold placeholder:text-white/20"/>
                      </div>
                      <button onClick={() => addCreditsWithRevenue(p.name, p.credits, Number(manualReal[p.name] || 0), Number(manualCredit[p.name] || 0))} disabled={updatingName === p.name || !manualCredit[p.name]} className="text-emerald-400 hover:text-white p-2 ml-1 transition-colors">
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

      {/* MODAL DE NOVO JOGADOR */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 relative shadow-2xl">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-white/20 hover:text-white"><X size={24} /></button>
            <h2 className="text-xl font-black uppercase tracking-tighter mb-6 text-[#FF1493]">Cadastrar Jogador VIP</h2>
            <div className="space-y-4">
              <input placeholder="APELIDO (Único)" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-[#FF1493]" value={newPlayer.name} onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}/>
              <input placeholder="WHATSAPP" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-[#FF1493]" value={newPlayer.whatsapp} onChange={(e) => setNewPlayer({ ...newPlayer, whatsapp: e.target.value })}/>
              <input placeholder="SENHA" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-[#FF1493]" value={newPlayer.password} onChange={(e) => setNewPlayer({ ...newPlayer, password: e.target.value })}/>
              <button onClick={createPlayer} className="w-full bg-[#FF1493] hover:opacity-90 text-white font-black uppercase py-4 rounded-xl mt-4 shadow-[0_0_15px_rgba(255,20,147,0.4)] transition-all">Salvar Jogador</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
