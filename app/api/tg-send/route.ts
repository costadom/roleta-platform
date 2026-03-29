import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { telegramId, prizeName, deliveryValue, modelName, modelSlug } = body;

    if (!telegramId || !prizeName || !modelSlug) {
      return NextResponse.json({ error: "Faltam dados obrigatórios" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // 1. Busca o Token exclusivo da modelo no banco
    let token = null;
    try {
        const resMod = await fetch(`${supabaseUrl}/rest/v1/Models?slug=eq.${modelSlug}&select=id,Configs(tg_bot_token)`, {
            headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` }
        });
        const dataMod = await resMod.json();
        
        // Pega o token dela. Se não existir, usa o seu global do .env como backup
        token = dataMod[0]?.Configs?.[0]?.tg_bot_token || process.env.TELEGRAM_BOT_TOKEN;
    } catch (e) {
        token = process.env.TELEGRAM_BOT_TOKEN;
    }

    if (!token) {
      return NextResponse.json({ error: "Token do Telegram não configurado." }, { status: 500 });
    }

    const message = `🎰 *BINGO!* Você acabou de girar a Roleta VIP da *${modelName}*!\n\n` +
                    `🎁 *Seu Prêmio:* ${prizeName}\n\n` +
                    `🔗 *Acesse seu prêmio aqui:* ${deliveryValue}\n\n` +
                    `🔥 *Quer mais?*\n` +
                    `Você tem outras mídias exclusivas te esperando no Hub Privado. Acesse agora e divirta-se:\n` +
                    `👉 https://labzsexyroll.vercel.app/profile/${modelSlug}`;

    const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;

    const response = await fetch(tgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramId,
        text: message,
        parse_mode: "Markdown",
        disable_web_page_preview: true
      }),
    });

    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(data.description || "Erro na API do Telegram");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro TG Bot:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
