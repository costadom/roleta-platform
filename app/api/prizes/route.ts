import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  try {
    // Alterado para 'Prize' com P maiúsculo conforme está no seu Supabase
    const response = await fetch(
      `${supabaseUrl}/rest/v1/Prize?select=*&active=eq.true`,
      {
        headers: {
          apikey: supabaseKey!,
          Authorization: `Bearer ${supabaseKey}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`Erro Supabase: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Erro na API:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
