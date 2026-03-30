import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Configuração do servidor ausente." }, { status: 500 });
  }

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json"
  };

  const safeFetch = async (endpoint: string, isCount = false) => {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
        headers: isCount ? { ...headers, "Prefer": "count=exact" } : headers,
        cache: 'no-store'
      });
      if (!res.ok) return null;
      if (isCount) return parseInt(res.headers.get("content-range")?.split("/")[1] || "0", 10);
      return await res.json();
    } catch (error) {
      console.error(`Erro na API ao buscar ${endpoint}:`, error);
      return null;
    }
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
      safeFetch('GlobalSettings?id=eq.main&select=*'),
      safeFetch('Models?select=id,slug,email,password,whatsapp,pix_key_1,pix_key_2,referred_by,created_at&order=created_at.asc'),
      safeFetch('Transactions?select=real_amount,platform_cut,model_cut,model_id&order=created_at.desc&limit=100'),
      safeFetch('Withdrawals?select=*&order=created_at.desc'),
      safeFetch('Applications?select=*'),
      safeFetch('Players?select=id&limit=1', true),
      safeFetch('AbandonedCarts?select=*&order=created_at.desc&limit=500'),
      safeFetch('VideoRequests?status=eq.pago&select=*,Models(slug,whatsapp,full_name)')
    ]);

    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).getTime();
    
    return NextResponse.json({
      globalSettings: globalSettings?.[0] || null,
      models: models || [],
      transactions: transactions || [],
      withdrawals: withdrawals || [],
      applications: (applications || []).filter((a: any) => !a.status || a.status.toLowerCase() === 'pendente'),
      totalPlayers: playersCount || 0,
      abandonedCarts: (abandonedCarts || []).filter((c: any) => {
        const isPendente = !c.status || c.status.toLowerCase() === 'pendente';
        const isOldEnough = new Date(c.created_at).getTime() < threeMinutesAgo;
        return isPendente && isOldEnough;
      }),
      videoRequests: videoRequests || []
    });

  } catch (error) {
    return NextResponse.json({ error: "Falha interna no servidor." }, { status: 500 });
  }
}
