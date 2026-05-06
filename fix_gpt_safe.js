const fs = require('fs');
let code = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

// A. Injeta a função isUUID do GPT no topo do arquivo (se já não existir)
if (!code.includes('function isUUID')) {
    code = code.replace(/import \{ useRouter[^;]+;/g, "$&\n\nfunction isUUID(value: string) {\n  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);\n}\n");
}

// B. Substitui apenas as funções de Notificação pelas do GPT
const startStr = "const loadActivityFeed = async";
const endStr = "const handleSaveTgToken = async";
const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    const replacement = `const loadActivityFeed = async (medias: any[], scratches: any[], followers: any[]) => {
      try {
          const headers = { apikey: supabaseKey!, Authorization: \`Bearer \${supabaseKey}\` };
          const recentMedias = medias.slice(0, 15);
          const recentScratches = scratches.slice(0, 15);
          const allMediaItems = [...recentMedias, ...recentScratches];
          
          // A LÓGICA DO GPT: Filtra apenas UUIDs válidos e ignora URLs gigantes
          const validMediaIds = recentMedias
            .map(m => m.id)
            .filter(id => isUUID(id)); 
          
          let likesList: any[] = []; let commentsList: any[] = [];
          
          if (validMediaIds.length > 0) {
              const mediaIdsStr = validMediaIds.join(','); 
              const [likesRes, commentsRes] = await Promise.all([
                  fetch(\`\${supabaseUrl}/rest/v1/Likes?media_id=in.(\${mediaIdsStr})&order=created_at.desc&limit=20\`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
                  fetch(\`\${supabaseUrl}/rest/v1/Comments?media_id=in.(\${mediaIdsStr})&order=created_at.desc&limit=20\`, { headers }).then(r => r.ok ? r.json() : []).catch(() => [])
              ]);

              const findImageUrl = (mId: string) => {
                 const item = allMediaItems.find(m => m.id === mId || m.photo_url === mId);
                 return item?.url || item?.photo_url || null;
              }

              likesList = (Array.isArray(likesRes) ? likesRes : []).map((l: any) => ({ ...l, type: 'like', media_url: findImageUrl(l.media_id) }));
              commentsList = (Array.isArray(commentsRes) ? commentsRes : []).map((c: any) => ({ ...c, type: 'comment', media_url: findImageUrl(c.media_id) }));
          }
          
          const followersMapped = (followers || []).map(f => ({ ...f, type: 'follower' }));
          let combinedFeed = [...followersMapped, ...likesList, ...commentsList]
             .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
             
          // LÓGICA DO GPT: Ocultar via localStorage
          const stored = localStorage.getItem('hidden_notifications');
          if (stored) {
              const hiddenTimestamps = JSON.parse(stored);
              combinedFeed = combinedFeed.filter(item => !hiddenTimestamps.includes(item.created_at));
          }
             
          setActivityFeed(combinedFeed.slice(0, 50));
      } catch (err) { console.error('Erro ao carregar feed:', err); }
  };

  const clearActivityFeed = async () => {
    if (!confirm("Isso irá ocultar todas as notificações atuais da sua tela. Continuar?")) return;
    
    // Adiciona todos os itens atuais na lista de ocultos (Como o GPT sugeriu)
    const currentTimestamps = activityFeed.map(item => item.created_at);
    const stored = localStorage.getItem('hidden_notifications');
    const hiddenTimestamps = stored ? JSON.parse(stored) : [];
    
    const updated = [...hiddenTimestamps, ...currentTimestamps];
    localStorage.setItem('hidden_notifications', JSON.stringify(updated));
    
    setActivityFeed([]);
  };

  `;
    code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
    fs.writeFileSync('app/admin/dashboard/page.tsx', code);
    console.log("✅ Lógica do GPT injetada sem apagar o design do Dashboard!");
}
