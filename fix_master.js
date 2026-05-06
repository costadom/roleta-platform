const fs = require('fs');

let pageCode = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

const startStr = "const loadActivityFeed = async";
const endStr = "const handleSaveTgToken = async";
const startIndex = pageCode.indexOf(startStr);
const endIndex = pageCode.indexOf(endStr);

if(startIndex !== -1 && endIndex !== -1) {
    const replacement = `const loadActivityFeed = async (medias: any[], scratches: any[], followers: any[]) => {
      try {
          const headers = { apikey: supabaseKey!, Authorization: \`Bearer \${supabaseKey}\` };
          const recentMedias = medias.slice(0, 15);
          const recentScratches = scratches.slice(0, 15);
          const allMediaItems = [...recentMedias, ...recentScratches];
          const mediaIds = allMediaItems.map(m => m.id || m.photo_url).filter(Boolean);

          let likesList: any[] = []; let commentsList: any[] = [];

          if (mediaIds.length > 0) {
              // CORREÇÃO DO ERRO 400: Adicionando aspas duplas nos UUIDs para o Supabase aceitar
              const mediaIdsStr = mediaIds.map(id => \`"\${id}"\`).join(',');
              
              const [likesRes, commentsRes] = await Promise.all([
                  fetch(\`\${supabaseUrl}/rest/v1/Likes?media_id=in.(\${mediaIdsStr})&order=created_at.desc&limit=20\`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
                  fetch(\`\${supabaseUrl}/rest/v1/Comments?media_id=in.(\${mediaIdsStr})&order=created_at.desc&limit=20\`, { headers }).then(r => r.ok ? r.json() : []).catch(() => [])
              ]);

              const safeLikes = Array.isArray(likesRes) ? likesRes : [];
              const safeComments = Array.isArray(commentsRes) ? commentsRes : [];

              const findImageUrl = (mId: string) => {
                 const item = allMediaItems.find(m => m.id === mId || m.photo_url === mId);
                 return item?.url || item?.photo_url || null;
              }

              likesList = safeLikes.map((l: any) => ({ ...l, type: 'like', media_url: findImageUrl(l.media_id) }));
              commentsList = safeComments.map((c: any) => ({ ...c, type: 'comment', media_url: findImageUrl(c.media_id) }));
          }

          const followersMapped = (followers || []).map(f => ({ ...f, type: 'follower' }));
          let combinedFeed = [...followersMapped, ...likesList, ...commentsList]
             .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

          // ESCONDENDO NOTIFICAÇÕES LIMPAS (Usa o carimbo de tempo do navegador)
          const clearedAt = localStorage.getItem('notifications_cleared_at');
          if (clearedAt) {
              combinedFeed = combinedFeed.filter(item => new Date(item.created_at).getTime() > Number(clearedAt));
          }

          setActivityFeed(combinedFeed.slice(0, 50));
      } catch (e) { console.error("Erro no feed", e); }
    };

    const clearActivityFeed = async () => {
      if (!confirm("Isso irá ocultar todas as notificações atuais da sua tela. Continuar?")) return;
      localStorage.setItem('notifications_cleared_at', Date.now().toString());
      setActivityFeed([]);
    };

    `;
    pageCode = pageCode.substring(0, startIndex) + replacement + pageCode.substring(endIndex);
    fs.writeFileSync('app/admin/dashboard/page.tsx', pageCode);
}
