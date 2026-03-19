import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Conectando ao seu banco de dados
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Idealmente usar a SERVICE_ROLE_KEY no futuro
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const signature = req.headers.get('x-pushinpay-token');

    // 1. Validação de Segurança
    if (signature !== process.env.PUSHINPAY_WEBHOOK_SECRET) {
      console.error("❌ Tentativa de fraude bloqueada. Token inválido.");
      return new NextResponse('Não autorizado', { status: 401 });
    }

    // 2. Quando o PIX é pago
    if (body.status === 'paid') {
      const userId = body.external_id; // O ID do fã que mandamos na hora de gerar
      const amountPaid = body.value / 100; // Valor em reais
      
      console.log(`✅ Pagamento Recebido! Fã: ${userId} | Valor: R$ ${amountPaid}`);

      // 3. Regra de Negócio (Quantos créditos ele ganha?)
      // Aqui depois vamos colocar: se pagou 15 ganha 20, se pagou 25 ganha 35...
      const creditosGanhos = amountPaid; // Por enquanto, 1 real = 1 crédito

      // 4. Injetando no Banco de Dados (Supabase)
      // Primeiro, buscamos o saldo atual do usuário
      const { data: userData, error: fetchError } = await supabase
        .from('profiles') // NOME DA SUA TABELA DE USUÁRIOS
        .select('creditos') // NOME DA COLUNA DE CRÉDITOS
        .eq('id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error("Erro ao buscar usuário no banco.");
      }

      const saldoAtual = userData?.creditos || 0;
      const novoSaldo = saldoAtual + creditosGanhos;

      // Atualiza com o novo saldo
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ creditos: novoSaldo })
        .eq('id', userId);

      if (updateError) {
        throw new Error("Erro ao adicionar créditos.");
      }

      console.log(`💰 Sucesso! Saldo atualizado para ${novoSaldo} créditos.`);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error("🚨 Erro no Webhook:", error.message);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
