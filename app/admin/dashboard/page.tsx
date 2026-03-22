// ... imports existentes
// Adicione na lista de abas: "videos"

// No conteúdo das abas:
{activeTab === "videos" && (
  <div className="animate-in fade-in slide-in-from-bottom-4">
    <h2 className="text-4xl font-black uppercase italic mb-2 tracking-tighter">Pedidos de <span className="text-[#D946EF]">Vídeos</span></h2>
    <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mb-12">Gerencie suas encomendas personalizadas</p>

    <div className="grid gap-6">
        {videoRequests.map((req) => (
            <div key={req.id} className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between gap-6 shadow-2xl">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${
                            req.status === 'solicitado' ? 'bg-amber-500 text-black' : 
                            req.status === 'precificado' ? 'bg-blue-500 text-white' :
                            req.status === 'pago' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/40'
                        }`}>
                            {req.status}
                        </span>
                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{req.player_name} ({req.player_phone})</span>
                    </div>
                    <p className="text-sm text-white/80 italic mb-4">"{req.description}"</p>
                </div>

                <div className="flex flex-col gap-3 min-w-[200px]">
                    {req.status === 'solicitado' && (
                        <>
                            <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-black text-white/30 uppercase ml-2">Definir Preço (R$ 15 - 200)</span>
                                <input 
                                    type="number" 
                                    placeholder="R$ 0,00"
                                    className="bg-black border border-white/10 rounded-xl p-3 text-white font-black text-sm outline-none focus:border-[#D946EF]"
                                    onBlur={(e) => handleSetPrice(req.id, Number(e.target.value))}
                                />
                            </div>
                            <button onClick={() => updateVideoStatus(req.id, 'recusado')} className="text-[9px] font-black uppercase text-red-500/50 hover:text-red-500 transition-all">Recusar Pedido</button>
                        </>
                    )}

                    {req.status === 'pago' && (
                        <div className="space-y-3">
                            <p className="text-[9px] font-black text-emerald-500 uppercase animate-pulse">PAGAMENTO APROVADO! ENTREGUE O LINK:</p>
                            <input 
                                type="text" 
                                placeholder="Link do Google Drive"
                                className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-emerald-500"
                                onBlur={(e) => handleDeliverVideo(req.id, e.target.value)}
                            />
                        </div>
                    )}
                    
                    {req.status === 'entregue' && (
                        <div className="bg-white/5 p-4 rounded-2xl border border-emerald-500/30">
                            <p className="text-[9px] font-black text-emerald-500 uppercase mb-1">Vídeo Entregue</p>
                            <p className="text-[10px] text-white/40 truncate">{req.drive_link}</p>
                        </div>
                    )}
                </div>
            </div>
        ))}
    </div>
  </div>
)}
