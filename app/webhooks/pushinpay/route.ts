import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const signature = req.headers.get('x-pushinpay-token');

    // Validação de segurança: verifica se o sinal veio mesmo da PushinPay
    if (signature !== process.env.PUSHINPAY_WEBHOOK_SECRET) {
      return new NextResponse('Não autorizado', { status: 401 });
    }

    // Quando o status é 'paid', o dinheiro entrou na sua conta PushinPay
    if (body.status === 'paid') {
      const userId = body.external_id; // ID do fã que enviamos na geração do PIX
      const amountPaid = body.value / 100; // Valor em reais

      console.log(`✅ Pagamento Confirmado: Usuário ${userId} pagou R$ ${amountPaid}`);

      // TODO: Aqui vamos conectar o seu banco de dados para 
      // somar os créditos automaticamente na conta do fã.
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    return NextResponse.json({ error: 'Erro no processamento' }, { status: 500 });
  }
}
