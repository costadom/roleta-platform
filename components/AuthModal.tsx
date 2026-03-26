"use client";

import React, { useState } from "react";
import { X, Phone, Mail, Lock, Eye, EyeOff, FileText, Loader2, Sparkles, User, AlertTriangle } from "lucide-react";
import { useParams } from "next/navigation";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const isValidCPF = (cpf: string) => {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  let split = cpf.split('');
  let v1 = 0; let v2 = 0;
  for (let i = 0; i < 9; i++) v1 += parseInt(split[i]) * (10 - i);
  v1 = (v1 * 10) % 11; if (v1 === 10 || v1 === 11) v1 = 0;
  if (v1 !== parseInt(split[9])) return false;
  for (let i = 0; i < 10; i++) v2 += parseInt(split[i]) * (11 - i);
  v2 = (v2 * 10) % 11; if (v2 === 10 || v2 === 11) v2 = 0;
  if (v2 !== parseInt(split[10])) return false;
  return true;
};

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const params = useParams();
  const slug = params.slug as string | undefined;

  const [view, setView] = useState<"login" | "register" | "update">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [cpf, setCpf] = useState("");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isOpen) return null;

  const handleCpf = (v: string) => {
    v = v.replace(/\D/g, "").slice(0, 11);
    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
    else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, "$1.$2");
    setCpf(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanWhatsapp = whatsapp.replace(/\D/g, "");
    const cleanCpf = cpf.replace(/\D/g, "");

    if (view !== "login" && !isValidCPF(cleanCpf)) {
        setError("CPF Inválido. Por favor, digite um CPF real.");
        setLoading(false); return;
    }

    const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=representation" };

    try {
      let currentModelId = null;
      if (slug) {
          const resMod = await fetch(`${supabaseUrl}/rest/v1/Models?slug=eq.${slug}&select=id`, { headers });
          const dataMod = await resMod.json();
          currentModelId = dataMod[0]?.id || null;
      }

      if (view === "login") {
        const resCheck = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${cleanWhatsapp}&password=eq.${password}&select=*`, { headers });
        const dataCheck = await resCheck.json();

        if (dataCheck && dataCheck.length > 0) {
          let userForThisModel = currentModelId ? dataCheck.find((p: any) => p.model_id === currentModelId) : dataCheck[0];

          if (!userForThisModel && currentModelId) {
            const baseUser = dataCheck[0];
            const newPlayerPayload = { whatsapp: baseUser.whatsapp, password: baseUser.password, email: baseUser.email, full_name: baseUser.full_name, nickname: baseUser.nickname, cpf: baseUser.cpf, name: baseUser.name, credits: 0, model_id: currentModelId };
            const insertRes = await fetch(`${supabaseUrl}/rest/v1/Players`, { method: "POST", headers, body: JSON.stringify(newPlayerPayload) });
            if (!insertRes.ok) { setError("Erro de Banco de Dados."); setLoading(false); return; }
            userForThisModel = (await insertRes.json())[0];
          }

          if (!userForThisModel.full_name || !userForThisModel.nickname || !userForThisModel.cpf) {
            setWhatsapp(userForThisModel.whatsapp); setEmail(userForThisModel.email || ""); setView("update"); setLoading(false); return;
          }

          localStorage.setItem("labz_player_logged", "true");
          localStorage.setItem("labz_player_phone", cleanWhatsapp);
          
          // 🔥 REDIRECIONA DIRETO PRA VITRINE 🔥
          window.location.href = '/vitrine';
          
        } else setError("WhatsApp ou senha incorretos.");
      } 
      else {
        if (view === "register" && currentModelId) {
           const checkExist = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${cleanWhatsapp}&model_id=eq.${currentModelId}&select=id`, { headers }).then(r=>r.json());
           if (checkExist && checkExist.length > 0) { setError("Você já tem uma conta nesta Musa. Faça Login."); setLoading(false); return; }
        }

        const payload = { whatsapp: cleanWhatsapp, email, cpf: cleanCpf, password, full_name: fullName, nickname, credits: 0, model_id: currentModelId, name: nickname };

        if (view === "register") {
           const res = await fetch(`${supabaseUrl}/rest/v1/Players`, { method: "POST", headers, body: JSON.stringify(payload) });
           if (!res.ok) { setError("Erro ao cadastrar."); setLoading(false); return; }
        } else {
           await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${cleanWhatsapp}`, { method: "PATCH", headers, body: JSON.stringify({ full_name: fullName, nickname, name: nickname, cpf: cleanCpf, email }) });
        }
        
        localStorage.setItem("labz_player_logged", "true");
        localStorage.setItem("labz_player_phone", cleanWhatsapp);
        
        // 🔥 REDIRECIONA DIRETO PRA VITRINE 🔥
        window.location.href = '/vitrine';
      }
    } catch { setError("Erro ao processar. Tente novamente."); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-[0_0_60px_rgba(217,70,239,0.15)] relative">
        
        {view !== "update" && (
            <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                <X size={16} />
            </button>
        )}
        
        <div className="text-center mb-8">
          {/* 🔥 O TRIDENTE E O LABZSEXY DE VOLTA 🔥 */}
          <div className="flex items-center justify-center gap-2 mb-2">
             <span className="text-3xl text-[#D946EF] drop-shadow-[0_0_10px_rgba(217,70,239,0.8)]">🔱</span>
             <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter drop-shadow-[0_0_10px_rgba(217,70,239,0.3)]">Labz<span className="text-[#D946EF]">Sexy</span></h2>
          </div>
          <p className="text-[10px] text-[#FFD700] uppercase font-bold tracking-[0.3em]">{view === "update" ? "🚀 Finalize seu Perfil" : "Acesso Restrito"}</p>
        </div>
        
        {view !== "update" && (
          <div className="flex bg-white/5 rounded-2xl p-1.5 mb-8 border border-white/10 backdrop-blur-sm">
            <button onClick={() => setView("login")} className={`flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all ${view === "login" ? 'bg-[#D946EF] text-white shadow-[0_0_15px_rgba(217,70,239,0.4)]' : 'text-white/40 hover:text-white'}`}>Entrar</button>
            <button onClick={() => setView("register")} className={`flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all ${view === "register" ? 'bg-[#D946EF] text-white shadow-[0_0_15px_rgba(217,70,239,0.4)]' : 'text-white/40 hover:text-white'}`}>Cadastrar</button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D946EF]/50" size={18} />
              <input type="tel" placeholder="WhatsApp" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} required disabled={view === "update"} className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl py-4 pl-12 text-white text-sm outline-none focus:border-[#D946EF] focus:bg-white/10 transition-all disabled:opacity-50 placeholder:text-white/30" />
          </div>
          
          {view !== "login" && (
            <>
              <div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D946EF]/50" size={18} /><input type="text" placeholder="Nome Completo" value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl py-4 pl-12 text-white text-sm outline-none focus:border-[#D946EF] focus:bg-white/10 transition-all placeholder:text-white/30" /></div>
              <div className="relative"><Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D946EF]/50" size={18} /><input type="text" placeholder="Nickname" value={nickname} onChange={e => setNickname(e.target.value)} required className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl py-4 pl-12 text-white text-sm outline-none focus:border-[#D946EF] focus:bg-white/10 transition-all placeholder:text-white/30" /></div>
              <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D946EF]/50" size={18} /><input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl py-4 pl-12 text-white text-sm outline-none focus:border-[#D946EF] focus:bg-white/10 transition-all placeholder:text-white/30" /></div>
              <div className="relative"><FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D946EF]/50" size={18} /><input type="text" placeholder="CPF" value={cpf} onChange={e => handleCpf(e.target.value)} required className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl py-4 pl-12 text-white text-sm outline-none focus:border-[#D946EF] focus:bg-white/10 transition-all placeholder:text-white/30" /></div>
            </>
          )}
          
          {view === "login" && (
            <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D946EF]/50" size={18} />
                <input type={showPassword ? "text" : "password"} placeholder="Sua Senha" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white text-sm outline-none focus:border-[#D946EF] focus:bg-white/10 transition-all placeholder:text-white/30" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-[#D946EF] transition-colors">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
            </div>
          )}
          
          {view === "register" && (
            <div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D946EF]/50" size={18} /><input type="password" placeholder="Crie uma Senha" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl py-4 pl-12 text-white text-sm outline-none focus:border-[#D946EF] focus:bg-white/10 transition-all placeholder:text-white/30" /></div>
          )}
          
          {error && (
              <div className="flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 py-3 px-4 rounded-xl mt-4">
                  <AlertTriangle size={14} className="text-red-500 shrink-0" />
                  <p className="text-red-500 text-[10px] font-black uppercase text-center">{error}</p>
              </div>
          )}
          
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#D946EF] to-[#a832b8] text-white font-black uppercase py-5 rounded-2xl shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:shadow-[0_0_30px_rgba(217,70,239,0.5)] hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center mt-4">
              {loading ? <Loader2 className="animate-spin" /> : view === "update" ? "Concluir Cadastro" : "Acessar Plataforma"}
          </button>
        </form>
      </div>
    </div>
  );
}
