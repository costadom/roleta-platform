// app/tg-game/[slug]/page.tsx — OTIMIZADO
// ─────────────────────────────────────────────────────────────────────────────
// OTIMIZAÇÕES APLICADAS:
//
// initializeData():
//   ANTES (4 fetches sequenciais):
//     1. Models → espera → 2. Prize → espera → 3. Configs → espera → 4. Players
//
//   DEPOIS (2 rounds paralelos):
//     Round A: Models (precisa do id) — ainda sequencial, mas sozinho (~1 fetch)
//     Round B: Prize + Configs + Player lookup — em Promise.all (3 simultâneos)
//     Se Player não encontrado: fallback lookup ou criação (1 fetch extra)
//
//   Ganho: de 4 round-trips em série → ~2 rounds. Redução ~50% no tempo total.
//
// runSpin():
//   O PATCH de créditos + o fetch de envio TG eram em série.
//   Agora o PATCH é fire-and-forget (não bloqueia a animação da roleta).
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { User, Volume2, VolumeX, ShoppingCart, X, Copy, CheckCircle2, Gift, Sparkles, Loader2, Zap, LayoutGrid, Coins, DollarSign, CheckCircle, PackageCheck, Image, Video, Award, Trophy, MessageCircle, AlertCircle, Lock } from "lucide-react";
import confetti from "canvas-confetti";
import { RouletteWheel } from "@/components/RouletteWheel";
import { PrizeModal } from "@/components/PrizeModal";

const NAMES = ["Tiago", "Lucas", "Ana", "Felipe", "Mariana", "João", "Beatriz", "Ricardo", "Camila", "Larissa", "Bruno", "Thiago", "Fernanda", "Rafael", "Julia", "Diego", "Amanda", "Gabriel", "Vitor"];
const SPIN_DURATION = 5000;

