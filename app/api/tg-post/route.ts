import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { canal, mensagem, linkRoleta, modelId } = await req.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // 1. Busca o Token da modelo no banco
    let token = null;
    if (modelId) {
        const resConfig = await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}&select=tg_bot_token`, {
           headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` }
        });
        const dataConfig = await resConfig.json();
        token = dataConfig[0]?.tg_bot_token;
    }

    // Se a modelo não cadastrou, usa o seu Bot global do .env
    if (!token) {
        token = process.env.TELEGRAM_BOT_TOKEN;
    }

    if (!token) throw new Error("Nenhum Token do Telegram configurado no sistema.");

    const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(tgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: canal,
        text: mensagem,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[
            { text: "🎰 ABRIR ROLETA VIP", web_app: { url: linkRoleta } }
          ]]
        }
      }),
    });

    const data = await response.json();
    if (!data.ok) throw new Error(data.description);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
