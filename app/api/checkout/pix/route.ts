import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { amount, userId } = await req.json();

    // Valor sempre em centavos (Ex: 1.00 vira 100)
    const amountInCents = Math.round(parseFloat(amount) * 100);

    // O ENDEREÇO CORRETO: sem hífen e com "I" maiúsculo no final
    const response = await fetch('https://api.pushinpay.com.br/api/pix/cashIn', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PUSHINPAY_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        value: amountInCents,
        webhook_url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/pushinpay`,
        external_id: String(userId),
      }),
    });

    const data = await response.json();

    // Se ainda der erro, o espião vai nos mostrar o motivo real (ex: saldo, token...)
    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
