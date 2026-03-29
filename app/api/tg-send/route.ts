import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { telegramId, prizeName, deliveryValue, modelName, modelSlug } = body;

    // Se faltar a ID do Telegram ou o nome do prêmio, ele barra
    if (!telegramId || !prizeName) {
      return NextResponse.json({ error: "Faltam dados obrigatórios" }, { status: 400 });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "Token do Telegram não configurado." }, { status: 500 });
    }

    // A isca perfeita que vai chegar piscando no celular do cara
    const message = `🎰 *BINGO!* Você acabou de girar a Roleta VIP da *${modelName}*!\n\n` +
                    `🎁 *Seu Prêmio:* ${prizeName}\n\n` +
                    `🔗 *Acesse seu prêmio aqui:* ${deliveryValue}\n\n` +
                    `🔥 *Quer mais?*\n` +
                    `Você tem outras mídias exclusivas te esperando no Hub Privado. Acesse agora e divirta-se:\n` +
                    `👉 https://labzsexyroll.vercel.app/profile/${modelSlug}`;

    // URL oficial dos servidores do Telegram
    const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;

    // Mandando a ordem pro Telegram
    const response = await fetch(tgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramId,
        text: message,
        parse_mode: "Markdown",
        disable_web_page_preview: true // Pra mensagem ficar mais limpa e focada no texto
      }),
    });

    const data = await response.json();
    
    // Se o Telegram recusar, a gente avisa no console
    if (!data.ok) {
      throw new Error(data.description || "Erro desconhecido na API do Telegram");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro TG Bot:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
