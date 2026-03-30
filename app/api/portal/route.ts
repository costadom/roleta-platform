import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ ok: false, error: "Chaves ausentes no servidor." }, { status: 500 });
  }

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json"
  };

  const fetchFromDb = async (endpoint: string, isCount = false) => {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
        headers: isCount ? { ...headers, Prefer: 'count=exact' } : headers,
        cache: 'no-store'
      });
      if (!res.ok) return null;
      if (isCount) return parseInt(res.headers.get('content-range')?.split('/')[1] || '0', 10);
      return await res.json();
    } catch (e) { return null; }
  };

  try {
    const [
      globalSettings,
      models,
      transactions,
      withdrawals,
      applications,
      playersCount,
      abandonedCarts,
      videoRequests
    ] = await Promise.all([
      fetchFromDb('GlobalSettings?id=eq.main&select=*'),
      fetchFromDb('Models?select=id,slug,email,password,whatsapp,pix_key_1,pix_key_2,referred_by,created_at&order=created_at.asc'),
      fetchFromDb('Transactions?select=real_amount,platform_cut,model_cut,model_id&order=created_at.desc&limit=100'),
      fetchFromDb('Withdrawals?select=*&order=created_at.desc'),
      fetchFromDb('Applications?select=*'),
      fetchFromDb('Players?select=id&limit=1', true),
      fetchFromDb('AbandonedCarts?select=*&order=created_at.desc&limit=500'),
      fetchFromDb('VideoRequests?status=eq.pago&select=*,Models(slug,whatsapp,full_name)')
    ]);

    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();

    return NextResponse.json({
      ok: true,
      data: {
        global: globalSettings?.[0] || null,
        models: models || [],
        transactions: transactions || [],
        withdrawals: withdrawals || [],
        applications: (applications || []).filter((a: any) => !a.status || a.status.toLowerCase() === 'pendente'),
        totalPlayers: playersCount || 0,
        abandoned: (abandonedCarts || []).filter((c: any) => {
          const isPendente = !c.status || c.status.toLowerCase() === 'pendente';
          return isPendente && c.created_at < threeMinutesAgo;
        }),
        videoRequests: videoRequests || []
      }
    });

  } catch (error: any) {
    return NextResponse.json({ ok: false, error: "Erro interno no servidor." }, { status: 500 });
  }
}

// 🔥 POST EXPORTADO CORRETAMENTE 🔥
export async function POST(request: Request) {
  return NextResponse.json({ ok: true, message: "API Pronta para receber comandos." });
}
