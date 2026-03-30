"use client";

import { useState } from "react";
import { ShieldCheck, Loader2, RefreshCw } from "lucide-react";
import { getSuperData } from "./actions";

export default function SuperAdmin() {
  const [isLogged, setIsLogged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");

  const handleManualLoad = async () => {
    setLoading(true);
    const res = await getSuperData();
    if (res.ok) {
      setData(res.data);
      alert("Dados carregados com sucesso! O banco está vivo.");
    } else {
      alert("O banco ainda está se recuperando. Aguarde mais um pouco.");
    }
    setLoading(false);
  };

  if (!isLogged) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 p-10 rounded-[3rem] text-center">
          <ShieldCheck size={40} className="text-[#FF1493] mx-auto mb-6" />
          <h1 className="text-xl font-black text-white mb-8">PAINEL DE RECUPERAÇÃO</h1>
          <form onSubmit={(e) => { e.preventDefault(); if(adminPass === "SavanahBoss2026") setIsLogged(true); }} className="space-y-4">
            <input type="password" placeholder="SENHA MESTRA" className="w-full bg-black border border-white/10 p-5 rounded-2xl text-white outline-none" value={adminPass} onChange={e => setAdminPass(e.target.value)} />
            <button type="submit" className="w-full bg-[#FF1493] text-white py-5 rounded-2xl font-black uppercase">Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-10 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-black mb-4">SISTEMA REESTABELECIDO</h1>
      <p className="text-white/40 mb-8 text-center max-w-md text-sm">O banco de dados foi reiniciado. Clique no botão abaixo para testar a conexão e carregar os dados das Musas.</p>
      
      <button onClick={handleManualLoad} disabled={loading} className="bg-white text-black px-10 py-5 rounded-2xl font-black uppercase flex items-center gap-3 active:scale-95 transition-all">
        {loading ? <Loader2 className="animate-spin" /> : <RefreshCw size={20} />}
        Carregar Dados Agora
      </button>

      {data && (
        <div className="mt-10 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500 font-bold">
          ✅ Conexão OK! {data.models.length} modelos encontradas.
        </div>
      )}
    </div>
  );
}
