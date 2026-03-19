import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { amount, userId } = await req.json();

    // Transformamos em centavos (ex: 1.00 virá 100)
    const amountInCents = Math.round(parseFloat(amount) * 100);

    // TENTATIVA 1: Adicionando /v1/ que é o padrão atual da PushinPay
    const response = await fetch('https://api.pushinpay.com.br/api/v1/pix/cash-in', {
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

    // Se a primeira tentativa falhar com 404, tentamos sem o /v1/ (Backup)
    if (response.status === 404) {
        const retryResponse = await fetch('https://api.pushinpay.com.br/api/pix/cash-in', {
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
        const retryData = await retryResponse.json();
        return NextResponse.json(retryData, { status: retryResponse.status });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
