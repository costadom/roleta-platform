"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Crown, User, Phone, KeyRound, Image as ImageIcon, Loader2, ArrowLeft, CheckCircle2, AlertTriangle, AlertOctagon } from "lucide-react";

export default function CadastroModelo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [referralId, setReferralId] = useState<string | null>(null);
  const [madrinhaName, setMadrinhaName] = useState<string | null>(null); // 🔥 Nome real da madrinha
  const [ageConfirmed, setAgeConfirmed] = useState(false); // 🔥 Trava de maioridade

  const [formData, setFormData] = useState({
    full_name: "", nickname: "", whatsapp: "", cpf: "", birth_date: "", pix_1: "", bg_url: "", profile_url: "",
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // 🔥 SISTEMA DE INDICAÇÃO & BUSCA DE NOME (MOTOR GACHA) 🔥
  useEffect(() => {
    const fetchMadrinhaName = async (slug: string) => {
        try {
            const h = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };
            // Busca o config da modelo que indicou para pegar o model_name
            const r = await fetch(`${supabaseUrl}/rest/v1/Models?slug=eq.${slug}&select=Configs(model_name)`, { headers: h }).then(res=>res.json());
            if(r && r[0]) {
                const config = Array.isArray(r[0].Configs) ? r[0].Configs[0] : r[0].Configs;
                setMadrinhaName(config?.model_name || slug);
            } else {
                setMadrinhaName(slug); // Fallback pro slug se não achar config
            }
        } catch(e) { setMadrinhaName(slug); }
    };

    const refFromUrl = searchParams.get("ref");
    
    if (refFromUrl) {
      setReferralId(refFromUrl);
      localStorage.setItem("labz_referral_slug", refFromUrl);
      fetchMadrinhaName(refFromUrl);
    } else {
      const savedRef = localStorage.getItem("labz_referral_slug");
      if (savedRef) {
          setReferralId(savedRef);
          fetchMadrinhaName(savedRef);
      }
    }
  }, [searchParams, supabaseUrl, supabaseKey]);

  // 🔥 SISTEMA DE UPLOAD (PEGANDO A FOTO DA GALERIA)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'bg_url' | 'profile_url') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      alert("A imagem é muito pesada! Escolha uma foto de no máximo 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, [field]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bg_url || !formData.profile_url) {
      alert("ATENÇÃO: Você precisa carregar as DUAS fotos (Vitrine e Fundo) para continuar!");
      return;
    }
    // Trava jurídica
    if (!ageConfirmed) {
        alert("Você precisa confirmar que tem mais de 18 anos para se cadastrar.");
        return;
    }
    setLoading(true);

    try {
      const payload = {
        ...formData,
        prizes: JSON.stringify(["Pack VIP", "Foto Exclusiva", "Áudio Safadinho", "Desconto 50%", "Mimo Surpresa", "Acesso VIP"]),
        status: "pendente", 
        referred_by: referralId, // Envia o slug (ID único)
        created_at: new Date().toISOString()
      };

      await fetch(`${supabaseUrl}/rest/v1/Applications`, {
        method: "POST", headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      setSuccess(true);
      localStorage.removeItem("labz_referral_slug"); // Limpa o ref após sucesso
    } catch (error) { alert("Erro ao enviar cadastro. Tente novamente."); } finally { setLoading(false); }
  };

  if (success) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center text-white font-sans selection:bg-[#FFD700] selection:text-black"><CheckCircle2 size={80} className="text-[#FFD700] mb-6 animate-bounce" /><h1 className="text-3xl font-black uppercase text-[#FFD700] mb-4 italic">Cadastro Enviado!</h1><p className="text-white/60 text-xs font-bold uppercase tracking-widest max-w-sm mb-8 leading-relaxed">Nossa equipe vai analisar o seu perfil. Fique de olho no seu WhatsApp, entraremos em contato em breve!</p><button onClick={() => router.push("/")} className="bg-white/10 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase hover:bg-white/20 transition-all">Voltar para o Início</button></div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-8 font-sans relative selection:bg-[#FFD700] selection:text-black pb-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.1)_0%,rgba(0,0,0,1)_100%)] z-0 pointer-events-none fixed" />
      <div className="max-w-xl mx-auto relative z-10">
        <button onClick={() => router.push("/")} className="flex items-center gap-2 text-[10px] font-black uppercase text-white/40 hover:text-white mb-8 transition-all"><ArrowLeft size={16} /> Voltar</button>

        <div className="text-center mb-10"><div className="mx-auto bg-[#FFD700]/10 w-20 h-20 rounded-full flex items-center justify-center mb-6 border border-[#FFD700]/30"><Crown size={36} className="text-[#FFD700]" /></div><h1 className="text-3xl font-black uppercase text-white mb-2 italic tracking-tighter">Seja uma <span className="text-[#FFD700]">Parceira</span></h1></div>

        <form onSubmit={handleSubmit} className="bg-black border border-white/10 p-8 rounded-[3rem] shadow-2xl space-y-6 relative overflow-hidden">
          
          {/* 🔥 BANNER VIP DE INDICAÇÃO (PREMIUM) 🔥 */}
          {referralId && (
              <div className="absolute top-0 left-0 right-0 bg-[#FFD700] p-4 text-black text-center animate-pulse-slow border-b-2 border-white/20 z-20">
                  <p className="text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 mb-1">
                      <Crown size={14} className="animate-bounce" /> Você está usando o link de referência de:
                  </p>
                  <p className="text-lg font-black uppercase italic tracking-tighter text-black/90 mb-1">{madrinhaName || referralId}</p>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/70">
                      - Cadastro VIP (Você tem mais chances de ser aceita) -
                  </p>
              </div>
          )}

          <div className={`${referralId ? 'pt-24' : ''}`}>
            <h2 className="text-[11px] font-black uppercase text-[#FFD700] tracking-widest mb-4 border-b border-white/10 pb-4">Dados Pessoais</h2>
          </div>
          
          <div className="space-y-4">
            <div><label className="text-[9px] font-black text-white/40 uppercase block mb-2">Nome Completo</label><div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16}/><input type="text" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-2xl text-xs text-white outline-none focus:border-[#FFD700]" placeholder="Seu nome real" /></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-[9px] font-black text-white/40 uppercase block mb-2">Nome Artístico</label><div className="relative"><Crown className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16}/><input type="text" required value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value.toLowerCase().replace(/\s/g, '')})} className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-2xl text-xs text-white outline-none focus:border-[#FFD700]" placeholder="Ex: seunomeartistico" /></div></div>
              <div><label className="text-[9px] font-black text-white/40 uppercase block mb-2">WhatsApp</label><div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16}/><input type="tel" required value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-2xl text-xs text-white outline-none focus:border-[#FFD700]" placeholder="(00) 00000-0000" /></div></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-[9px] font-black text-white/40 uppercase block mb-2">CPF</label><input type="text" required value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xs text-white outline-none focus:border-[#FFD700]" placeholder="000.000.000-00" /></div>
              <div><label className="text-[9px] font-black text-white/40 uppercase block mb-2">Nascimento</label><input type="date" required value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xs text-white/70 outline-none focus:border-[#FFD700]" /></div>
            </div>
          </div>

          <h2 className="text-[11px] font-black uppercase text-[#FFD700] tracking-widest mb-4 border-b border-white/10 pb-4 pt-6">Mídia & Design (Obrigatório)</h2>
          <div className="space-y-6">
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl">
              <p className="text-[9px] text-red-400 uppercase font-black tracking-widest flex items-center gap-2 mb-2"><AlertTriangle size={14}/> ATENÇÃO: REGRAS DE NUDEZ</p>
              <p className="text-[9px] text-white/70 uppercase font-bold leading-relaxed">Fotos sensuais (biquíni/lingerie) são super bem-vindas! Mas NUDEZ EXPLÍCITA é estritamente proibida <strong>SOMENTE nestas duas fotos de exibição</strong> (Vitrine e Fundo). Nos seus conteúdos pagos, na roleta, e na raspadinha está tudo liberado!</p>
            </div>

            <div>
              <label className="text-[9px] font-black text-white/40 uppercase block mb-2">1. Foto para a VITRINE (Seu Perfil Principal - Máx 2MB)</label>
              <label className="w-full bg-black border border-[#FFD700]/30 p-4 rounded-2xl text-xs text-white outline-none focus:border-[#FFD700] flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all">
                <span className="flex items-center gap-2 truncate">
                  <ImageIcon size={16} className={formData.profile_url ? "text-emerald-500 shrink-0" : "text-[#FFD700] shrink-0"} />
                  {formData.profile_url ? <span className="text-emerald-500 font-bold">✅ Foto da Vitrine selecionada!</span> : <span className="text-white/50">Clique para abrir a galeria...</span>}
                </span>
                <input type="file" accept="image/jpeg, image/png" className="hidden" onChange={e => handleFileChange(e, 'profile_url')} />
              </label>
            </div>

            <div>
              <label className="text-[9px] font-black text-white/40 uppercase block mb-2">2. Foto para o FUNDO DA ROLETA (Ambientação - Máx 2MB)</label>
              <label className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xs text-white outline-none focus:border-[#FFD700] flex items-center justify-between cursor-pointer hover:bg-white/10 transition-all">
                <span className="flex items-center gap-2 truncate">
                  <ImageIcon size={16} className={formData.bg_url ? "text-emerald-500 shrink-0" : "text-white/20 shrink-0"} />
                  {formData.bg_url ? <span className="text-emerald-500 font-bold">✅ Foto da Roleta selecionada!</span> : <span className="text-white/50">Clique para abrir a galeria...</span>}
                </span>
                <input type="file" accept="image/jpeg, image/png" className="hidden" onChange={e => handleFileChange(e, 'bg_url')} />
              </label>
            </div>
          </div>

          <h2 className="text-[11px] font-black uppercase text-[#FFD700] tracking-widest mb-4 border-b border-white/10 pb-4 pt-6">Recebimento</h2>
          <div><label className="text-[9px] font-black text-white/40 uppercase block mb-2">Chave PIX Principal (Obrigatório)</label><div className="relative"><KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16}/><input type="text" required value={formData.pix_1} onChange={e => setFormData({...formData, pix_1: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-2xl text-xs text-white outline-none focus:border-[#FFD700]" placeholder="Onde vamos mandar seus ganhos" /></div></div>

          {/* 🔥 TRAVA DE MAIORIDADE (OBRIGATÓRIO) 🔥 */}
          <div className="pt-8 mt-8 border-t border-white/10">
              <label className="flex items-start gap-3 cursor-pointer group bg-black border border-white/5 p-5 rounded-2xl hover:border-[#FFD700]/30 transition-all">
                <input type="checkbox" checked={ageConfirmed} onChange={e => setAgeConfirmed(e.target.checked)} className="mt-1 w-5 h-5 accent-[#FFD700] bg-black border-white/20 rounded cursor-pointer" required />
                <div className="flex-1">
                    <p className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
                        Tenho +18 anos e concordo
                    </p>
                    <p className="text-[9px] text-white/40 font-bold uppercase mt-1 leading-relaxed">
                        Declaro que sou maior de idade, as informações são verdadeiras e aceito os termos da Savanah Labz.
                    </p>
                </div>
                <AlertOctagon size={24} className={ageConfirmed ? "text-emerald-500" : "text-[#FFD700]/30"} />
              </label>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#FFD700] text-black py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(255,215,0,0.2)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:hover:scale-100 transition-all flex items-center justify-center gap-3 mt-8">{loading ? <Loader2 className="animate-spin" size={18} /> : "Enviar Minha Candidatura"}</button>
        
        </form>
      </div>
       <style jsx global>{`
        @keyframes pulse-slow { 0% { opacity: 0.9; } 50% { opacity: 1; } 100% { opacity: 0.9; } }
        .animate-pulse-slow { animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}</style>
    </div>
  );
}
