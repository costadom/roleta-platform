"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react";

export default function ModelLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // Busca na tabela "Models" as credenciais que você (Master) criou
      const res = await fetch(
        `${supabaseUrl}/rest/v1/Models?email=eq.${encodeURIComponent(email.trim())}&password=eq.${encodeURIComponent(password.trim())}&select=*`,
        {
          headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` },
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (data && data.length > 0) {
        const model = data[0];
        // Limpa lixos antigos e salva o acesso da modelo
        localStorage.clear();
        localStorage.setItem("model_auth", "true");
        localStorage.setItem("model_id", model.id);
        localStorage.setItem("model_slug", model.slug);
        
        // Redireciona para o painel dela
        router.push(`/admin/dashboard?model=${model.id}&slug=${model.slug}`);
      } else {
        setError("E-mail ou senha incorretos.");
      }
    } catch (err) {
      setError("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans">
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-10 w-full max-w-md shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-48 w-48 bg-[#FF1493]/10 blur-[100px] rounded-full" />
        
        <div className="relative z-10">
          <div className="h-16 w-16 bg-[#FF1493]/10 border border-[#FF1493]/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="text-[#FF1493]" size={30} />
          </div>
          
          <h1 className="text-white text-2xl font-black tracking-tighter text-center mb-2 uppercase italic">
            Área da Modelo
          </h1>
          <p className="text-white/30 text-[10px] font-bold text-center uppercase tracking-[0.3em] mb-10">
            Acesse seu painel de controle
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input
                type="email"
                placeholder="SEU E-MAIL"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black text-white px-5 py-5 pl-12 rounded-2xl text-xs font-bold outline-none border border-white/5 focus:border-[#FF1493]/50 transition-all placeholder:text-white/20"
                required
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input
                type={showPass ? "text" : "password"}
                placeholder="SUA SENHA"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black text-white px-5 py-5 pl-12 rounded-2xl text-xs font-bold outline-none border border-white/5 focus:border-[#FF1493]/50 transition-all placeholder:text-white/20"
                required
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] py-3 rounded-xl text-center uppercase font-black tracking-widest">{error}</div>}

            <button type="submit" disabled={loading} className="w-full bg-[#FF1493] text-white font-black uppercase text-xs py-5 rounded-2xl mt-6 shadow-xl flex items-center justify-center gap-3">
              {loading ? <><Loader2 className="animate-spin" size={16} /> Verificando...</> : "Entrar no Painel"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}