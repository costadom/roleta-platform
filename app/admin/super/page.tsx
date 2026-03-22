"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, DollarSign, Users, ShoppingCart, CheckCircle, XCircle, TrendingUp, AlertTriangle } from "lucide-react";

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [abandonedCarts, setAbandonedCarts] = useState<any[]>([]);
  
  const [stats, setStats] = useState({
      totalPlatformCut: 0,
      totalTransactions: 0,
      activeModels: 0,
      abandonedTotal: 0
  });

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
      
      const [resModels, resTrans, resCarts] = await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/Models?select=*,Configs(model_name)`, { headers }),
          fetch(`${supabaseUrl}/rest/v1/Transactions?select=*,Models(Configs(model_name))&order=created_at.desc`, { headers }),
          fetch(`${supabaseUrl}/rest/v1/AbandonedCarts?order=created_at.desc&limit=50`, { headers })
      ]);

      const mData = await resModels.json();
      const tData = await resTrans.json();
      const cData = await resCarts.json();

      setModels(Array.isArray(mData) ? mData : []);
      
      const mappedTrans = Array.isArray(tData) ? tData.map((t:any) => ({
          ...t, 
          modelName: Array.isArray(t.Models?.Configs) ? t.Models.Configs[0]?.model_name : t.Models?.Configs?.model_name || 'Musa'
      })) : [];
      setTransactions(mappedTrans);

      setAbandonedCarts(Array.isArray(cData) ? cData : []);

      // Calcula Stats
      setStats({
          totalPlatformCut: mappedTrans.reduce((acc, curr) => acc + (Number(curr.platform_cut) || 0), 0),
          totalTransactions: mappedTrans.length,
          activeModels: mData.length,
          abandonedTotal: cData.filter((c:any) => c.status === 'pendente').reduce((acc:any, curr:any) => acc + (Number(curr.amount) || 0), 0)
      });

    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  // CORREÇÃO: O BOTÃO X AGORA FUNCIONA
  const handleIgnoreCart = async (id: string) => {
      try {
          const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };
          await fetch(`${supabaseUrl}/rest/v1/AbandonedCarts?id=eq.${id}`, {
              method: 'PATCH', headers, body: JSON.stringify({ status: 'ignorado' })
          });
          loadData();
      } catch (e) { alert("Erro ao ignorar carrinho."); }
  };

  if (loading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white"><Loader2 className="animate-spin text-[#FF1493] mb-6" size={50} /></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans p-6 pb-24">
      <div className="max-w-7xl mx-auto">
        
        <header className="flex justify-between items-center mb-10">
            <div>
                <h1 className="text-2xl font-black uppercase text-[#FF1493] italic tracking-tighter">Super Admin <span className="text-white">Master</span></h1>
            </div>
            <button onClick={() => { localStorage.removeItem("super_admin_auth"); router.push('/admin'); }} className="text-[10px] font-black uppercase text-white/50 hover:text-white transition-all">Sair</button>
        </header>

        {/* ESTATÍSTICAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-[#0a0a0a] border border-emerald-500/20 p-6 rounded-3xl shadow-xl">
                <div className="flex items-center gap-3 text-emerald-500 mb-2"><TrendingUp size={20}/><h3 className="text-[10px] font-black uppercase">Lucro Líquido Plataforma</h3></div>
                <p className="text-3xl font-black tracking-tighter">R$ {stats.totalPlatformCut.toFixed(2)}</p>
            </div>
            <div className="bg-[#0a0a0a] border border-[#D946EF]/20 p-6 rounded-3xl shadow-xl">
                <div className="flex items-center gap-3 text-[#D946EF] mb-2"><Users size={20}/><h3 className="text-[10px] font-black uppercase">Modelos Ativas</h3></div>
                <p className="text-3xl font-black tracking-tighter">{stats.activeModels}</p>
            </div>
            <div className="bg-[#0a0a0a] border border-blue-500/20 p-6 rounded-3xl shadow-xl">
                <div className="flex items-center gap-3 text-blue-500 mb-2"><ShoppingCart size={20}/><h3 className="text-[10px] font-black uppercase">Vendas Totais</h3></div>
                <p className="text-3xl font-black tracking-tighter">{stats.totalTransactions}</p>
            </div>
            <div className="bg-[#0a0a0a] border border-amber-500/20 p-6 rounded-3xl shadow-xl">
                <div className="flex items-center gap-3 text-amber-500 mb-2"><AlertTriangle size={20}/><h3 className="text-[10px] font-black uppercase">Potencial a Recuperar</h3></div>
                <p className="text-3xl font-black tracking-tighter">R$ {stats.abandonedTotal.toFixed(2)}</p>
            </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
            
            {/* CARRINHOS ABANDONADOS - Agora pega vídeos e fotos também */}
            <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2.5rem] shadow-xl overflow-hidden">
                <h2 className="text-lg font-black uppercase text-white/50 mb-6 flex items-center gap-2"><ShoppingCart size={18}/> Recuperação de Vendas</h2>
                <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                    {abandonedCarts.filter(c => c.status === 'pendente').map((cart) => (
                        <div key={cart.id} className="bg-black border border-amber-500/20 p-5 rounded-2xl flex items-center justify-between group hover:border-amber-500/50 transition-all">
                            <div>
                                <p className="text-xs font-black uppercase text-white mb-1">{cart.player_phone || cart.player_name}</p>
                                <p className="text-[9px] text-white/40 uppercase font-bold">{cart.model_name}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-[8px] text-white/30 uppercase font-black">Valor</p>
                                    <p className="text-sm font-black text-amber-500">R$ {Number(cart.amount).toFixed(2)}</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => window.open(`https://wa.me/${cart.player_phone}?text=${encodeURIComponent(`Oii! Vi que você tentou comprar um conteúdo da ${cart.model_name} mas o PIX não concluiu. Posso te ajudar?`)}`, '_blank')} className="bg-amber-500 text-black px-3 py-1.5 rounded-lg text-[9px] font-black uppercase hover:bg-amber-400">Chamar</button>
                                    {/* CORREÇÃO DO BOTÃO X */}
                                    <button onClick={() => handleIgnoreCart(cart.id)} className="bg-white/5 text-white/30 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase hover:bg-red-500 hover:text-white transition-all">Ignorar</button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {abandonedCarts.filter(c => c.status === 'pendente').length === 0 && <div className="text-center text-white/20 text-xs italic py-10">Nenhum carrinho pendente.</div>}
                </div>
            </div>

            {/* TRANSAÇÕES RECENTES - Protegido contra objetos React */}
            <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2.5rem] shadow-xl overflow-hidden">
                <h2 className="text-lg font-black uppercase text-white/50 mb-6 flex items-center gap-2"><DollarSign size={18}/> Extrato da Plataforma</h2>
                <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                    {transactions.map((t) => (
                        <div key={t.id} className="bg-black border border-white/5 p-5 rounded-2xl flex items-center justify-between">
                            <div>
                                <p className="text-[10px] text-emerald-500 font-black uppercase mb-1">Entrada PIX: R$ {Number(t.real_amount).toFixed(2)}</p>
                                <p className="text-xs text-white uppercase font-bold truncate max-w-[150px]">Musa: {t.modelName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] text-white/30 uppercase font-black">Lucro Labz</p>
                                <p className="text-sm font-black text-emerald-400">+ R$ {Number(t.platform_cut).toFixed(2)}</p>
                            </div>
                        </div>
                    ))}
                    {transactions.length === 0 && <div className="text-center text-white/20 text-xs italic py-10">Nenhuma transação ainda.</div>}
                </div>
            </div>

        </div>
      </div>
      <style jsx global>{` .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }`}</style>
    </div>
  );
}
