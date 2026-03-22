"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { User, Plus, Search, ArrowLeft, Coins, Loader2, ShieldCheck } from "lucide-react";

export default function SuperAdminModelPlayers() {
  const params = useParams();
  const router = useRouter();
  const modelId = params.id;

  const [players, setPlayers] = useState<any[]>([]);
  const [modelName, setModelName] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState<number>(20);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    if (modelId) {
      fetchModelData();
      fetchPlayers();
    }
  }, [modelId]);

  async function fetchModelData() {
    try {
      const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
      const res = await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}&select=slug`, { headers });
      const data = await res.json();
      if (data?.[0]) setModelName(data[0].slug.toUpperCase());
    } catch (e) {}
  }

  async function fetchPlayers() {
    try {
      const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
      // Busca jogadores associados, trazendo Nome Completo, Nickname, WhatsApp e Créditos
      const res = await fetch(`${supabaseUrl}/rest/v1/Players?model_id=eq.${modelId}&select=id,full_name,nickname,whatsapp,credits`, { headers });
      const data = await res.json();
      
      // Organiza por Nome Completo alfabeticamente (A-Z)
      const sortedData = (data || []).sort((a: any, b: any) => {
        const nameA = (a.full_name || "Z").toUpperCase(); // Trata nulos colocando no fim
        const nameB = (b.full_name || "Z").toUpperCase();
        return nameA.localeCompare(nameB);
      });

      setPlayers(sortedData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleAddCredits = async (playerId: string, currentCredits: number) => {
    setUpdatingId(playerId);
    try {
      const headers = { 
        apikey: supabaseKey!, 
        Authorization: `Bearer ${supabaseKey}`, 
        "Content-Type": "application/json",
        "Prefer": "return=representation" 
      };
      
      const newTotal = Number(currentCredits) + Number(addAmount);

      const res = await fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${playerId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ credits: newTotal })
      });

      if (res.ok) {
        setPlayers(players.map(p => p.id === playerId ? { ...p, credits: newTotal } : p));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredPlayers = players.filter(p => 
    (p.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.nickname || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.whatsapp.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        
        <button onClick={() => router.back()} className="mb-8 flex items-center gap-2 text-white/40 hover:text-white transition-all uppercase text-[10px] font-black">
          <ArrowLeft size={16} /> Voltar
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 border-b border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="text-[#D946EF]" size={16} />
              <span className="text-[10px] font-black uppercase text-[#D946EF] tracking-widest">Painel Super Admin</span>
            </div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter">Carteira de Clientes: <span className="text-white">{modelName}</span></h1>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar Nome, Nick ou Whats..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#0a0a0a] border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm w-full md:w-80 focus:border-[#D946EF] outline-none"
            />
          </div>
        </div>

        {/* Ferramenta de Adição Rápida de Créditos */}
        <div className="bg-[#0a0a0a] border border-[#D946EF]/20 rounded-[2rem] p-6 mb-8 flex flex-col sm:flex-row items-center gap-6 shadow-[0_0_30px_rgba(217,70,239,0.1)]">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#D946EF]/10 rounded-full flex items-center justify-center text-[#D946EF] border border-[#D946EF]/20"><Coins size={24}/></div>
              <div>
                <span className="text-[11px] font-black uppercase text-white/80">Ferramenta de Bônus</span>
                <p className="text-white/40 text-[9px] uppercase font-bold">Defina o valor e clique no "+" do cliente</p>
              </div>
           </div>
           <div className="flex-1 flex gap-2 justify-center sm:justify-end w-full">
              {[20, 50, 100].map(val => (
                <button key={val} onClick={() => setAddAmount(val)} className={`px-5 py-3 rounded-xl text-xs font-black transition-all ${addAmount === val ? 'bg-[#D946EF] text-white shadow-lg' : 'bg-white/5 text-white/40'}`}>+{val} CR</button>
              ))}
              <input type="number" value={addAmount} onChange={(e) => setAddAmount(Number(e.target.value))} className="w-24 bg-black border border-white/10 rounded-xl px-4 text-sm font-black text-[#D946EF] outline-none text-center" placeholder="Outro"/>
           </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#D946EF]" size={40} /></div>
        ) : (
          <div className="grid gap-4">
            {filteredPlayers.length === 0 ? (
              <p className="text-center py-20 text-white/20 uppercase font-black tracking-widest border border-dashed border-white/10 rounded-[2rem]">Nenhum cliente associado ou encontrado.</p>
            ) : filteredPlayers.map((player) => (
              <div key={player.id} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 hover:border-[#D946EF]/30 transition-all group">
                <div className="flex items-center gap-5 flex-1 w-full">
                  <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-[#D946EF] border border-white/5 shrink-0">
                    <User size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* SUPER ADMIN VÊ O NOME COMPLETO */}
                    <h3 className="font-black text-white uppercase text-base tracking-tight truncate">{player.full_name || "NOME NÃO PREENCHIDO"}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      <p className="text-[10px] text-white/40 font-bold uppercase">Whats: <span className="text-white/70">{player.whatsapp}</span></p>
                      <p className="text-[10px] text-[#D946EF] font-bold uppercase">Nick: <span className="text-[#D946EF]/70">{player.nickname || "Sem Nick"}</span></p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-none border-white/5 pt-4 md:pt-0">
                  <div className="text-center">
                    <span className="block text-[9px] text-white/40 font-black uppercase mb-1 tracking-widest">Saldo na Musa</span>
                    <span className="text-2xl font-black text-[#FFD700] italic tracking-tighter">{player.credits} <span className="text-[10px] not-italic opacity-50 text-white">CR</span></span>
                  </div>

                  <button 
                    onClick={() => handleAddCredits(player.id, player.credits)}
                    disabled={updatingId === player.id}
                    className="flex items-center gap-2.5 bg-white text-black px-7 py-4 rounded-2xl text-xs font-black uppercase hover:bg-[#D946EF] hover:text-white transition-all shadow-xl disabled:opacity-50 active:scale-95"
                  >
                    {updatingId === player.id ? <Loader2 className="animate-spin" size={16}/> : <Plus size={16}/>}
                    Adicionar {addAmount} CR
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
