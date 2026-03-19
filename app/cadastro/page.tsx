"use client";

import { useState } from "react";
import { Camera, CheckCircle2, ChevronRight, Loader2, Sparkles, ShieldCheck } from "lucide-react";

const formatCPF = (v: string) => {
  v = v.replace(/\D/g, "");
  if (v.length <= 11) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  return v;
};

const formatPhone = (v: string) => {
  v = v.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  if (v.length > 2 && v.length <= 7) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
  if (v.length > 7) return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
  return v;
};

const formatDate = (v: string) => {
  v = v.replace(/\D/g, "");
  if (v.length > 8) v = v.slice(0, 8);
  if (v.length >= 5) return `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
  if (v.length >= 3) return `${v.slice(0, 2)}/${v.slice(2)}`;
  return v;
};

export default function CadastroModelo() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    nickname: "", fullName: "", whatsapp: "", email: "", cpf: "", birthDate: "", pix1: "", pix2: ""
  });
  
  const [prizes, setPrizes] = useState(["", "", "", "", "", ""]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) return alert("A imagem deve ter no máximo 3MB!");
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handlePrizeChange = (index: number, value: string) => {
    const newPrizes = [...prizes];
    newPrizes[index] = value;
    setPrizes(newPrizes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prizes.some(p => p.trim() === "")) return alert("Preencha os 6 prêmios para a sua roleta!");
    if (!selectedFile) return alert("Envie uma foto de fundo bem bonita para a sua roleta!");
    
    setLoading(true);
    try {
      const slug = formData.nickname.toLowerCase().replace(/\s/g, '');

      // 1. Upload da Foto
      const fileName = `bg_candidata_${slug}_${Date.now()}.jpeg`;
      await fetch(`${supabaseUrl}/storage/v1/object/assets/${fileName}`, { 
        method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "image/jpeg" }, body: selectedFile 
      });
      const publicBgUrl = `${supabaseUrl}/storage/v1/object/public/assets/${fileName}?t=${Date.now()}`;

      // 2. Envia para a tabela de Candidaturas (Applications)
      const res = await fetch(`${supabaseUrl}/rest/v1/Applications`, {
        method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ 
          nickname: slug, 
          full_name: formData.fullName,
          whatsapp: formData.whatsapp.replace(/\D/g, ""),
          email: formData.email,
          cpf: formData.cpf.replace(/\D/g, ""),
          birth_date: formData.birthDate,
          pix_1: formData.pix1,
          pix_2: formData.pix2,
          prizes: prizes,
          bg_url: publicBgUrl
        }),
      });

      if (!res.ok) throw new Error("Erro ao enviar candidatura");
      setSuccess(true);

    } catch (err) {
      alert("Erro ao enviar seus dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white font-sans">
      <div className="bg-[#0a0a0a] border border-[#FF1493]/30 p-10 rounded-[3rem] w-full max-w-md text-center shadow-[0_0_40px_rgba(255,20,147,0.15)] animate-in zoom-in duration-500">
        <div className="h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
          <CheckCircle2 className="text-emerald-500" size={40} />
        </div>
        <h1 className="text-2xl font-black uppercase italic text-[#FF1493] mb-4 tracking-tighter">Candidatura Enviada!</h1>
        <p className="text-[12px] text-white/80 uppercase font-black tracking-widest leading-relaxed mb-6">
          Boa sorte! Nossos diretores irão analisar o seu perfil. <br/><br/>Se você for aprovada, a nossa equipe entrará em contato em breve com o seu link e dados de acesso.
        </p>
        <button onClick={() => window.location.reload()} className="w-full bg-white/5 border border-white/10 text-white/50 py-4 rounded-2xl text-[10px] font-black uppercase hover:bg-white/10 transition-all">Voltar ao Início</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 sm:p-6 text-white font-sans relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#FF1493]/10 to-transparent pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#FFD700]/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="bg-[#0a0a0a] border border-white/10 p-8 sm:p-12 rounded-[3rem] w-full max-w-2xl relative shadow-2xl z-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-black uppercase italic flex justify-center items-center gap-2"><span className="text-white">LabzSexy</span> <span className="text-[#FF1493]">Roll</span></h1>
          <p className="text-[10px] text-[#FFD700] uppercase font-black tracking-[0.3em] mt-2 flex items-center justify-center gap-1"><Sparkles size={12}/> Cadastro Oficial de Parceira</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="animate-in slide-in-from-right duration-300">
              <h2 className="text-xs font-black uppercase text-[#FF1493] mb-6 flex items-center gap-2 tracking-widest"><ShieldCheck size={16}/> Dados Pessoais</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input required type="text" placeholder="NOME ARTÍSTICO (Sem espaços)" className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs outline-none focus:border-[#FF1493] text-white" value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value.replace(/\s/g, '')})} />
                <input required type="text" placeholder="NOME COMPLETO" className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs outline-none focus:border-[#FF1493] text-white" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                <input required type="tel" placeholder="WHATSAPP" className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs outline-none focus:border-[#FF1493] text-white" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: formatPhone(e.target.value)})} />
                <input required type="email" placeholder="E-MAIL PESSOAL" className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs outline-none focus:border-[#FF1493] text-white" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                <input required type="text" placeholder="CPF" className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs outline-none focus:border-[#FF1493] text-white" value={formData.cpf} onChange={e => setFormData({...formData, cpf: formatCPF(e.target.value)})} />
                <input required type="text" placeholder="DATA DE NASCIMENTO" className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs outline-none focus:border-[#FF1493] text-white" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: formatDate(e.target.value)})} />
              </div>
              <h2 className="text-xs font-black uppercase text-emerald-400 mt-8 mb-6 flex items-center gap-2 tracking-widest"> Dados Bancários (Para Saque)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input required type="text" placeholder="CHAVE PIX PRINCIPAL" className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs outline-none focus:border-emerald-500 text-white" value={formData.pix1} onChange={e => setFormData({...formData, pix1: e.target.value})} />
                <input type="text" placeholder="CHAVE PIX SECUNDÁRIA (Opcional)" className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs outline-none focus:border-emerald-500 text-white" value={formData.pix2} onChange={e => setFormData({...formData, pix2: e.target.value})} />
              </div>
              <button type="button" onClick={() => setStep(2)} className="w-full bg-[#FF1493] text-white py-5 rounded-2xl text-[11px] font-black uppercase mt-8 shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">Próxima Etapa <ChevronRight size={16}/></button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in slide-in-from-right duration-300">
              <h2 className="text-xs font-black uppercase text-[#FFD700] mb-2 flex items-center gap-2 tracking-widest"><Sparkles size={16}/> Sua Roleta</h2>
              <p className="text-[9px] text-white/40 uppercase font-black tracking-widest mb-6">Escolha 6 prêmios que seus clientes irão ganhar.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {prizes.map((p, index) => (
                  <input key={index} type="text" required placeholder={`PRÊMIO ${index + 1}`} className="w-full bg-black border border-[#FFD700]/30 p-4 rounded-xl text-xs outline-none focus:border-[#FFD700] text-white" value={p} onChange={e => handlePrizeChange(index, e.target.value)} />
                ))}
              </div>
              <h2 className="text-xs font-black uppercase text-white/50 mb-4 tracking-widest">Foto de Fundo da Roleta</h2>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-[#FF1493]/50 hover:bg-[#FF1493]/5 transition-all relative overflow-hidden">
                {previewUrl ? <img src={previewUrl} className="absolute inset-0 w-full h-full object-cover opacity-50" /> : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-white/30"><Camera size={32} className="mb-2" /><p className="text-[10px] uppercase font-black tracking-widest">Tocar para enviar (JPG/PNG)</p></div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => setStep(1)} className="px-6 py-5 bg-white/5 text-white/50 rounded-2xl text-[10px] font-black uppercase hover:bg-white/10 transition-all">Voltar</button>
                <button type="submit" disabled={loading} className="flex-1 bg-[#FF1493] text-white py-5 rounded-2xl text-[11px] font-black uppercase shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all">
                  {loading ? <Loader2 className="animate-spin" size={16}/> : "Enviar Candidatura"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
