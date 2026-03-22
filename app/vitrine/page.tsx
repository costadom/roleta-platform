"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowLeft, Heart } from "lucide-react";
import Link from "next/link";

export default function VitrinePage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  // A FECHADURA DE SEGURANÇA
  useEffect(() => {
    // Verifica se a chave de login existe no navegador do cliente
    const isLoggedIn = localStorage.getItem("labz_player_logged");
    
    if (!isLoggedIn) {
      // Se não estiver logado, atira-o imediatamente para a página inicial
      router.push("/");
    } else {
      // Se estiver logado, destranca a visualização da página
      setIsAuthorized(true);
    }
  }, [router]);

  // Enquanto valida a segurança, mantém o ecrã preto para evitar que a página "pisque"
  if (!isAuthorized) {
    return <div className="min-h-screen bg-black" />;
  }

  // --- O TEU CÓDIGO NORMAL DA VITRINE COMEÇA AQUI ---
  return (
    <div className="min-h-screen bg-black text-white relative font-sans overflow-x-hidden selection:bg-[#FF1493] selection:text-white">
      {/* Fundo padronizado */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(255,20,147,0.12)_0%,rgba(0,0,0,1)_100%)] z-0 pointer-events-none" />
      <div className="fixed top-0 w-full h-1/2 bg-gradient-to-b from-[#FF1493]/10 to-transparent z-0 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-auto px-6 py-10 min-h-screen flex flex-col">
        
        {/* Barra Superior / Navbar */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.push("/")} 
            className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-[#FF1493] hover:border-[#FF1493] hover:shadow-[0_0_15px_rgba(255,20,147,0.5)] transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">
            Vitrine <span className="text-[#FF1493]">VIP</span>
          </h1>
          
          <div className="w-10"></div> {/* Espaçador invisível para centralizar o título */}
        </div>

        {/* Título Central */}
        <div className="text-center mb-8">
          <p className="text-[11px] text-[#FFD700] uppercase font-black tracking-[0.2em] flex items-center justify-center gap-2 mb-2">
            <Sparkles size={12} className="text-[#FF1493] shrink-0" />
            <span>Escolha a sua Musa</span>
            <Sparkles size={12} className="text-[#FF1493] shrink-0" />
          </p>
          <p className="text-xs text-white/50 font-medium">Selecione uma modelo para aceder aos jogos exclusivos.</p>
        </div>

        {/* Grelha de Modelos (Aqui colocas o map do Supabase com as tuas modelos) */}
        <div className="grid grid-cols-2 gap-4 flex-1">
          
          {/* Exemplo de Card de Modelo 1 */}
          <div 
            onClick={() => router.push('/raphasavanah')}
            className="bg-[#141414] border border-white/10 rounded-3xl p-4 flex flex-col items-center justify-center h-48 hover:border-[#FF1493] hover:shadow-[0_0_20px_rgba(255,20,147,0.2)] transition-all cursor-pointer group relative overflow-hidden"
          >
            {/* Imagem/Avatar da Modelo */}
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full mb-4 overflow-hidden relative">
              {/* Substituir por tag img */}
              <div className="absolute inset-0 flex items-center justify-center text-white/20">Foto</div>
            </div>
            <span className="text-xs font-black uppercase text-white tracking-widest text-center group-hover:text-[#FF1493] transition-colors">
              Rapha Savanah
            </span>
          </div>

          {/* Exemplo de Card de Modelo 2 */}
          <div 
            onClick={() => router.push('/outramodelo')}
            className="bg-[#141414] border border-white/10 rounded-3xl p-4 flex flex-col items-center justify-center h-48 hover:border-[#FF1493] hover:shadow-[0_0_20px_rgba(255,20,147,0.2)] transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full mb-4 overflow-hidden relative">
              <div className="absolute inset-0 flex items-center justify-center text-white/20">Foto</div>
            </div>
            <span className="text-xs font-black uppercase text-white tracking-widest text-center group-hover:text-[#FF1493] transition-colors">
              Outra Musa
            </span>
          </div>
          
        </div>

        {/* Rodapé da Vitrine */}
        <div className="mt-8 pt-8 border-t border-white/10 flex justify-center pb-6">
          <p className="text-[9px] text-white/30 uppercase font-black tracking-widest flex items-center gap-1">
            Plataforma 100% Segura <ShieldCheck size={10} />
          </p>
        </div>

      </div>
    </div>
  );
}
