import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Faltam chaves do Supabase" }, { status: 500 });
  }

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  // O Servidor Node.js fazendo a busca (Ignora totalmente regras de CORS de navegador)
  const getDb = async (endpoint: string, isCount = false) => {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
        headers: isCount ? { ...headers, Prefer: 'count=exact' } : headers,
        cache: 'no-store'
      });
      if (!res.ok) return null;
      if (isCount) return parseInt(res.headers.get('content-range')?.split('/')[1] || '0', 10);
      return await res.json();
    } catch (e) {
      return null;
    }
  };

  try {
    // Como estamos no servidor, podemos usar Promise.all sem medo de bloqueio
    const [
      dataGlob, dataMod, dataTrans, dataWith, dataApp, dataPlayersCount, dataAbandon, dataVideos
    ] = await Promise.all([
      getDb('GlobalSettings?id=eq.main&select=*'),
      getDb('Models?select=id,slug,email,password,whatsapp,pix_key_1,pix_key_2,referred_by,created_at&order=created_at.asc'),
      getDb('Transactions?select=real_amount,platform_cut,model_cut,model_id&order=created_at.desc&limit=100'),
      getDb('Withdrawals?select=*&order=created_at.desc'),
      getDb('Applications?select=*'),
      getDb('Players?select=id&limit=1', true),
      getDb('AbandonedCarts?select=*&order=created_at.desc&limit=500'),
      getDb('VideoRequests?status=eq.pago&select=*,Models(slug,whatsapp,full_name)')
    ]);

    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).getTime();

    // Devolvemos um JSON único, limpo e super leve para a sua tela
    return NextResponse.json({
      globalSettings: dataGlob?.[0] || null,
      models: dataMod || [],
      transactions: dataTrans || [],
      withdrawals: dataWith || [],
      applications: (dataApp || []).filter((a: any) => !a.status || a.status.toLowerCase() === 'pendente'),
      totalPlayers: dataPlayersCount || 0,
      abandonedCarts: (dataAbandon || []).filter((c: any) => {
        const isPendente = !c.status || c.status.toLowerCase() === 'pendente';
        const isOldEnough = new Date(c.created_at).getTime() < threeMinutesAgo;
        return isPendente && isOldEnough;
      }),
      videoRequests: dataVideos || []
    });

  } catch (error) {
    console.error("Erro interno na API do Super Admin", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
