"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Gamepad2, Gift, Coins, AlertCircle } from "lucide-react";

export default function TelegramMiniApp() {
  const { slug } = useParams();
  const [tgUser, setTgUser] = useState<any>(null);
  const [model, setModel] = useState<any>(null);
  const [player, setPlayer] = useState<any>(null);
  const [prizes, setPrizes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
        tg.expand(); // Faz o app ocupar a tela toda do celular
        const user = tg.initDataUnsafe?.user;
        
        // DICA: Se você quiser testar no seu Chrome fora do Telegram pra ver o design,
        // comente a linha 'const user...' acima e descomente a linha abaixo:
        // const user = { id: 999999999, first_name: "Teste", last_name: "Local" };
        
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
      
      // 1. Busca a Musa
      const resMod = await fetch(`${supabaseUrl}/rest/v1/Models?slug=eq.${slug}&select=id,Configs(model_name,bg_url)`, { headers });
      const modData = await resMod.json();
      if (!modData || !modData[0]) throw new Error("Musa não encontrada no sistema Labz.");
      const modelInfo = modData[0];
      setModel(modelInfo);

      // 2. Busca os Prêmios Reais dela (ignora os falsos e vazios)
      const resPrizes = await fetch(`${supabaseUrl}/rest/v1/Prize?model_id=eq.${modelInfo.id}&select=*`, { headers });
      const prizesData = await resPrizes.json();
      const validPrizes = prizesData.filter((p: any) => p.weight > 0 && p.delivery_value);
      setPrizes(validPrizes);

      // 3. Login Silencioso (Cria o cara no nosso banco Labz usando a ID do Telegram)
      const pseudoWhatsapp = `TG_${user.id}`;
      const resPlayer = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${pseudoWhatsapp}&select=*`, { headers });
      let playerData = await resPlayer.json();

      if (!playerData || playerData.length === 0) {
        // Bem-vindo! Cria a conta com 1 giro grátis pra ele viciar
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
      setErrorMsg(e.message || "Erro de conexão com a LabzSexy.");
    } finally {
      setLoading(false);
    }
  };

  const handleSpin = async () => {
    if (!tgUser || !model || !player) return;
    
    if (player.live_tokens <= 0) {
       (window as any).Telegram?.WebApp?.showAlert("Opa! Seu saldo acabou. Acesse o site oficial LabzSexy e compre pacotes de giro via PIX.");
       return;
    }
    if (prizes.length === 0) {
       alert("A Musa ainda não configurou os prêmios.");
       return;
    }

    setSpinning(true);
    const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=representation" };

    try {
        // 1. Morde 1 crédito do cara no banco
        const newTokens = player.live_tokens - 1;
        await fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${player.id}`, {
           method: "PATCH", headers, body: JSON.stringify({ live_tokens: newTokens })
        });
        setPlayer({ ...player, live_tokens: newTokens });

        // 2. A Mágica do Sorteio (A Roleta gira invisível)
        const totalWeight = prizes.reduce((acc, p) => acc + Number(p.weight), 0);
        let random = Math.random() * totalWeight;
        let selectedPrize = prizes[0];
        
        for (const prize of prizes) {
            if (random < Number(prize.weight)) { selectedPrize = prize; break; }
            random -= Number(prize.weight);
        }

        // 3. Deixa a pessoa ansiosa por 3 segundos
        setTimeout(async () => {
            try {
                // 4. Manda a API do BotFather entregar a foto/link no privado!
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

                // 5. Registra o histórico da sorte pra Musa ver no painel dela (Opcional, mas legal)
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
        }, 3500);

    } catch(e) {
        setSpinning(false);
        alert("Erro no servidor da Roleta.");
    }
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-[#D946EF] w-12 h-12" /></div>;
  if (errorMsg) return <div className="h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center"><AlertCircle size={40} className="text-red-500 mb-4"/><p className="font-bold">{errorMsg}</p></div>;

  return (
    <div className="h-screen bg-black text-white relative overflow-hidden flex flex-col items-center justify-center p-6 text-center">
      {/* O Fundo sexy da Musa */}
      <div className="absolute inset-0 z-0">
        <img src={model?.Configs?.[0]?.bg_url || "https://images.unsplash.com/photo-1516481157630-05bc0aeb8b19?w=800&q=80"} className="w-full h-full object-cover opacity-40 blur-sm scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-[#FF1493]/20 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[#FF1493]/50 shadow-[0_0_40px_rgba(217,70,239,0.4)]">
           <Gamepad2 size={48} className="text-[#FF1493]" />
        </div>
        
        <h1 className="text-4xl font-black uppercase italic mb-1 drop-shadow-lg">Roleta VIP</h1>
        <p className="text-[12px] text-[#00f0ff] font-black uppercase tracking-widest mb-6">@{model?.Configs?.[0]?.model_name || slug}</p>
        
        <div className="bg-black/60 backdrop-blur-xl border border-white/20 rounded-3xl p-5 mb-8 inline-flex items-center gap-4 shadow-2xl">
           <Coins size={28} className="text-[#FFD700]" />
           <div className="text-left">
              <p className="text-[10px] text-white/50 uppercase font-black tracking-widest">Saldo de Giros</p>
              <p className="text-2xl font-black">{player?.live_tokens || 0}</p>
           </div>
        </div>
        
        <button 
          onClick={handleSpin} 
          disabled={spinning || (player?.live_tokens <= 0)}
          className={`w-full py-6 rounded-3xl font-black uppercase text-xl transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(217,70,239,0.3)] ${spinning ? 'bg-[#111] text-[#D946EF] border border-[#D946EF]/50 animate-pulse' : player?.live_tokens <= 0 ? 'bg-white/10 text-white/30 cursor-not-allowed border border-white/5' : 'bg-gradient-to-b from-[#D946EF] to-[#9b29ab] text-white hover:scale-105 active:scale-95 border border-[#ff66ff]/50'}`}
        >
          {spinning ? (
            <>🎰 Sorteando Prêmios...</>
          ) : player?.live_tokens <= 0 ? (
            <>Sem Saldo</>
          ) : (
            <><Gift size={24} /> Girar a Sorte!</>
          )}
        </button>

        <p className="mt-8 text-[10px] text-white/50 font-medium px-4 leading-relaxed uppercase tracking-widest">
          {player?.live_tokens <= 0 
            ? "Acesse o site oficial da LabzSexy para recarregar o seu saldo via PIX." 
            : "O prêmio vai chegar em uma mensagem de notificação privada neste bot."}
        </p>
      </div>
    </div>
  );
}
