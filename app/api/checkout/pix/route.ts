import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { amount, userId } = await req.json();

  // amount vem em reais (ex: 15), transformamos em centavos para a PushinPay
  const amountInCents = Math.round(amount * 100);

  const response = await fetch('https://api.pushinpay.com.br/api/pix/cash-in', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PUSHINPAY_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      value: amountInCents,
      webhook_url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/pushinpay`,
      external_id: userId, // Para sabermos de quem é o crédito depois
    }),
  });

  const data = await response.json();
  return NextResponse.json(data);
}
