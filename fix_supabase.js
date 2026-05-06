const fs = require('fs');
let code = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

const startStr = "const loadActivityFeed = async";
const endStr = "const clearActivityFeed = async";
const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    const newCode = `const loadActivityFeed = async (medias: any[], scratches: any[], followers: any[]) => {
      try {
          const headers = { apikey: supabaseKey!, Authorization: \`Bearer \${supabaseKey}\` };
          const recentMedias = medias.slice(0, 15); 
          const recentScratches = scratches.slice(0, 15);
          const allMediaItems = [...recentMedias, ...recentScratches];
          
          // Regex rigorosa para pegar APENAS UUIDs da Galeria
          const validMediaIds = recentMedias.map(m => m.id).filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id));
          
          let likesList: any[] = []; let commentsList: any[] = [];
          
          if (validMediaIds.length > 0) {
              // MÁGICA AQUI: Envolve cada ID com "%22" (aspas na URL)
              const mediaIdsStr = validMediaIds.map(id => \`%22\${id}%22\`).join(','); 
              
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
             
          const clearedAt = localStorage.getItem('notifications_cleared_at');
          if (clearedAt) {
              combinedFeed = combinedFeed.filter(item => new Date(item.created_at).getTime() > Number(clearedAt));
          }
             
          setActivityFeed(combinedFeed.slice(0, 50));
      } catch (err) { console.error('Erro feed:', err); }
  };

  `;
    code = code.substring(0, startIndex) + newCode + code.substring(endIndex);
    fs.writeFileSync('app/admin/dashboard/page.tsx', code);
    console.log("✅ Supabase corrigido com '%22'");
}
