"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Phone, KeyRound, Image as ImageIcon, Loader2, ArrowLeft, CheckCircle2, AlertTriangle, AlertOctagon, Sparkles, ShieldCheck } from "lucide-react";

// Separamos o conteúdo principal para que o Next.js não reclame do useSearchParams
function CadastroContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [referralId, setReferralId] = useState<string | null>(null);
  const [madrinhaName, setMadrinhaName] = useState<string | null>(null);
  const [ageConfirmed, setAgeConfirmed] = useState(false);

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
            const r = await fetch(`${supabaseUrl}/rest/v1/Models?slug=eq.${slug}&select=Configs(model_name)`, { headers: h }).then(res=>res.json());
            if(r && r[0]) {
                const config = Array.isArray(r[0].Configs) ? r[0].Configs[0] : r[0].Configs;
                setMadrinhaName(config?.model_name || slug);
            } else {
                setMadrinhaName(slug);
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

  // 🔥 SISTEMA DE UPLOAD
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
        referred_by: referralId, 
        created_at: new Date().toISOString()
      };

      await fetch(`${supabaseUrl}/rest/v1/Applications`, {
        method: "POST", headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      setSuccess(true);
      localStorage.removeItem("labz_referral_slug"); 
    } catch (error) { alert("Erro ao enviar cadastro. Tente novamente."); } finally { setLoading(false); }
  };

  if (success) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center text-white font-sans selection:bg-[#D946EF] selection:text-white">
        <div className="w-32 h-32 bg-black/50 backdrop-blur-xl border border-[#D946EF]/30 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(217,70,239,0.3)] animate-pulse">
            <span className="text-6xl drop-shadow-[0_0_15px_rgba(217,70,239,0.8)] text-[#D946EF]">🔱</span>
        </div>
        <h1 className="text-4xl font-black uppercase text-white mb-4 italic tracking-tighter">Cadastro <span className="text-[#D946EF]">Enviado!</span></h1>
        <p className="text-white/60 text-xs font-bold uppercase tracking-widest max-w-sm mb-12 leading-relaxed">Sua aplicação está em análise pela nossa equipe. Fique atenta ao seu WhatsApp, entraremos em contato muito em breve!</p>
        <button onClick={() => router.push("/")} className="bg-white/5 border border-white/10 text-white px-10 py-5 rounded-2xl text-[10px] font-black uppercase hover:bg-white/10 hover:border-[#D946EF]/50 transition-all flex items-center gap-2">
            <ArrowLeft size={16} /> Voltar para o Início
        </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-8 font-sans relative selection:bg-[#D946EF] selection:text-white pb-20">
      
      {/* FUNDO LIQUID GLASS */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-black to-[#050505] z-0 pointer-events-none fixed" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(217,70,239,0.1)_0%,rgba(0,0,0,0)_70%)] z-0 pointer-events-none fixed" />

      <div className="max-w-xl mx-auto relative z-10 pt-4">
        <button onClick={() => router.push("/")} className="flex items-center gap-2 text-[10px] font-black uppercase text-white/40 hover:text-white mb-8 transition-all bg-white/5 px-4 py-2 rounded-full border border-white/10"><ArrowLeft size={14} /> Voltar</button>

        <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-4xl text-[#D946EF] drop-shadow-[0_0_15px_rgba(217,70,239,0.8)]">🔱</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase text-white mb-2 italic tracking-tighter">Seja uma <span className="text-[#D946EF]">Parceira</span></h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 p-6 sm:p-10 rounded-[3rem] shadow-[0_0_50px_rgba(217,70,239,0.1)] space-y-8 relative overflow-hidden">
          
          {/* CAIXA DE INDICAÇÃO (MADRINHA) NEON */}
          {referralId && (
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-[#D946EF]/20 via-[#D946EF]/10 to-[#D946EF]/20 p-4 text-white text-center border-b border-[#D946EF]/30 z-20 backdrop-blur-md">
                  <p className="text-[10px] text-[#D946EF] font-black uppercase tracking-widest flex items-center justify-center gap-2 mb-1">
                      <Sparkles size={14} className="animate-pulse" /> Você está usando o link de referência de:
                  </p>
                  <p className="text-lg font-black uppercase italic tracking-tighter text-white mb-1 drop-shadow-md">{madrinhaName || referralId}</p>
                  <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/60">
                      - Cadastro VIP (Prioridade de Aprovação) -
                  </p>
              </div>
          )}

          <div className={`${referralId ? 'pt-24' : ''}`}>
            <h2 className="text-[11px] font-black uppercase text-[#D946EF] tracking-widest mb-6 border-b border-white/10 pb-4 flex items-center gap-2"><User size={16} /> Dados Pessoais</h2>
          </div>
          
          <div className="space-y-5">
            <div>
                <label className="text-[9px] font-black text-white/40 uppercase block mb-2">Nome Completo</label>
                <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16}/>
                    <input type="text" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full bg-white/5 backdrop-blur-sm border border-white/10 p-4 pl-12 rounded-2xl text-xs text-white outline-none focus:border-[#D946EF] focus:bg-white/10 transition-all placeholder:text-white/30" placeholder="Seu nome real" />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                  <label className="text-[9px] font-black text-white/40 uppercase block mb-2">Nome Artístico</label>
                  <div className="relative">
                      <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16}/>
                      <input type="text" required value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value.toLowerCase().replace(/\s/g, '')})} className="w-full bg-white/5 backdrop-blur-sm border border-white/10 p-4 pl-12 rounded-2xl text-xs text-white outline-none focus:border-[#D946EF] focus:bg-white/10 transition-all placeholder:text-white/30" placeholder="Ex: seunomeartistico" />
                  </div>
              </div>
              <div>
                  <label className="text-[9px] font-black text-white/40 uppercase block mb-2">WhatsApp</label>
                  <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16}/>
                      <input type="tel" required value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full bg-white/5 backdrop-blur-sm border border-white/10 p-4 pl-12 rounded-2xl text-xs text-white outline-none focus:border-[#D946EF] focus:bg-white/10 transition-all placeholder:text-white/30" placeholder="(00) 00000-0000" />
                  </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                  <label className="text-[9px] font-black text-white/40 uppercase block mb-2">CPF</label>
                  <input type="text" required value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} className="w-full bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-2xl text-xs text-white outline-none focus:border-[#D946EF] focus:bg-white/10 transition-all placeholder:text-white/30" placeholder="000.000.000-00" />
              </div>
              <div>
                  <label className="text-[9px] font-black text-white/40 uppercase block mb-2">Nascimento</label>
                  <input type="date" required value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} className="w-full bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-2xl text-xs text-white/70 outline-none focus:border-[#D946EF] focus:bg-white/10 transition-all" />
              </div>
            </div>
          </div>

          <h2 className="text-[11px] font-black uppercase text-[#D946EF] tracking-widest mb-6 border-b border-white/10 pb-4 pt-8 flex items-center gap-2"><ImageIcon size={16} /> Mídia & Design (Obrigatório)</h2>
          
          <div className="space-y-6">
            <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-2xl backdrop-blur-sm">
              <p className="text-[10px] text-red-400 uppercase font-black tracking-widest flex items-center gap-2 mb-2"><AlertTriangle size={14}/> ATENÇÃO: REGRAS DE NUDEZ</p>
              <p className="text-[9px] text-white/70 uppercase font-bold leading-relaxed">Fotos sensuais (biquíni/lingerie) são super bem-vindas! Mas NUDEZ EXPLÍCITA é estritamente proibida <strong>SOMENTE nestas duas fotos de exibição</strong> (Vitrine e Fundo). Nos seus conteúdos pagos, na roleta, e na raspadinha está tudo liberado!</p>
            </div>

            <div>
              <label className="text-[9px] font-black text-white/40 uppercase block mb-2">1. Foto para a VITRINE (Seu Perfil Principal - Máx 2MB)</label>
              <label className="w-full bg-black/50 border border-white/10 p-5 rounded-2xl text-xs text-white outline-none focus:border-[#D946EF] flex items-center justify-between cursor-pointer hover:bg-white/5 hover:border-[#D946EF]/50 transition-all">
                <span className="flex items-center gap-3 truncate">
                  <ImageIcon size={20} className={formData.profile_url ? "text-[#00f0ff] shrink-0" : "text-[#D946EF] shrink-0"} />
                  {formData.profile_url ? <span className="text-[#00f0ff] font-black uppercase tracking-widest text-[10px]">✅ Foto da Vitrine Salva!</span> : <span className="text-white/50 font-bold uppercase text-[10px]">Clique para abrir a galeria...</span>}
                </span>
                <input type="file" accept="image/jpeg, image/png" className="hidden" onChange={e => handleFileChange(e, 'profile_url')} />
              </label>
            </div>

            <div>
              <label className="text-[9px] font-black text-white/40 uppercase block mb-2">2. Foto para o FUNDO DA ROLETA (Ambientação - Máx 2MB)</label>
              <label className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-xs text-white outline-none focus:border-[#D946EF] flex items-center justify-between cursor-pointer hover:bg-white/10 hover:border-[#D946EF]/50 transition-all">
                <span className="flex items-center gap-3 truncate">
                  <ImageIcon size={20} className={formData.bg_url ? "text-[#00f0ff] shrink-0" : "text-white/30 shrink-0"} />
                  {formData.bg_url ? <span className="text-[#00f0ff] font-black uppercase tracking-widest text-[10px]">✅ Foto de Fundo Salva!</span> : <span className="text-white/50 font-bold uppercase text-[10px]">Clique para abrir a galeria...</span>}
                </span>
                <input type="file" accept="image/jpeg, image/png" className="hidden" onChange={e => handleFileChange(e, 'bg_url')} />
              </label>
            </div>
          </div>

          <h2 className="text-[11px] font-black uppercase text-[#D946EF] tracking-widest mb-6 border-b border-white/10 pb-4 pt-8 flex items-center gap-2"><ShieldCheck size={16} /> Recebimento & Segurança</h2>
          
          <div>
              <label className="text-[9px] font-black text-white/40 uppercase block mb-2">Chave PIX Principal (Obrigatório)</label>
              <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16}/>
                  <input type="text" required value={formData.pix_1} onChange={e => setFormData({...formData, pix_1: e.target.value})} className="w-full bg-white/5 backdrop-blur-sm border border-white/10 p-4 pl-12 rounded-2xl text-xs text-white outline-none focus:border-[#D946EF] focus:bg-white/10 transition-all placeholder:text-white/30" placeholder="Onde vamos mandar seus ganhos" />
              </div>
          </div>

          <div className="pt-8 mt-10 border-t border-white/10">
              <label className="flex items-start gap-4 cursor-pointer group bg-black/40 border border-white/10 p-6 rounded-[2rem] hover:border-[#D946EF]/50 transition-all backdrop-blur-sm">
                <div className="pt-1">
                    <input type="checkbox" checked={ageConfirmed} onChange={e => setAgeConfirmed(e.target.checked)} className="w-5 h-5 accent-[#D946EF] cursor-pointer" required />
                </div>
                <div className="flex-1">
                    <p className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2 mb-1">
                        Tenho +18 anos e concordo
                    </p>
                    <p className="text-[9px] text-white/40 font-bold uppercase leading-relaxed">
                        Declaro que sou maior de idade, as informações são verdadeiras e aceito os termos da LabzSexy.
                    </p>
                </div>
                <AlertOctagon size={24} className={ageConfirmed ? "text-[#00f0ff]" : "text-white/20"} />
              </label>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#D946EF] to-[#a832b8] text-white py-6 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-[0_0_30px_rgba(217,70,239,0.3)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-3 mt-10">
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Enviar Minha Candidatura"}
          </button>
        
        </form>
      </div>
    </div>
  );
}

// 🔥 A MÁGICA ACONTECE AQUI: A página principal agora é apenas o Suspense que envolve o conteúdo 🔥
export default function CadastroModeloPage() {
  return (
    <Suspense fallback={
        <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#D946EF] font-black uppercase animate-pulse flex-col gap-4">
            <span className="text-6xl drop-shadow-[0_0_15px_rgba(217,70,239,0.8)] text-[#D946EF]">🔱</span>
            Carregando LabzSexy...
        </div>
    }>
      <CadastroContent />
    </Suspense>
  );
}
