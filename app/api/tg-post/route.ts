import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { canal, mensagem, modelId } = await req.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let token = null;
    if (modelId) {
        const resConfig = await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}&select=tg_bot_token`, {
           headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` }
        });
        const dataConfig = await resConfig.json();
        token = dataConfig[0]?.tg_bot_token;
    }

    if (!token) token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error("Nenhum Token de Bot foi salvo no painel.");

    // 🔥 MÁGICA: Pergunta pro Telegram qual o username do Bot
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const meData = await meRes.json();
    if (!meData.ok) throw new Error("Token do Bot inválido.");
    const botUsername = meData.result.username;

    // Cria o link que manda o fã do grupo direto pro Privado do Bot
    const botLink = `https://t.me/${botUsername}`;

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
            // O botão manda o cara pro privado!
            { text: "🎰 ABRIR ROLETA VIP", url: botLink }
          ]]
        }
      }),
    });

    const data = await response.json();
    
    if (!data.ok) {
       let errorBr = data.description;
       if (errorBr.includes("chat not found")) errorBr = "Grupo não encontrado. Verifique se o bot está adicionado lá.";
       if (errorBr.includes("bot is not a member")) errorBr = "O bot não está no grupo. Adicione ele primeiro!";
       if (errorBr.includes("not enough rights") || errorBr.includes("can't write")) errorBr = "O bot precisa de permissão de Administrador no Grupo.";
       if (errorBr.includes("empty")) errorBr = "A mensagem não pode estar vazia.";
       throw new Error(errorBr);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