export default function TelegramMiniApp() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug;

  const [tgUser, setTgUser] = useState<any>(null);
  const [model, setModel] = useState<any>(null);
  const [prizes, setPrizes] = useState<any[]>([]);
  const [bgUrl, setBgUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [modelName, setModelName] = useState("");
  const [player, setPlayer] = useState<any | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixPaid, setPixPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeCartId, setActiveCartId] = useState<string | null>(null);
  const [pixTimeLeft, setPixTimeLeft] = useState(600);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [superMsg, setSuperMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [clickCount, setClickCount] = useState(0);
  const [linkWa, setLinkWa] = useState("");
  const [linkPwd, setLinkPwd] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState("");

  const spinAudioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const baseHeaders = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
        const user = tg.initDataUnsafe?.user;
        if (user) {
          setTgUser(user);
          initializeData(user);
        } else {
          setErrorMsg("Abra este link pelo botão do Bot no Telegram!");
          setLoading(false);
        }
      }
    };

    if (typeof window !== "undefined") {
      spinAudioRef.current = new Audio("/sounds/spin.mp3");
      winAudioRef.current = new Audio("/sounds/gemido.mp3");
    }
  }, [slug]);

  async function initializeData(user: any) {
    if (!slug || !supabaseUrl) return;

    try {
      // ── Round A: busca o model (precisa do id para os demais) ──
      const resMod = await fetch(`${supabaseUrl}/rest/v1/Models?slug=eq.${slug}&select=id`, { headers: baseHeaders }).catch(() => null);
      if (!resMod || !resMod.ok) throw new Error("Musa não encontrada.");
      const dataMod = await resMod.json();
      const mId = dataMod[0]?.id;
      if (!mId) throw new Error("Musa não encontrada.");

      // ── Round B: Prize + Configs + Player lookup em paralelo ──
      const pseudoWhatsapp = `TG_${user.id}`;
      const [prizesRes, resConfig, playerByTgRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/Prize?model_id=eq.${mId}&select=*&order=created_at.asc`, { headers: baseHeaders }).catch(() => null),
        fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${mId}&select=*`, { headers: baseHeaders }).then(r => r.json()).catch(() => []),
        fetch(`${supabaseUrl}/rest/v1/Players?telegram_id=eq.${user.id}&model_id=eq.${mId}&select=*`, { headers: baseHeaders }),
      ]);

      // Processa prizes
      const prizesData = prizesRes && prizesRes.ok ? await prizesRes.json() : [];
      const fetchedPrizes = Array.isArray(prizesData) ? prizesData : [];
      fetchedPrizes.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
        const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
        return dateA - dateB;
      });
      setPrizes(fetchedPrizes);

      // Processa config
      if (resConfig?.[0]) {
        setBgUrl(resConfig[0].bg_url || "");
        setModelName(resConfig[0].model_name || slug.toString().toUpperCase());
        setModel({ id: mId, ...resConfig[0] });
      }

      // Processa player
      let playerData = await playerByTgRes.json();

      // Fallback: pseudo-whatsapp
      if (!playerData || playerData.length === 0) {
        const fallbackRes = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${pseudoWhatsapp}&model_id=eq.${mId}&select=*`, { headers: baseHeaders });
        playerData = await fallbackRes.json();
      }

      // Cria player se não existir
      if (!playerData || playerData.length === 0) {
        const newPlayerPayload = {
          whatsapp: pseudoWhatsapp,
          telegram_id: user.id.toString(),
          name: user.first_name || "Visitante TG",
          nickname: user.first_name || "VIP",
          full_name: `${user.first_name} ${user.last_name || ''}`.trim() || "Usuário Telegram",
          email: `${user.id}@tg.labzsexy.com`,
          password: `${user.id}TgAuth!`,
          credits: 3,
          model_id: mId
        };

        const createRes = await fetch(`${supabaseUrl}/rest/v1/Players`, {
          method: "POST",
          headers: { ...baseHeaders, "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify(newPlayerPayload)
        });
        const createdData = await createRes.json();
        if (createdData && Array.isArray(createdData) && createdData.length > 0) {
          playerData = createdData;
        } else {
          throw new Error("Erro Crítico ao criar jogador.");
        }
      }

      setPlayer(playerData[0]);
    } catch (e: any) {
      setErrorMsg(e.message || "Erro de conexão com o Labz.");
    } finally {
      setLoading(false);
    }
  }

  const handleLinkAccount = async () => {
    if (!linkWa || !linkPwd || linkWa.length < 10) return alert("Preencha seu WhatsApp com DDD e crie uma senha.");
    setIsLinking(true);
    try {
      const headers = { ...baseHeaders, "Content-Type": "application/json", Prefer: "return=representation" };
      const cleanWa = linkWa.replace(/\D/g, "");
      const checkRes = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${cleanWa}&model_id=eq.${model.id}&select=*`, { headers: baseHeaders });
      const realAccountData = await checkRes.json();

      if (realAccountData && realAccountData.length > 0) {
        const realAccount = realAccountData[0];
        const mergedCredits = realAccount.credits + player.credits;
        // PATCH + DELETE em paralelo
        await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${realAccount.id}`, { method: "PATCH", headers, body: JSON.stringify({ credits: mergedCredits, telegram_id: tgUser.id.toString() }) }),
          fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${player.id}`, { method: "DELETE", headers: baseHeaders }),
        ]);
        setPlayer({ ...realAccount, credits: mergedCredits, telegram_id: tgUser.id.toString() });
        setLinkSuccess("Contas fundidas com sucesso! Seu saldo foi somado.");
      } else {
        const updateRes = await fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${player.id}`, {
          method: "PATCH", headers,
          body: JSON.stringify({ whatsapp: cleanWa, password: linkPwd, telegram_id: tgUser.id.toString() })
        });
        const updatedData = await updateRes.json();
        if (updatedData && updatedData[0]) {
          setPlayer(updatedData[0]);
          setLinkSuccess("Conta oficial criada! Acesse pelo site quando quiser.");
        }
      }
    } catch (e) {
      alert("Erro ao vincular conta.");
    }
    setIsLinking(false);
  };

  useEffect(() => {
    let interval: any;
    if (pixData && !pixPaid && player) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${player.id}&select=credits`, { headers: baseHeaders }).catch(() => null);
          if (!res || !res.ok) return;
          const data = await res.json();
          if (data[0]?.credits > player.credits) {
            setPixPaid(true);
            setPlayer({ ...player, credits: data[0].credits });
            if (activeCartId) {
              fetch(`${supabaseUrl}/rest/v1/AbandonedCarts?id=eq.${activeCartId}`, {
                method: 'PATCH',
                headers: { ...baseHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'pago' })
              }).catch(() => null);
            }
            clearInterval(interval);
          }
        } catch(err) {}
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [pixData, pixPaid, player, activeCartId]);

  useEffect(() => {
    let timer: any;
    if (pixData && !pixPaid && pixTimeLeft > 0) {
      timer = setInterval(() => setPixTimeLeft(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [pixData, pixPaid, pixTimeLeft]);

  const formatTime = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  const handleGeneratePix = async (val: number) => {
    if (!player) {
      if ((window as any).Telegram?.WebApp) (window as any).Telegram.WebApp.showAlert("Erro: Identificação perdida. Feche a roleta e abra de novo.");
      else alert("Erro: Identificação perdida.");
      return;
    }
    setPixLoading(true);
    setPixData(null);
    setPixPaid(false);
    setActiveCartId(null);
    setPixTimeLeft(600);

    // Carrinho + PIX em paralelo
    const [cartRes, pixRes] = await Promise.allSettled([
      fetch(`${supabaseUrl}/rest/v1/AbandonedCarts`, {
        method: 'POST',
        headers: { ...baseHeaders, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify({ player_name: player.nickname || player.full_name || "Cliente TG", player_phone: player.whatsapp, model_name: modelName || slug, amount: val, status: 'pendente' })
      }),
      fetch('/api/checkout/pix', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: val, userId: player.id }),
      }),
    ]);

    try {
      if (cartRes.status === 'fulfilled' && cartRes.value.ok) {
        const cartData = await cartRes.value.json();
        if (cartData?.[0]) setActiveCartId(cartData[0].id);
      }
      if (pixRes.status === 'fulfilled' && pixRes.value.ok) {
        const data = await pixRes.value.json();
        if (data.qr_code_base64) setPixData(data);
      } else {
        alert("Falha ao gerar o PIX.");
      }
    } catch (e) { alert("Falha ao gerar o PIX."); } finally { setPixLoading(false); }
  };

  const handleDevHack = () => {
    setClickCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        const newTokens = player.credits + 50;
        setPlayer({ ...player, credits: newTokens });
        fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${player.id}`, {
          method: "PATCH", headers: { ...baseHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({ credits: newTokens })
        });
        if ((window as any).Telegram?.WebApp) (window as any).Telegram.WebApp.showAlert("🤖 MODO DEV: 50 Giros adicionados com sucesso!");
        return 0;
      }
      return next;
    });
    setTimeout(() => setClickCount(0), 2000);
  };

  const runSpin = async (cost: number = 3) => {
    if (isSpinning || prizes.length === 0 || !player) return;
    if (player.credits < cost) { setShowDeposit(true); return; }

    setIsSpinning(true);
    if (soundEnabled) spinAudioRef.current?.play().catch(() => {});
    if (cost === 6) setSuperMsg("🔥 Isso amor! Com o Super Giro suas chances são GIGANTES! Vem ganhar... 🍀💖");

    const validOptions: any[] = [];
    let totalWeight = 0;
    prizes.forEach((p, i) => {
      const n = String(p.name).toUpperCase();
      if (!n.includes("PIX") && !n.includes("PRESENCIAL") && !n.includes("100") && !n.includes("R$")) {
        const w = parseFloat(p.weight) || 1;
        validOptions.push({ index: i, weight: w });
        totalWeight += w;
      }
    });

    let targetIndex = 0;
    if (validOptions.length > 0) {
      let random = Math.random() * totalWeight;
      for (let opt of validOptions) {
        if (random < opt.weight) { targetIndex = opt.index; break; }
        random -= opt.weight;
      }
    }

    const newBal = player.credits - cost;
    setPlayer({ ...player, credits: newBal });

    const sliceAngle = 360 / prizes.length;
    const stopAngle = (360 - (targetIndex * sliceAngle)) % 360;
    const currentSpins = Math.floor(rotation / 360);
    const finalRotation = ((currentSpins + 10) * 360) + stopAngle;
    setRotation(finalRotation);

    // PATCH de créditos fire-and-forget (não bloqueia a animação)
    fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${player.id}`, {
      method: "PATCH",
      headers: { ...baseHeaders, "Content-Type": "application/json", 'Prefer': 'return=representation' },
      body: JSON.stringify({ credits: newBal })
    }).catch(() => {});

    setTimeout(async () => {
      setIsSpinning(false);
      setSuperMsg("");
      const won = prizes[targetIndex];
      setSelectedPrize(won);
      setModalOpen(true);

      if (soundEnabled) winAudioRef.current?.play().catch(() => {});
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, zIndex: 9999 });

      try {
        if (!String(won.name).toUpperCase().includes("TENTE")) {
          await fetch("/api/tg-send", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ telegramId: tgUser.id, prizeName: won.name, deliveryValue: won.delivery_value || `Chame a musa e fale: Ganhei o ${won.name}`, modelName: modelName || slug, modelSlug: slug })
          });
          setTimeout(() => {
            if ((window as any).Telegram?.WebApp) (window as any).Telegram.WebApp.showAlert(`🎉 O prêmio "${won.name}" foi enviado para o seu chat privado com o Bot!`);
          }, 1500);
        }
      } catch (e) { console.error("Erro TG"); }
    }, SPIN_DURATION);
  };

  if (loading) return <div className="h-[100dvh] w-full bg-black flex items-center justify-center text-[#D946EF] font-black uppercase text-[10px] animate-pulse">Carregando Telegram App...</div>;
  if (errorMsg) return <div className="h-[100dvh] w-full bg-black text-white flex flex-col items-center justify-center p-6 text-center"><AlertCircle size={40} className="text-red-500 mb-4"/><p className="font-bold text-sm">{errorMsg}</p></div>;

  // JSX 100% idêntico ao original — cole o return do seu arquivo aqui
  return (
    <div className="h-[100dvh] w-full bg-[#0a0a0a] flex items-start justify-center font-sans overflow-hidden">
      {/* ... todo o JSX original sem alterações ... */}
      <style jsx global>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: flex; animation: marquee 35s linear infinite; width: fit-content; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D946EF; }
      `}</style>
    </div>
  );
}
