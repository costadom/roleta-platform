"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, DollarSign, Users, ShoppingCart, Trash2, MessageCircle, X } from "lucide-react";

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [abandonedCarts, setAbandonedCarts] = useState<any[]>([]);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    const isSuper = localStorage.getItem("super_admin_auth") === "true";
    if (!isSuper) { router.push("/admin/super/login"); return; }
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
      const [resModels, resTrans, resCarts, resConfigs] = await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/Models?select=*`, { headers }).then(r => r.json()),
          fetch(`${supabaseUrl}/rest/v1/Transactions?select=*&order=created_at.desc`, { headers }).then(r => r.json()),
          fetch(`${supabaseUrl}/rest/v1/AbandonedCarts?order=created_at.desc`, { headers }).then(r => r.json()),
          fetch(`${supabaseUrl}/rest/v1/Configs?select=model_id,model_name`, { headers }).then(r => r.json())
      ]);

      // Mapeia nomes das modelos para as transações
      const mappedTrans = resTrans.map((t: any) => {
          const cfg = resConfigs.find((c: any) => c.model_id === t.model_id);
          return { ...t, modelName: cfg?.model_name || 'Musa' };
      });

      // Mapeia ganhos por modelo
      const mappedModels = resModels.map((m: any) => {
          const cfg = resConfigs.find((c: any) => c.model_id === m.id);
          const modelEarnings = mappedTrans.filter((t: any) => t.model_id === m.id)
                                           .reduce((acc: number, curr: any) => acc + (Number(curr.model_cut) || 0), 0);
          return { ...m, modelName: cfg?.model_name || m.slug, totalEarnings: modelEarnings };
      });

      setTransactions(mappedTrans);
      setModels(mappedModels);
      setAbandonedCarts(resCarts || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  const handleIgnoreCart = async (id: string) => {
      try {
          const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };
          await fetch(`${supabaseUrl}/rest/v1/AbandonedCarts?id=eq.${id}`, {
              method: 'PATCH', headers, body: JSON.stringify({ status: 'ignorado' })
          });
          loadData();
      } catch (e) { alert("Erro ao ocultar."); }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-[#FF1493]" size={50} /></div>;

  const totalProfit = transactions.reduce((acc, curr) => acc + (Number(curr.platform_cut) || 0), 0);
  const pendingCarts = abandonedCarts.filter(c => c.status === 'pendente');

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans p-6 lg:p-12 pb-32">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER IDENTIDADE ORIGINAL */}
        <header className="flex justify-between items-start mb-12">
            <div>
                <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">SAVANAH <span className="text-[#FF1493]">LABZ</span></h1>
                <p className="text-[9px] text-white/20 uppercase font-black tracking-[0.4em]">SISTEMA V.3001 MASTER</p>
            </div>
            <button onClick={() => { localStorage.removeItem("super_admin_auth"); router.push('/admin'); }} className="p-3 bg-white/5 rounded-full hover:bg-red-500/20 transition-all text-white/20 hover:text-white"><X size={20}/></button>
        </header>

        {/* 1. SEÇÃO DE PIX ABANDONADOS (CARD VERMELHO ORIGINAL) */}
        {pendingCarts.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-[2.5rem] p-8 mb-10 animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-red-500">{pendingCarts.length} PIX ABANDONADOS NO MOMENTO</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingCarts.map((cart) => (
                        <div key={cart.id} className="bg-black/40 border border-white/5 p-6 rounded-3xl relative group">
                            <button onClick={() => handleIgnoreCart(cart.id)} className="absolute top-4 right-4 text-white/10 hover:text-red-500 transition-colors"><X size={16}/></button>
                            <p className="text-sm font-black uppercase mb-1">{cart.player_name || "CLIENTE VIP"}</p>
                            <p className="text-[10px] text-white/40 font-bold uppercase mb-4">TENTOU COMPRAR R$ {Number(cart.amount).toFixed(2)}</p>
                            <p className="text-[8px] text-[#FF1493] font-black uppercase tracking-widest mb-4">NA ROLETA: {cart.model_name}</p>
                            <button onClick={() => window.open(`https://wa.me/${cart.player_phone}?text=${encodeURIComponent(`Oii! Vi que você tentou comprar um conteúdo da ${cart.model_name} mas o PIX não concluiu. Posso te ajudar?`)}`, '_blank')} className="w-full bg-[#00D97E] text-black py-3 rounded-xl font-black uppercase text-[9px] flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
                                <MessageCircle size={14} fill="currentColor"/> CHAMAR NO ZAP
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* 2. STATS ORIGINAIS (CARDS LARGOS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-[#1a0a0f] border border-[#FF1493]/20 p-10 rounded-[2.5rem] shadow-2xl">
                <p className="text-[9px] font-black uppercase text-[#FF1493] tracking-widest mb-2">FATURAMENTO BRUTO</p>
                <h3 className="text-4xl font-black tracking-tighter">R$ {(totalProfit / 0.3).toFixed(2)}</h3>
            </div>
            <div className="bg-[#0a1a12] border border-[#00D97E]/20 p-10 rounded-[2.5rem] shadow-2xl">
                <p className="text-[9px] font-black uppercase text-[#00D97E] tracking-widest mb-2">LUCRO PLATAFORMA (30%)</p>
                <h3 className="text-4xl font-black tracking-tighter">R$ {totalProfit.toFixed(2)}</h3>
            </div>
            <div className="bg-[#0a0f1a] border border-blue-500/20 p-10 rounded-[2.5rem] shadow-2xl">
                <p className="text-[9px] font-black uppercase text-blue-400 tracking-widest mb-2">TOTAL JOGADORES</p>
                <h3 className="text-4xl font-black tracking-tighter">{models.length * 2 + 10}</h3> {/* Exemplo de soma */}
            </div>
        </div>

        {/* 3. UNIDADES PARCEIRAS (GRID ORIGINAL) */}
        <div>
            <h2 className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em] mb-8 flex items-center gap-4">
                <Users size={14}/> UNIDADES PARCEIRAS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {models.map((m) => (
                    <div key={m.id} className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] hover:border-[#FF1493]/30 transition-all group">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#FF1493] to-[#7928CA] p-[2px]">
                                <div className="w-full h-full rounded-full bg-black flex items-center justify-center font-black text-xs uppercase italic">{m.slug.substring(0,2)}</div>
                            </div>
                            <div>
                                <h4 className="text-sm font-black uppercase italic tracking-tighter">{m.modelName}</h4>
                                <p className="text-[9px] font-bold text-[#00D97E] uppercase">GANHOS: R$ {m.totalEarnings.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => router.push(`/admin/dashboard?model=${m.id}&slug=${m.slug}`)} className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl text-[8px] font-black uppercase transition-all">Painel</button>
                            <button onClick={() => window.open(`https://wa.me/${m.whatsapp}`, '_blank')} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/40"><MessageCircle size={14}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* 4. EXTRATO DE TRANSAÇÕES (ESTILO ORIGINAL) */}
        <div className="mt-20">
            <h2 className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em] mb-8 flex items-center gap-4">
                <DollarSign size={14}/> EXTRATO DA PLATAFORMA
            </h2>
            <div className="grid gap-4">
                {transactions.slice(0, 10).map((t) => (
                    <div key={t.id} className="bg-black border border-white/5 p-6 rounded-[1.5rem] flex items-center justify-between">
                        <div>
                            <p className="text-[9px] text-[#00D97E] font-black uppercase">ENTRADA PIX: R$ {Number(t.real_amount).toFixed(2)}</p>
                            <p className="text-xs font-black uppercase mt-1">MUSA: {t.modelName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] text-white/20 font-black uppercase">LUCRO LABZ</p>
                            <p className="text-sm font-black text-[#00D97E]">+ R$ {Number(t.platform_cut).toFixed(2)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
}
