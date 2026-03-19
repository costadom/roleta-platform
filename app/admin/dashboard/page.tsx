"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Image as ImageIcon, Check, Gift, DollarSign, Users, Link as LinkIcon, Edit3, ArrowLeft, Palette, Copy, LogOut, Megaphone, Trophy, Crown, Loader2, Wallet, Calendar, CheckCircle2, Bell } from "lucide-react";
import { PlayersManager } from "./players";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modelId = searchParams.get("model");
  const modelSlug = searchParams.get("slug");

  const [isMounted, setIsMounted] = useState(false);
  const [modelUrl, setModelUrl] = useState("");
  const [isSuper, setIsSuper] = useState(false);

  const [globalAnnouncement, setGlobalAnnouncement] = useState("");
  const [showRankTab, setShowRankTab] = useState(false); 
  const [metaValue, setMetaValue] = useState(0);
  const [metaPrize, setMetaPrize] = useState("");

  const [activeTab, setActiveTab] = useState<"finance" | "prizes" | "players" | "history" | "ranking">("finance");
  const [prizes, setPrizes] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [allModels, setAllModels] = useState<any[]>([]);
  const [playersCount, setPlayersCount] = useState(0);
  const [editingPrize, setEditingPrize] = useState<any | null>(null);

  // Finanças & Notificações
  const [modelBalance, setModelBalance] = useState<number>(0);
  const [lastWithdrawal, setLastWithdrawal] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [accumulatedEarnings, setAccumulatedEarnings] = useState<number>(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Chaves PIX
  const [pixKey1, setPixKey1] = useState("");
  const [pixKey2, setPixKey2] = useState("");
  const [savingPix, setSavingPix] = useState(false);

  const [currentBg, setCurrentBg] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [modelName, setModelName] = useState("");
  const [spinCost, setSpinCost] = useState<number>(2);
  const [savingSettings, setSavingSettings] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    setIsMounted(true);
    setIsSuper(localStorage.getItem("super_admin_auth") === "true");
    if (modelSlug) setModelUrl(`${window.location.origin}/game/${modelSlug}`);
  }, [modelSlug]);

  const loadData = async () => {
    if (!modelId) return;
    try {
      const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-cache", "Pragma": "no-cache" };
      
      const resGlob = await fetch(`${supabaseUrl}/rest/v1/GlobalSettings?id=eq.main&select=*`, { headers, cache: 'no-store' });
      const dataGlob = await resGlob.json();
      if (Array.isArray(dataGlob) && dataGlob[0]) {
        setGlobalAnnouncement(dataGlob[0].announcement_msg);
        setShowRankTab(dataGlob[0].ranking_visible === true || dataGlob[0].ranking_visible === "true");
        setMetaValue(dataGlob[0].goal_amount);
        setMetaPrize(dataGlob[0].goal_reward);
      }

      const resModel = await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}&select=balance,last_withdrawal,pix_key_1,pix_key_2`, { headers, cache: 'no-store' });
      const dataModel = await resModel.json();
      if (dataModel && dataModel[0]) {
        setModelBalance(dataModel[0].balance || 0);
        setLastWithdrawal(dataModel[0].last_withdrawal);
        setPixKey1(dataModel[0].pix_key_1 || "");
        setPixKey2(dataModel[0].pix_key_2 || "");
      }

      const resNotif = await fetch(`${supabaseUrl}/rest/v1/Withdrawals?model_id=eq.${modelId}&status=eq.pago&is_read=eq.false`, { headers, cache: 'no-store' });
      const dataNotif = await resNotif.json();
      if (Array.isArray(dataNotif)) setNotifications(dataNotif);

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const resTrans = await fetch(`${supabaseUrl}/rest/v1/Transactions?model_id=eq.${modelId}&created_at=gte.${sixMonthsAgo.toISOString()}&select=model_cut`, { headers, cache: 'no-store' });
      const dataTrans = await resTrans.json();
      if (Array.isArray(dataTrans)) {
        const total = dataTrans.reduce((acc, curr) => acc + (Number(curr.model_cut) || 0), 0);
        setAccumulatedEarnings(total);
      }
      
      const resPrizes = await fetch(`${supabaseUrl}/rest/v1/Prize?model_id=eq.${modelId}&select=*`, { headers, cache: 'no-store' });
      const dataPrizes = await resPrizes.json();
      if (Array.isArray(dataPrizes)) setPrizes(dataPrizes.sort((a: any, b: any) => b.weight - a.weight));
      
      const resConfig = await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}&select=*`, { headers, cache: 'no-store' });
      const dataConfig = await resConfig.json();
      if (Array.isArray(dataConfig) && dataConfig[0]) { setCurrentBg(dataConfig[0].bg_url); setModelName(dataConfig[0].model_name || ""); setSpinCost(dataConfig[0].spin_cost || 2); }
      
      const resHistory = await fetch(`${supabaseUrl}/rest/v1/SpinHistory?select=*&order=created_at.desc`, { headers, cache: 'no-store' });
      const dataHistory = await resHistory.json();
      if (Array.isArray(dataHistory)) setHistory(dataHistory);
      
      const resAllMod = await fetch(`${supabaseUrl}/rest/v1/Models?select=id,slug`, { headers, cache: 'no-store' });
      const allModData = await resAllMod.json();
      setAllModels(Array.isArray(allModData) ? allModData : []);
      
      const resPlayers = await fetch(`${supabaseUrl}/rest/v1/Players?model_id=eq.${modelId}&select=id`, { headers, cache: 'no-store' });
      const dataPlayers = await resPlayers.json();
      if (Array.isArray(dataPlayers)) setPlayersCount(dataPlayers.length);
    } catch (err) { console.error("Erro na leitura:", err); }
  };

  useEffect(() => { loadData(); }, [modelId]);

  const totalChance = useMemo(() => prizes.reduce((acc, p) => acc + (Number(p.weight) || 0), 0), [prizes]);
  
  const modelRanking = useMemo(() => {
    if (!Array.isArray(allModels)) return [];
    const counts: any = {};
    if (Array.isArray(history)) {
      history.forEach(h => { counts[h.model_id] = (counts[h.model_id] || 0) + 1; });
    }
    return allModels.map(m => ({ ...m, score: counts[m.id] || 0 })).sort((a, b) => b.score - a.score);
  }, [allModels, history]);

  const handleLogout = () => { localStorage.clear(); router.push('/admin'); };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model_name: modelName, spin_cost: spinCost }) });
    setSavingSettings(false); alert("Painel Atualizado!");
  };

  const handleSavePix = async () => {
    setSavingPix(true);
    await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ pix_key_1: pixKey1, pix_key_2: pixKey2 }) });
    setSavingPix(false); alert("Chaves PIX salvas com sucesso!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert("Máximo 2MB!");
    setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSaveImage = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const fileName = `bg_${modelId}_${Date.now()}.jpeg`;
    await fetch(`${supabaseUrl}/storage/v1/object/assets/${fileName}`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "image/jpeg" }, body: selectedFile });
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/assets/${fileName}?t=${Date.now()}`;
    await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ bg_url: publicUrl }) });
    setCurrentBg(publicUrl); setSelectedFile(null); setPreviewUrl(null); setUploading(false); alert("Fundo Atualizado!");
  };

  const handleSaveEditPrize = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${supabaseUrl}/rest/v1/Prize?id=eq.${editingPrize.id}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ name: editingPrize.name, shortLabel: editingPrize.name, weight: Number(editingPrize.weight), color: editingPrize.color, updatedAt: new Date().toISOString() }) });
    setEditingPrize(null); loadData();
  };

  const handleWithdraw = async () => {
    if (modelBalance <= 0) return alert("Você não possui saldo disponível para saque no momento.");
    if (!pixKey1) return alert("Por favor, cadastre pelo menos a sua Chave PIX Principal na aba 'Financeiro' antes de solicitar o saque.");
    if (lastWithdrawal) {
      const lastDate = new Date(lastWithdrawal).toDateString();
      const today = new Date().toDateString();
      if (lastDate === today) return alert("Limite atingido! Você só pode solicitar 1 saque por dia.");
    }
    const confirm = window.confirm(`Deseja solicitar o saque de ${modelBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}? O valor será enviado via PIX em até 1 hora.`);
    if (!confirm) return;

    setIsWithdrawing(true);
    try {
      const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" };
      const now = new Date().toISOString();

      await fetch(`${supabaseUrl}/rest/v1/Withdrawals`, {
        method: "POST", headers,
        body: JSON.stringify({ model_id: modelId, amount: modelBalance })
      });

      await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}`, {
        method: "PATCH", headers,
        body: JSON.stringify({ balance: 0, last_withdrawal: now })
      });

      setModelBalance(0);
      setLastWithdrawal(now);
      alert("Saque solicitado com sucesso! A plataforma enviará o PIX em até 1 hora.");
    } catch (err) { alert("Erro ao solicitar saque. Tente novamente."); } finally { setIsWithdrawing(false); }
  };

  const markAsRead = async (notifId: string) => {
    try {
      await fetch(`${supabaseUrl}/rest/v1/Withdrawals?id=eq.${notifId}`, { 
        method: "PATCH", 
        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, 
        body: JSON.stringify({ is_read: true }) 
      });
      setNotifications(prev => prev.filter(n => n.id !== notifId));
    } catch (err) { console.error(err); }
  };

  if (!modelId) return <div className="min-h-screen bg-black flex items-center justify-center text-white uppercase font-black">Carregando...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          {isSuper ? (
            <button onClick={() => router.push('/admin/super')} className="flex items-center gap-2 text-[10px] font-black uppercase text-white/30 hover:text-white bg-white/5 px-4 py-2 rounded-xl transition-all"><ArrowLeft size={14}/> Voltar Master</button>
          ) : (
            <button onClick={handleLogout} className="flex items-center gap-2 text-[10px] font-black uppercase text-red-500/50 hover:text-red-500 bg-red-500/5 px-4 py-2 rounded-xl transition-all"><LogOut size={14}/> Sair</button>
          )}
          <div className="text-right">
            <h1 className="text-2xl font-black uppercase tracking-tighter text-[#FF1493]">Painel VIP</h1>
            <p className="text-[#FFD700] text-[9px] font-bold uppercase tracking-[0.2em]">{modelName || "Modelo"}</p>
          </div>
        </div>

        {notifications.map(notif => (
          <div key={notif.id} className="mb-6 bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_25px_rgba(16,185,129,0.15)] animate-in zoom-in duration-300">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-emerald-500 text-black rounded-xl flex items-center justify-center shrink-0 shadow-lg"><CheckCircle2 size={24}/></div>
              <div>
                <p className="text-[12px] font-black uppercase text-emerald-500 tracking-widest flex items-center gap-2"><Bell size={14} className="animate-pulse"/> Pagamento Concluído!</p>
                <p className="text-[10px] font-bold text-white/50 uppercase mt-1">Seu saque de <strong className="text-white">R$ {Number(notif.amount).toFixed(2)}</strong> já foi enviado via PIX.</p>
              </div>
            </div>
            <button onClick={() => markAsRead(notif.id)} className="w-full sm:w-auto bg-white/5 hover:bg-emerald-500 hover:text-black text-white/50 px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all">OK, ENTENDI</button>
          </div>
        ))}

        {globalAnnouncement && (
          <div className="mb-6 bg-[#FF1493]/10 border border-[#FF1493]/20 p-4 rounded-2xl flex items-center gap-4">
            <div className="h-10 w-10 bg-[#FF1493] text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-[#FF1493]/20"><Megaphone size={20}/></div>
            <p className="text-[11px] font-black uppercase text-[#FF1493] leading-relaxed">{globalAnnouncement}</p>
          </div>
        )}

        <div className="mb-8 bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
          <div className="flex items-center gap-4"><div className="p-3 bg-[#FFD700] text-black rounded-2xl shadow-lg"><LinkIcon size={20}/></div><div><p className="text-[9px] font-black uppercase text-white/40 tracking-widest">Link de Divulgação</p><p className="text-sm font-bold text-white lowercase tracking-tight">{isMounted ? modelUrl : "..."}</p></div></div>
          <button onClick={() => { navigator.clipboard.writeText(modelUrl); alert("Copiado!"); }} className="w-full sm:w-auto px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase hover:bg-[#FFD700] hover:text-black transition-all">Copiar Link</button>
        </div>

        <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-2xl border border-white/5 overflow-x-auto">
          <button onClick={() => setActiveTab("finance")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "finance" ? "bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10 border border-emerald-500/30" : "text-white/30"}`}><Wallet size={12} className="inline mr-1" /> Financeiro</button>
          <button onClick={() => setActiveTab("prizes")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "prizes" ? "bg-white/10 text-[#FF1493]" : "text-white/30"}`}>Roleta</button>
          <button onClick={() => setActiveTab("players")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "players" ? "bg-white/10 text-[#FF1493]" : "text-white/30"}`}>Jogadores</button>
          <button onClick={() => setActiveTab("history")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "history" ? "bg-white/10 text-[#FF1493]" : "text-white/30"}`}>Entregas</button>
          
          {showRankTab && (
            <button onClick={() => setActiveTab("ranking")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "ranking" ? "bg-[#FFD700]/20 text-[#FFD700] shadow-lg shadow-[#FFD700]/10 border border-[#FFD700]/30" : "text-white/30"}`}><Trophy size={12} className="inline mr-1" /> Desafios</button>
          )}
        </div>

        {activeTab === "finance" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-black border border-emerald-500/30 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5"><Wallet size={120} className="text-emerald-500" /></div>
                <h2 className="text-xs font-black uppercase mb-2 text-emerald-500 tracking-widest">Saldo Disponível (Seus 70%)</h2>
                <p className="text-[10px] text-white/40 uppercase font-black mb-6 tracking-widest max-w-xs">Pronto para saque na sua conta.</p>
                <div className="text-5xl font-black text-white mb-8 tracking-tighter">
                  {modelBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl mb-6">
                  <p className="text-[10px] text-emerald-400/80 font-bold uppercase text-center leading-relaxed tracking-widest">⚠️ 1 Saque por dia. PIX em até 1 hora.</p>
                </div>
                <button onClick={handleWithdraw} disabled={isWithdrawing || modelBalance <= 0} className="w-full bg-emerald-500 text-black py-5 rounded-2xl text-xs font-black uppercase shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50">
                  {isWithdrawing ? "Processando..." : "Solicitar Saque (PIX)"}
                </button>
              </div>

              <div className="bg-black border border-[#FFD700]/30 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-center">
                <div className="absolute top-0 right-0 p-8 opacity-5"><Calendar size={120} className="text-[#FFD700]" /></div>
                <h2 className="text-xs font-black uppercase mb-2 text-[#FFD700] tracking-widest">Lucro Acumulado</h2>
                <p className="text-[10px] text-white/40 uppercase font-black mb-6 tracking-widest max-w-xs">Total de comissões ganhas nos últimos 6 meses.</p>
                <div className="text-5xl font-black text-white tracking-tighter">
                  {accumulatedEarnings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>

              <div className="bg-black border border-white/10 p-8 rounded-[2.5rem] shadow-2xl col-span-1 md:col-span-2">
                <h2 className="text-xs font-black uppercase mb-4 text-[#FF1493] tracking-widest flex items-center gap-2"><DollarSign size={16}/> Suas Chaves PIX (Para Saques)</h2>
                <p className="text-[10px] text-white/40 uppercase font-black mb-6 tracking-widest">Cadastre onde você deseja receber seus lucros da Savanah Labz.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-[9px] font-black text-white/30 uppercase block mb-2">Chave PIX Principal (Obrigatório)</label>
                    <input type="text" value={pixKey1} onChange={e => setPixKey1(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-xs text-white outline-none focus:border-[#FF1493]" placeholder="CPF, Celular, E-mail ou Aleatória" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-white/30 uppercase block mb-2">Chave PIX Secundária (Opcional)</label>
                    <input type="text" value={pixKey2} onChange={e => setPixKey2(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-xs text-white outline-none focus:border-[#FF1493]" placeholder="Chave reserva caso a primeira falhe" />
                  </div>
                </div>
                <button onClick={handleSavePix} disabled={savingPix} className="w-full md:w-auto bg-[#FF1493] text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase shadow-xl transition-all active:scale-95">
                  {savingPix ? "Salvando..." : "Salvar Minhas Chaves PIX"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "prizes" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col sm:flex-row gap-6 items-center">
              <div className="w-full sm:w-40 h-24 bg-black/50 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center relative shrink-0">{(previewUrl || currentBg) ? <img src={(previewUrl || currentBg) as string} className="w-full h-full object-cover" /> : <ImageIcon className="text-white/10" size={32} />}</div>
              <div className="flex-1 text-center sm:text-left"><p className="text-[10px] font-black uppercase text-white/40 mb-3 tracking-widest">Fundo (Máx 2MB | JPEG)</p><label className="bg-white/5 border border-white/20 px-5 py-3 rounded-xl text-[10px] font-black uppercase cursor-pointer hover:bg-white/10 transition-all">Trocar Foto <input type="file" accept="image/jpeg, image/png" onChange={handleFileChange} className="hidden" /></label>{selectedFile && <button onClick={handleSaveImage} className="bg-[#FF1493] text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase ml-2">Salvar</button>}</div>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-left shadow-xl">
              <h2 className="text-xs font-black uppercase mb-6 flex items-center gap-2 text-[#FF1493] tracking-widest"><DollarSign size={14} /> Dados da Roleta</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5"><label className="text-[9px] uppercase font-black text-white/40 block mb-1">Nome na Roleta</label><input type="text" value={modelName} onChange={e => setModelName(e.target.value)} className="bg-transparent text-lg font-black outline-none text-[#FFD700] w-full" /></div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5"><label className="text-[9px] uppercase font-black text-white/40 block mb-1">Custo Giro (Em CR)</label><input type="number" value={spinCost} onChange={e => setSpinCost(Number(e.target.value))} className="bg-transparent text-lg font-black outline-none text-white w-full" /></div>
              </div>
              <button onClick={handleSaveSettings} disabled={savingSettings} className="w-full bg-[#FF1493] text-white py-5 rounded-2xl text-[10px] font-black uppercase shadow-xl hover:scale-[1.01] transition-all">SALVAR DADOS</button>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
               <div className="flex justify-between items-center mb-6"><h2 className="text-xs font-black uppercase text-white/50 tracking-widest">Slots da Roleta</h2><span className={`text-[10px] font-black ${Math.abs(totalChance - 100) < 0.05 ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>{totalChance.toFixed(2)}% / 100%</span></div>
               <div className="grid gap-3">
                {prizes.map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-black/40 border border-white/5 p-5 rounded-2xl hover:border-[#FF1493]/30 transition-all text-left">
                    <div className="flex items-center gap-4"><div className="h-6 w-1.5 rounded-full" style={{ backgroundColor: p.color }} /><div><p className="text-xs font-black uppercase text-white">{p.name}</p><p className="text-[9px] font-bold text-[#FFD700]">{Number(p.weight).toFixed(2)}% de chance</p></div></div>
                    <button onClick={() => setEditingPrize(p)} className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-[#FF1493] transition-all"><Edit3 size={18}/></button>
                  </div>
                ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === "players" && <PlayersManager modelId={modelId} />}
        
        {activeTab === "history" && (
          <div className="grid gap-3 animate-in fade-in duration-500">
            {history.filter(h => h.model_id === modelId).map((h, i) => (
              <div key={h.id || i} className={`p-5 rounded-3xl border transition-all flex items-center justify-between ${h.delivered ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                <div><h3 className={`text-sm font-black uppercase ${h.delivered ? 'text-white/30' : 'text-white'}`}>{h.player_name}</h3><p className="text-[9px] font-bold text-[#FFD700] uppercase mt-1">{h.prize_name}</p></div>
                <button onClick={async () => {
                  if (h.delivered) return;
                  await fetch(`${supabaseUrl}/rest/v1/SpinHistory?id=eq.${h.id}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ delivered: true }) });
                  loadData();
                }} className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${h.delivered ? 'bg-emerald-500 text-black' : 'bg-white/5 text-white/20'}`}><Check size={20}/></button>
              </div>
            ))}
          </div>
        )}

        {showRankTab && activeTab === "ranking" && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="text-center py-6">
              <h2 className="text-xl font-black uppercase text-[#FFD700] italic tracking-tighter">Ranking das Estrelas</h2>
              <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mt-1">Quem mais faturou esta semana</p>
            </div>
            
            <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 p-6 rounded-3xl relative overflow-hidden mb-6 shadow-2xl">
               <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy size={80} className="text-amber-500"/></div>
               <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-4"><Trophy size={16} className="text-amber-500"/><h3 className="text-xs font-black uppercase text-amber-500 tracking-widest">Desafio de Faturamento</h3></div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div><p className="text-[9px] text-white/30 uppercase font-black mb-1">Meta Semanal</p><p className="text-xl font-black text-white">R$ {metaValue.toLocaleString('pt-BR')}</p></div>
                   <div><p className="text-[9px] text-white/30 uppercase font-black mb-1">Prêmio</p><p className="text-xl font-black text-amber-500">{metaPrize || "Consulte o Master"}</p></div>
                 </div>
               </div>
            </div>

            {modelRanking.map((m, i) => (
              <div key={m.id} className={`p-6 rounded-[2rem] border flex items-center justify-between transition-all ${m.id === modelId ? 'bg-[#FF1493]/10 border-[#FF1493]/30 scale-[1.02]' : 'bg-white/5 border-white/5'}`}>
                <div className="flex items-center gap-5">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black ${i === 0 ? 'bg-[#FFD700] text-black shadow-[0_0_15px_rgba(255,215,0,0.5)]' : 'bg-white/5 text-white/30'}`}>
                    {i === 0 ? <Crown size={20}/> : `#${i+1}`}
                  </div>
                  <div>
                    <h3 className={`font-black uppercase text-sm ${m.id === modelId ? 'text-[#FF1493]' : 'text-white'}`}>{m.slug} {m.id === modelId && "(Você)"}</h3>
                    <p className="text-[9px] font-black text-white/20 uppercase">Parceira Savanah Labz</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-white/30 uppercase mb-1">Giros Totais</p>
                  <p className="text-xl font-black text-white">{m.score}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {editingPrize && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveEditPrize} className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[3rem] w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-black uppercase mb-8 text-[#FF1493] italic text-center tracking-tighter">Editar Prêmio</h2>
            <div className="space-y-4">
              <input type="text" value={editingPrize.name} onChange={e => setEditingPrize({...editingPrize, name: e.target.value})} className="w-full bg-black border border-white/10 p-5 rounded-2xl text-xs text-white" />
              <input type="number" step="0.01" value={editingPrize.weight} onChange={e => setEditingPrize({...editingPrize, weight: e.target.value})} className="w-full bg-black border border-white/10 p-5 rounded-2xl text-xs text-white" />
              <div className="flex items-center gap-3 bg-black border border-white/10 p-4 rounded-2xl"><Palette size={16} className="text-white/30" /><input type="color" value={editingPrize.color} onChange={e => setEditingPrize({...editingPrize, color: e.target.value})} className="w-10 h-8 bg-transparent border-none cursor-pointer" /><span className="text-[10px] text-white/40 font-black uppercase">Cor da Fatia</span></div>
            </div>
            <button type="submit" className="w-full bg-[#FF1493] text-white py-5 rounded-2xl text-[10px] font-black uppercase mt-8 shadow-xl">Salvar Alterações</button>
            <button type="button" onClick={() => setEditingPrize(null)} className="w-full text-[9px] font-black text-white/20 mt-6 uppercase text-center tracking-widest">Voltar</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white uppercase font-black">Carregando...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
