const fs = require('fs');
let code = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

const startStr = "const loadActivityFeed = async";
const endStr = "const handleSaveTgToken = async";
const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    const cleanFunction = `const loadActivityFeed = async (medias: any[], scratches: any[], followers: any[]) => {
      try {
          const headers = { apikey: supabaseKey!, Authorization: \`Bearer \${supabaseKey}\` };
          
          // Filtra APENAS IDs reais (ignora fotos de raspadinha e valores vazios)
          const validMediaIds = (medias || [])
            .map(m => m.id)
            .filter(id => id && typeof id === 'string' && id.length > 20);
          
          let likesList = []; let commentsList = [];
          
          if (validMediaIds.length > 0) {
              const mediaIdsStr = validMediaIds.map(id => \`"\${id}"\`).join(','); 
              
              const [likesRes, commentsRes] = await Promise.all([
                  fetch(\`\${supabaseUrl}/rest/v1/Likes?media_id=in.(\${mediaIdsStr})\`, { headers }).then(r => r.ok ? r.json() : []),
                  fetch(\`\${supabaseUrl}/rest/v1/Comments?media_id=in.(\${mediaIdsStr})\`, { headers }).then(r => r.ok ? r.json() : [])
              ]);
              
              likesList = (likesRes || []).map(l => ({ ...l, type: 'like' }));
              commentsList = (commentsRes || []).map(c => ({ ...c, type: 'comment' }));
          }
          
          const followersMapped = (followers || []).map(f => ({ ...f, type: 'follower' }));
          let combinedFeed = [...followersMapped, ...likesList, ...commentsList]
             .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
             
          const hidden = JSON.parse(localStorage.getItem('hidden_notifications') || '[]');
          combinedFeed = combinedFeed.filter(item => !hidden.includes(item.created_at));
             
          setActivityFeed(combinedFeed.slice(0, 50));
      } catch (e) { console.error("Erro Feed:", e); }
  };

  const clearActivityFeed = async () => {
    if (!confirm("Ocultar notificações atuais?")) return;
    const current = activityFeed.map(n => n.created_at);
    const existing = JSON.parse(localStorage.getItem('hidden_notifications') || '[]');
    localStorage.setItem('hidden_notifications', JSON.stringify([...existing, ...current]));
    setActivityFeed([]);
  };

  `;
    code = code.substring(0, startIndex) + cleanFunction + code.substring(endIndex);
    fs.writeFileSync('app/admin/dashboard/page.tsx', code);
    console.log("✅ Sistema de notificações blindado!");
}
