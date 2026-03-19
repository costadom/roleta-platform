"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react";

export default function ModelLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const res = await fetch(`${supabaseUrl}/rest/v1/Models?email=eq.${encodeURIComponent(email)}&password=eq.${encodeURIComponent(password)}&select=id,slug`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
      });
      const data = await res.json();
      
      if (data && data.length > 0) {
        // Leva a modelo para o painel de controle dela
        router.push(`/admin/dashboard?model=${data[0].id}&slug=${data[0].slug}`);
      } else {
        alert("E-mail ou senha incorretos!");
      }
    } catch(err) {
      alert("Erro de conexão com o banco de dados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative selection:bg-[#FF1493] selection:text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,20,147,0.15)_0%,rgba(0,0,0,1)_100%)] z-0 pointer-events-none" />
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 p-10 rounded-[3rem] text-center shadow-2xl relative z-10 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#FF1493]/10 blur-[80px]" />
        
        <div className="mx-auto bg-[#FF1493]/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 border border-[#FF1493]/30 shadow-[0_0_20px_rgba(255,20,147,0.2)]">
          <Lock size={32} className="text-[#FF1493]"/>
        </div>
        
        <h1 className="text-2xl font-black uppercase text-white mb-2 italic tracking-tighter">Painel da Modelo</h1>
        <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-8">Savanah Labz</p>
        
        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18}/>
            <input type="email" placeholder="SEU E-MAIL" required className="w-full bg-black border border-white/10 p-5 pl-12 rounded-2xl text-xs text-white outline-none focus:border-[#FF1493] transition-all" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18}/>
            <input type={showPass ? "text" : "password"} placeholder="SUA SENHA" required className="w-full bg-black border border-white/10 p-5 pl-12 rounded-2xl text-xs text-white outline-none focus:border-[#FF1493] transition-all" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-[#FF1493] transition-colors">{showPass ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-[#FF1493] text-white py-5 rounded-2xl text-[11px] font-black uppercase shadow-lg shadow-[#FF1493]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 mt-4">
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Acessar Minha Roleta"}
          </button>
        </form>
      </div>
    </div>
  );
}
