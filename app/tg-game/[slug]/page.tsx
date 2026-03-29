"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { Loader2, Gamepad2, Gift, Coins, AlertCircle, ArrowDown } from "lucide-react";

export default function TelegramMiniApp() {
  const { slug } = useParams();
  const [tgUser, setTgUser] = useState<any>(null);
  const [model, setModel] = useState<any>(null);
  const [player, setPlayer] = useState<any>(null);
  const [prizes, setPrizes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados da Roleta Visual
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Hack de Teste
  const [clickCount, setClickCount] = useState(0);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    // 1. Injeta o motor do Telegram Mini App
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand(); // Faz o app ocupar a tela toda
        
        const user = tg.initDataUnsafe?.user;
        
        // 🔥 DESCOMENTE A LINHA ABAIXO PARA TESTAR NO COMPUTADOR FORA DO TELEGRAM 🔥
        // const user = { id: 123456789, first_name: "Rafael", last_name: "Teste" };
        
        if (user) {
          setTgUser(user);
          loadData(user);
        } else {
          setErrorMsg("Oops! Abra este link pelo botão do Bot no Telegram!");
          setLoading(false);
        }
      }
    };
  }, [slug]);

  const loadData = async (user: any) => {
    try {
      const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" };
      
      const resMod = await fetch(`${supabaseUrl}/rest/v1/Models?slug=eq.${slug}&select=id,Configs(model_name,bg_url)`, { headers });
      const modData = await resMod.json();
      if (!modData || !modData[0]) throw new Error("Musa não encontrada.");
      const modelInfo = modData[0];
      setModel(modelInfo);

      const resPrizes = await fetch(`${supabaseUrl}/rest/v1/Prize?model_id=eq.${modelInfo.id}&select=*`, { headers });
      const prizesData = await resPrizes.json();
      const validPrizes = prizesData.filter((p: any) => p.weight > 0 && p.delivery_value);
      setPrizes(validPrizes);

      const pseudoWhatsapp = `TG_${user.id}`;
      const resPlayer = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${pseudoWhatsapp}&select=*`, { headers });
      let playerData = await resPlayer.json();

      if (!playerData || playerData.length === 0) {
        const newPlayerPayload = {
          whatsapp: pseudoWhatsapp,
          nickname: user.first_name,
          full_name: `${user.first_name} ${user.last_name || ''}`.trim(),
          password: `${user.id}TgAuth!`,
          live_tokens: 1, 
          model_id: modelInfo.id
        };
        const createRes = await fetch(`${supabaseUrl}/rest/v1/Players`, { method: "POST", headers: { ...headers, Prefer: "return=representation" }, body: JSON.stringify(newPlayerPayload) });
        playerData = await createRes.json();
      }
      setPlayer(playerData[0]);

    } catch (e: any) {
      setErrorMsg(e.message || "Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 O SEGREDO DO DESENVOLVEDOR (Adicionar Créditos) 🔥
  const handleDevHack = async () => {
      const newCount = clickCount + 1;
      setClickCount(newCount);
      
      if (newCount === 5) {
          const newTokens = player.live_tokens + 50;
          await fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${player.id}`, {
             method: "PATCH", 
             headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, 
             body: JSON.stringify({ live_tokens: newTokens })
          });
          setPlayer({ ...player, live_tokens: newTokens });
          alert("MODO DEV ATIVADO! 50 Giros adicionados com sucesso.");
          setClickCount(0);
      }
      // Reseta os cliques depois de um tempo
      setTimeout(() => setClickCount(0), 3000);
  };

  // 🔥 CONSTRÓI O VISUAL DA ROLETA (CONIC GRADIENT) 🔥
  const wheelBackground = useMemo(() => {
      if (prizes.length === 0) return "transparent";
      const sliceAngle = 360 / prizes.length;
      const gradientParts = prizes.map((p, i) => {
          const start = i * sliceAngle;
          const end = start + sliceAngle;
          return `${p.color || '#D946EF'} ${start}deg ${end}deg`;
      });
      return `conic-gradient(${gradientParts.join(", ")})`;
  }, [prizes]);

  const handleSpin = async () => {
    if (!tgUser || !model || !player || spinning) return;
    
    if (player.live_tokens <= 0) {
       (window as any).Telegram?.WebApp?.showAlert("Opa! Seu saldo acabou. Acesse o site oficial LabzSexy e compre pacotes de giro via PIX.");
       return;
    }
    if (prizes.length === 0) return alert("Roleta sem prêmios configurados.");

    setSpinning(true);
    const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=representation" };

    try {
        const newTokens = player.live_tokens - 1;
        await fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${player.id}`, {
           method: "PATCH", headers, body: JSON.stringify({ live_tokens: newTokens })
        });
        setPlayer({ ...player, live_tokens: newTokens });

        // Calcula quem ganhou
        const totalWeight = prizes.reduce((acc, p) => acc + Number(p.weight), 0);
        let random = Math.random() * totalWeight;
        let selectedIndex = 0;
        
        for (let i = 0; i < prizes.length; i++) {
            if (random < Number(prizes[i].weight)) { selectedIndex = i; break; }
            random -= Number(prizes[i].weight);
        }

        const selectedPrize = prizes[selectedIndex];
        
        // Calcula onde a roleta tem que parar (Animação)
        const sliceAngle = 360 / prizes.length;
        // O ponteiro fica no topo (0 graus). Precisamos girar para trás para alinhar o centro da fatia.
        const targetRotation = 360 - (selectedIndex * sliceAngle + (sliceAngle / 2));
        // Adiciona 5 voltas completas para dar emoção
        const newRotation = rotation + (360 * 5) + (targetRotation - (rotation % 360));
        
        setRotation(newRotation);

        // Aguarda a roleta parar visualmente (4 segundos)
        setTimeout(async () => {
            try {
                // Manda a mensagem pro Telegram
                await fetch("/api/tg-send", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        telegramId: tgUser.id,
                        prizeName: selectedPrize.name,
                        deliveryValue: selectedPrize.delivery_value,
                        modelName: model.Configs?.[0]?.model_name || slug,
                        modelSlug: slug
                    })
                });

                // Salva no histórico da musa
                await fetch(`${supabaseUrl}/rest/v1/SpinHistory`, {
                    method: "POST", headers,
                    body: JSON.stringify({
                        model_id: model.id,
                        player_id: player.id,
                        prize_id: selectedPrize.id,
                        prize_name: selectedPrize.name
                    })
                });

                setSpinning(false);
                (window as any).Telegram?.WebApp?.showAlert(`🎉 BINGO! VOCÊ TIROU: ${selectedPrize.name}!\n\nCorra nas suas mensagens privadas com o Bot, acabei de te mandar lá!`);
            } catch (e) {
                setSpinning(false);
                alert("Ocorreu um erro ao entregar seu prêmio. Chame o suporte.");
            }
        }, 4000);

    } catch(e) {
        setSpinning(false);
        alert("Erro no servidor da Roleta.");
    }
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-[#D946EF] w-12 h-12" /></div>;
  if (errorMsg) return <div className="h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center"><AlertCircle size={40} className="text-red-500 mb-4"/><p className="font-bold">{errorMsg}</p></div>;

  return (
    <div className="h-[100dvh] bg-black text-white relative overflow-hidden flex flex-col items-center justify-start pt-10 px-4 text-center w-full">
      {/* O Fundo sexy da Musa */}
      <div className="absolute inset-0 z-0">
        <img src={model?.Configs?.[0]?.bg_url || "https://images.unsplash.com/photo-1516481157630-05bc0aeb8b19?w=800&q=80"} className="w-full h-full object-cover opacity-30 blur-md scale-110" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/80 to-black"></div>
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center h-full">
        
        <h1 className="text-4xl font-black uppercase italic mb-1 drop-shadow-2xl">Roleta VIP</h1>
        <p className="text-[12px] text-[#00f0ff] font-black uppercase tracking-widest mb-6">@{model?.Configs?.[0]?.model_name || slug}</p>
        
        {/* 🔥 A ROLETA VISUAL 🔥 */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-4">
            {/* O Ponteiro */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 drop-shadow-2xl">
                <ArrowDown size={40} className="text-white fill-white" />
            </div>

            {/* A Roda Giratória */}
            <div 
                className="w-full h-full rounded-full border-4 border-white shadow-[0_0_50px_rgba(217,70,239,0.4)] overflow-hidden relative"
                style={{ 
                    background: wheelBackground,
                    transform: `rotate(${rotation}deg)`,
                    transition: spinning ? 'transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
                }}
            >
                {/* Opcional: Textos ou ícones dentro das fatias poderiam ir aqui. 
                    Por simplicidade no Telegram, o design de torta com cores fortes converte super bem. */}
                <div className="absolute inset-0 rounded-full border-8 border-black/10 inset-shadow"></div>
                
                {/* Centro da Roleta */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-black rounded-full border-2 border-white/20 flex items-center justify-center shadow-inner z-20">
                    <Gift size={24} className="text-[#D946EF]" />
                </div>
            </div>
        </div>
        
        <div className="mt-auto mb-6 w-full">
            <div className="bg-black/60 backdrop-blur-xl border border-white/20 rounded-3xl p-4 mb-4 inline-flex items-center justify-center w-full max-w-[200px] gap-4 shadow-2xl">
               <Coins size={28} className="text-[#FFD700]" />
               <div className="text-left select-none cursor-pointer" onClick={handleDevHack}>
                  <p className="text-[10px] text-white/50 uppercase font-black tracking-widest">Saldo de Giros</p>
                  <p className="text-2xl font-black leading-none mt-1">{player?.live_tokens || 0}</p>
               </div>
            </div>
            
            <button 
              onClick={handleSpin} 
              disabled={spinning || (player?.live_tokens <= 0)}
              className={`w-full py-5 rounded-[2rem] font-black uppercase text-xl transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(217,70,239,0.3)] ${spinning ? 'bg-[#111] text-[#D946EF] border border-[#D946EF]/50 animate-pulse' : player?.live_tokens <= 0 ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10' : 'bg-gradient-to-b from-[#D946EF] to-[#9b29ab] text-white hover:scale-105 active:scale-95 border border-[#ff66ff]/50'}`}
            >
              {spinning ? (
                <>🎰 Sorteando...</>
              ) : player?.live_tokens <= 0 ? (
                <>Sem Saldo</>
              ) : (
                <><Gamepad2 size={24} /> Girar Agora</>
              )}
            </button>
            
            <p className="mt-4 text-[9px] text-white/50 font-bold px-4 leading-relaxed uppercase tracking-widest h-8">
              {player?.live_tokens <= 0 
                ? "Feche e acesse a LabzSexy para recarregar." 
                : "O prêmio chegará neste Bot."}
            </p>
        </div>
      </div>
    </div>
  );
}
