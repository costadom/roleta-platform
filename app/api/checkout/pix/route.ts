import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { amount, userId } = await req.json();
    
    if (!process.env.PUSHINPAY_TOKEN) {
      return NextResponse.json({ error: "O Token não foi encontrado nas variáveis da Vercel!" }, { status: 500 });
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);

    // O TRUQUE: Grudando o ID no endereço do Webhook
    const webhookUrl = `${process.env.NEXT_PUBLIC_URL}/api/webhooks/pushinpay?userId=${userId}`;

    const response = await fetch('https://api.pushinpay.com.br/api/pix/cashIn', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PUSHINPAY_TOKEN.trim()}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        value: amountInCents,
        webhook_url: webhookUrl,
        external_id: String(userId),
      }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
