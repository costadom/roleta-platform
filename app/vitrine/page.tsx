// ═══════════════════════════════════════════════════════════════════════════
// app/vitrine/page.tsx — OTIMIZADO
// ═══════════════════════════════════════════════════════════════════════════
//
// OTIMIZAÇÕES:
//
// 1. Promise.all para Models + Configs — eram 2 fetches sequenciais,
//    agora são 1 round-trip paralelo. Reduz o tempo de espera ~50%.
//
// 2. configMap com new Map() para lookup O(1) ao invés de .find() em loop.
//    Para 50 modelos, imperceptível, mas é boa prática de escala.
//
// 3. loading="lazy" nos <img> — já estava; mantido.
//
// 4. Ordenação de status (VIP > Online > Offline) — já estava; mantido.
//
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, User, Key, Radio } from "lucide-react";
import AuthModal from "@/components/AuthModal";

type ModelCard = {
  id: string;
  slug: string;
  live_status: string;
  config: { model_name: string; profile_url: string; bg_url: string; } | null;
  bio?: string;
};

export default function VitrinePage() {
  const router = useRouter();
  const [models, setModels] = useState<ModelCard[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    async function fetchData() {
      try {
        const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-cache" };

        setIsLoggedIn(localStorage.getItem("labz_player_logged") === "true");

        // ── Promise.all: Models e Configs em paralelo (era sequencial) ──
        const [modelsRes, configsRes] = await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/Models?select=id,slug,live_status,bio&order=created_at.desc&limit=50`, { headers }),
          fetch(`${supabaseUrl}/rest/v1/Configs?showcase_visible=eq.true&select=model_id,model_name,profile_url,bg_url`, { headers }),
        ]);

        if (modelsRes.ok && configsRes.ok) {
          const modelsData: any[] = await modelsRes.json();
          const configsData: any[] = await configsRes.json();

          // Map para lookup O(1) em vez de .find() em loop O(n²)
          const configMap = new Map(configsData.map((c: any) => [c.model_id, c]));

          let activeModels: ModelCard[] = modelsData
            .filter((m: any) => configMap.has(m.id))
            .map((m: any) => ({
              id: m.id,
              slug: m.slug,
              live_status: m.live_status || "offline",
              bio: m.bio,
              config: configMap.get(m.id),
            }));

          // Ordena: VIP > Online > Offline
          activeModels.sort((a, b) => {
            const weight = (s: string) => s === "vip" ? 2 : s === "online" ? 1 : 0;
            return weight(b.live_status) - weight(a.live_status);
          });

          setModels(activeModels);
        }
      } catch (err) {
        console.error("Falha ao buscar musas:", err);
      } finally {
        setInitialLoading(false);
      }
    }

    fetchData();
  }, [supabaseUrl, supabaseKey]);

  if (initialLoading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center">
      <Loader2 className="animate-spin text-[#D946EF] mb-6" size={50} />
      <h2 className="text-xl font-black uppercase italic tracking-tighter animate-pulse">Carregando Musas...</h2>
    </div>
  );

  // JSX 100% idêntico ao original
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans relative pb-20">
      <header className="fixed top-0 left-0 w-full h-20 bg-black/80 backdrop-blur-xl border-b border-white/5 z-[100] px-6 flex items-center justify-between shadow-xl">
        <div>
          <h1 className="text-xl font-black italic text-[#D946EF] tracking-tighter">SAVANAH <span className="text-white">LABZ</span></h1>
          <p className="text-[8px] text-white/30 uppercase font-black tracking-widest -mt-1">Escolha sua Musa</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/explore")} className="hidden sm:flex items-center gap-1.5 bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 px-4 py-2.5 rounded-full hover:bg-[#00f0ff] hover:text-black transition-all shadow-[0_0_10px_rgba(0,240,255,0.2)]">
            <Radio size={14} className="animate-pulse" />
            <span className="font-black text-[10px] uppercase tracking-widest">Lives Ao Vivo</span>
          </button>
          {!isLoggedIn ? (
            <button onClick={() => setShowAuthModal(true)} className="px-5 py-2.5 bg-white text-black rounded-full text-[10px] font-black uppercase flex items-center gap-2 hover:bg-[#D946EF] hover:text-white transition-all shadow-xl">
              <Key size={14} /> Login VIP
            </button>
          ) : (
            <button onClick={() => router.push("/hub")} className="px-5 py-2.5 bg-[#D946EF] text-white rounded-full text-[10px] font-black uppercase flex items-center gap-2 hover:bg-[#f062ff] transition-all shadow-[0_0_15px_rgba(217,70,239,0.3)]">
              <User size={14} /> Meu Perfil
            </button>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 mt-28">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black uppercase italic text-white tracking-tighter drop-shadow-lg">
            ESCOLHA SUA <span className="text-[#D946EF]">MUSA</span>
          </h2>
          <p className="text-[#FFD700] text-[10px] font-bold uppercase tracking-[0.3em] mt-2 flex items-center justify-center gap-2">
            <Sparkles size={12} /> HUB PRIVADO E ROLETA VIP <Sparkles size={12} />
          </p>
        </div>

        <div className="sm:hidden flex justify-center mb-8">
          <button onClick={() => router.push("/explore")} className="flex w-full items-center justify-center gap-2 bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 px-6 py-4 rounded-2xl hover:bg-[#00f0ff] hover:text-black transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <Radio size={18} className="animate-pulse" />
            <span className="font-black text-xs uppercase tracking-widest">Acessar Câmeras Ao Vivo</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {models.length > 0 ? models.map((m) => {
            const isOnline = m.live_status === "online" || m.live_status === "vip";
            return (
              <div key={m.id} className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden group border border-white/5 bg-[#0a0a0a] shadow-2xl cursor-pointer"
                onClick={() => { if (!isLoggedIn) return setShowAuthModal(true); router.push(`/profile/${m.slug}`); }}>
                <img src={m.config?.profile_url} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-1000 opacity-80 group-hover:opacity-100" alt={m.config?.model_name || m.slug} />
                {isOnline && (
                  <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
                    <span className={`w-2 h-2 rounded-full animate-pulse ${m.live_status === "vip" ? "bg-[#ff0055] shadow-[0_0_10px_rgba(255,0,85,0.8)]" : "bg-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.8)]"}`}></span>
                    <span className={`text-[8px] font-black uppercase tracking-widest ${m.live_status === "vip" ? "text-[#ff0055]" : "text-[#00f0ff]"}`}>{m.live_status === "vip" ? "VIP" : "Ao Vivo"}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col p-8 items-center justify-end text-center pointer-events-none">
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white drop-shadow-2xl mb-1">{m.config?.model_name}</h3>
                  <p className="text-white/70 text-xs italic mb-6 line-clamp-2 px-2">{m.bio || "Acesse meu Hub para ver meus conteúdos e roleta."}</p>
                  <button className="w-full flex items-center justify-center gap-3 py-4 bg-[#D946EF] rounded-2xl text-[10px] font-black uppercase shadow-2xl transition-all group-hover:scale-[1.03] group-active:scale-95 pointer-events-auto"
                    onClick={(evt) => { evt.stopPropagation(); if (!isLoggedIn) return setShowAuthModal(true); router.push(`/profile/${m.slug}`); }}>
                    <User size={16} /> Acessar Hub Privado
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="py-20 text-center text-white/10 italic font-black uppercase tracking-widest border-2 border-dashed border-white/5 rounded-[3rem] col-span-full">
              Nenhuma musa ativa na vitrine no momento.
            </div>
          )}
        </div>
      </div>

      <button onClick={() => { if (!isLoggedIn) return setShowAuthModal(true); router.push("/hub"); }}
        className="fixed bottom-6 right-6 z-[99] bg-[#D946EF] text-white p-4 rounded-full shadow-[0_10px_40px_rgba(217,70,239,0.5)] hover:scale-110 hover:bg-[#f062ff] transition-all flex items-center justify-center group border border-white/20">
        <User size={24} />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-3 transition-all duration-500 font-black uppercase text-xs tracking-widest">Meu Perfil VIP</span>
      </button>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// app/page.tsx — OTIMIZADO
// ═══════════════════════════════════════════════════════════════════════════
//
// OTIMIZAÇÃO: fetchBackgrounds() já era fire-and-forget (sem await no
// useEffect). A única melhoria real era a presença do "Prefer: count=exact"
// que não existia. O arquivo original já estava bem estruturado.
//
// Ajuste pontual aplicado:
// • Adicionado `select=bg_url,profile_url` com campos explícitos
//   (já estava) e `order=random()` removido para evitar full-scan.
// • Cache-Control: no-cache removido do background fetch — backgrounds
//   podem ser cacheados pelo browser sem problema (não mudam frequentemente).
// ═══════════════════════════════════════════════════════════════════════════

// app/page.tsx — substitua apenas o useEffect de fetchBackgrounds:
//
// useEffect(() => {
//   const logged = localStorage.getItem("labz_player_logged") === "true";
//   if (logged) { router.push('/vitrine'); return; }
//
//   async function fetchBackgrounds() {
//     try {
//       // SEM Cache-Control: no-cache — deixa o browser cachear as imagens
//       const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
//       const res = await fetch(`${supabaseUrl}/rest/v1/Configs?select=bg_url,profile_url&limit=8`, { headers });
//       if (res.ok) {
//         const data = await res.json();
//         if (data.length > 0) {
//           setModelsBgs(data.map((c: any) => c.bg_url || c.profile_url).filter(Boolean));
//         }
//       }
//     } catch (err) { console.error(err); }
//   }
//   fetchBackgrounds();
// }, [router, supabaseUrl, supabaseKey]);
