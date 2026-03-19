import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { amount, userId } = await req.json();
    const val = Math.round(parseFloat(amount) * 100); // R$ 1,00 -> 100 centavos

    const payload = {
      value: val,
      webhook_url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/pushinpay`,
      external_id: String(userId),
    };

    const headers = {
      'Authorization': `Bearer ${process.env.PUSHINPAY_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // VAMOS TENTAR OS 3 ENDEREÇOS POSSÍVEIS
    const endpoints = [
      'https://api.pushinpay.com.br/api/pix/cash-in',
      'https://api.pushinpay.com.br/api/v1/pix/cash-in',
      'https://api.pushinpay.com.br/pix/cash-in'
    ];

    for (const url of endpoints) {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // Se não for 404, significa que achamos o endereço certo!
      if (response.status !== 404) {
        return NextResponse.json({ ...data, url_tentada: url }, { status: response.status });
      }
    }

    return NextResponse.json({ error: "Nenhum endpoint da PushinPay funcionou (Todos 404)" }, { status: 404 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
