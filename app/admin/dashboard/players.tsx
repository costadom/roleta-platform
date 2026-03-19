"use client";

import { useEffect, useState } from "react";
import { User, Wallet } from "lucide-react";

export default function PlayersManager({ modelId, isSuperAdmin }: { modelId: string | null; isSuperAdmin: boolean }) {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const loadPlayers = async () => {
    if (!modelId) return;
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/Players?model_id=eq.${modelId}&order=created_at.desc`, {
        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-cache" }
      });
      const data = await res.json();
      setPlayers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, [modelId]);

  const handleAddCredits = async (playerId: string, currentCredits: number) => {
    if (!isSuperAdmin) return alert("Apenas o Administrador Master pode adicionar créditos manualmente.");
    
    const amount = prompt(`Quantos créditos deseja ADICIONAR ao saldo atual (${currentCredits})?`);
    if (!amount || isNaN(Number(amount))) return;
    
    const newCredits = currentCredits + Number(amount);
    
    try {
      await fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${playerId}`, {
        method: "PATCH",
        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ credits: newCredits })
      });
      loadPlayers();
    } catch (err) {
      alert("Erro ao adicionar créditos.");
    }
  };

  if (loading) return <div className="text-center py-10 text-white/50 animate-pulse text-[10px] font-black uppercase tracking-widest">Buscando Clientes...</div>;

  return (
    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xs font-black uppercase text-white/50 tracking-widest flex items-center gap-2"><User size={16}/> Carteira de Clientes</h2>
      </div>

      <div className="grid gap-3">
        {players.length === 0 ? (
          <p className="text-[10px] text-white/30 italic text-center py-6">Nenhum jogador cadastrado via PIX ainda.</p>
        ) : (
          players.map(p => (
            <div key={p.id} className="bg-black/40 border border-white/5 p-5 rounded-2xl flex items-center justify-between hover:border-[#FF1493]/30 transition-all">
              <div>
                <h3 className="text-xs font-black uppercase text-white flex items-center gap-2">{p.name}</h3>
                <p className="text-[9px] font-mono text-white/30 mt-1">{p.whatsapp}</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[8px] font-black uppercase text-white/30 block mb-0.5">Saldo</span>
                  <span className="text-sm font-black text-[#FFD700]">{p.credits} CR</span>
                </div>
                
                {isSuperAdmin && (
                  <button onClick={() => handleAddCredits(p.id, p.credits)} className="h-10 w-10 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] rounded-xl flex items-center justify-center hover:bg-[#FFD700] hover:text-black transition-all" title="Adicionar Créditos">
                    <Wallet size={16}/>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
