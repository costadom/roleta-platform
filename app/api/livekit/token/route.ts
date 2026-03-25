import { AccessToken } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const room = searchParams.get('room');
    const username = searchParams.get('username');
    const isModel = searchParams.get('isModel') === 'true';

    if (!room || !username) {
      return NextResponse.json({ error: 'Faltam parâmetros (room ou username)' }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Chaves do LiveKit não configuradas no servidor' }, { status: 500 });
    }

    // Cria o crachá de acesso
    const at = new AccessToken(apiKey, apiSecret, {
      identity: username,
      name: username,
    });

    // Define as permissões: A modelo pode transmitir vídeo/áudio. O cliente na sala grátis só assiste.
    at.addGrant({ 
      roomJoin: true, 
      room: room,
      canPublish: isModel, 
      canPublishData: true, // Permite enviar mensagens no chat
      canSubscribe: true 
    });

    // Retorna o token gerado
    return NextResponse.json({ token: await at.toJwt() });
    
  } catch (error: any) {
    console.error("Erro ao gerar token LiveKit:", error);
    return NextResponse.json({ error: 'Erro interno ao gerar token' }, { status: 500 });
  }
}