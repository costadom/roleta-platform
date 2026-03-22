"use client";

import React, { useState } from "react";
import { X, Phone, Mail, Lock, ShieldCheck, User } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLoginView, setIsLoginView] = useState(true);

  // Estados dos Campos
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  
  // Estado de Erros para dar feedback visual
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isOpen) return null;

  // --- MÁSCARAS DE INPUT ---
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 2) value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    if (value.length > 9) value = `${value.slice(0, 10)}-${value.slice(10)}`;
    setPhone(value);
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 3) value = `${value.slice(0, 3)}.${value.slice(3)}`;
    if (value.length > 7) value = `${value.slice(0, 7)}.${value.slice(7)}`;
    if (value.length > 11) value = `${value.slice(0, 11)}-${value.slice(11)}`;
    setCpf(value);
  };

  // --- VALIDAÇÕES MATEMÁTICAS E REGEX ---
  const isValidCPF = (cpfToTest: string) => {
    const cleanCPF = cpfToTest.replace(/\D/g, "");
    if (cleanCPF.length !== 11 || /^(\d)\1+$/.test(cleanCPF)) return false;
    let sum = 0, rest;
    for (let i = 1; i <= 9; i++) sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(cleanCPF.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(cleanCPF.substring(10, 11))) return false;
    return true;
  };

  const isValidPassword = (pass: string) => {
    // Min 8 chars, 1 maiúscula, 1 número, 1 caractere especial
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pass);
  };

  // --- SUBMITS E GRAVAÇÃO DE LOGIN ---
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (phone.length < 14) newErrors.phone = "Telefone inválido.";
    if (!email.includes("@") || !email.includes(".")) newErrors.email = "E-mail inválido.";
    if (!isValidCPF(cpf)) newErrors.cpf = "CPF inválido.";
    if (!isValidPassword(password)) newErrors.password = "A senha não atinge os requisitos.";
    if (!ageConfirmed) newErrors.age = "Você precisa confirmar que tem mais de 18 anos.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    
    // Grava o login no navegador do cliente (Local Storage)
    localStorage.setItem("labz_player_logged", "true");
    localStorage.setItem("labz_player_phone", phone);
    
    // Redireciona de imediato para a vitrine
    window.location.href = "/vitrine";
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (phone.length < 14) newErrors.phone = "Telefone inválido.";
    if (password.length < 1) newErrors.password = "Digite a sua senha.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    
    // Grava o login no navegador do cliente (Local Storage)
    localStorage.setItem("labz_player_logged", "true");
    localStorage.setItem("labz_player_phone", phone);
    
    // Redireciona de imediato para a vitrine
    window.location.href = "/vitrine";
  };

  // Link do WhatsApp de Suporte configurado
  const whatsappSupportLink = "https://wa.me/5515996587248?text=Esqueci%20minha%20senha%20e%20preciso%20redefini-la";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 shadow-[0_0_40px_rgba(217,70,239,0.15)] relative overflow-hidden">
        
        {/* Botão Fechar */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-full transition-colors z-10"
        >
          <X size={18} />
        </button>

        {/* Decoração Neon */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#D946EF]/20 blur-[80px] pointer-events-none" />

        <div className="text-center mb-6 relative z-10 pt-2">
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
            Savanah <span className="text-[#D946EF]">Labz</span>
          </h2>
          <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest mt-1">
            {isLoginView ? "Aceda à sua carteira" : "Crie a sua conta VIP"}
          </p>
        </div>

        {/* Toggle Login/Cadastro */}
        <div className="flex bg-[#141414] rounded-xl p-1 mb-6 relative z-10 border border-white/5">
          <button 
            onClick={() => { setIsLoginView(true); setErrors({}); }}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${isLoginView ? 'bg-[#D946EF] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
          >
            Entrar
          </button>
          <button 
            onClick={() => { setIsLoginView(false); setErrors({}); }}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${!isLoginView ? 'bg-[#D946EF] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
          >
            Registar
          </button>
        </div>

        {/* FORMULÁRIO DE LOGIN */}
        {isLoginView ? (
          <form onSubmit={handleLogin} className="space-y-4 relative z-10">
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40"><Phone size={16} /></div>
                <input 
                  type="tel" placeholder="WhatsApp" value={phone} onChange={handlePhoneChange}
                  className="w-full bg-[#141414] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#D946EF] transition-colors"
                />
              </div>
              {errors.phone && <p className="text-red-500 text-[9px] mt-1 ml-1 uppercase font-bold">{errors.phone}</p>}
            </div>

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40"><Lock size={16} /></div>
                <input 
                  type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#D946EF] transition-colors"
                />
              </div>
              {errors.password && <p className="text-red-500 text-[9px] mt-1 ml-1 uppercase font-bold">{errors.password}</p>}
            </div>

            <div className="flex justify-end">
              <a href={whatsappSupportLink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#D946EF] hover:text-white transition-colors font-bold uppercase tracking-wide">
                Esqueci-me da senha
              </a>
            </div>

            <button type="submit" className="w-full bg-[#D946EF] hover:bg-[#c03be0] text-white font-black uppercase tracking-widest py-3.5 rounded-xl transition-colors shadow-[0_0_20px_rgba(217,70,239,0.3)]">
              Entrar
            </button>
          </form>
        ) : (
          
        /* FORMULÁRIO DE CADASTRO */
          <form onSubmit={handleRegister} className="space-y-4 relative z-10">
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40"><Phone size={16} /></div>
                <input 
                  type="tel" placeholder="WhatsApp (Será o seu login)" value={phone} onChange={handlePhoneChange}
                  className="w-full bg-[#141414] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#D946EF] transition-colors"
                />
              </div>
              {errors.phone && <p className="text-red-500 text-[9px] mt-1 ml-1 uppercase font-bold">{errors.phone}</p>}
            </div>

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40"><Mail size={16} /></div>
                <input 
                  type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#D946EF] transition-colors"
                />
              </div>
              {errors.email && <p className="text-red-500 text-[9px] mt-1 ml-1 uppercase font-bold">{errors.email}</p>}
            </div>

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40"><User size={16} /></div>
                <input 
                  type="text" placeholder="CPF" value={cpf} onChange={handleCpfChange}
                  className="w-full bg-[#141414] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#D946EF] transition-colors"
                />
              </div>
              {errors.cpf && <p className="text-red-500 text-[9px] mt-1 ml-1 uppercase font-bold">{errors.cpf}</p>}
            </div>

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40"><Lock size={16} /></div>
                <input 
                  type="password" placeholder="Senha Forte" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#D946EF] transition-colors"
                />
              </div>
              <p className="text-[8px] text-white/40 mt-1 ml-1">Mín. 8 caracteres, 1 maiúscula, 1 número e 1 especial (@$!%*?&)</p>
              {errors.password && <p className="text-red-500 text-[9px] mt-1 ml-1 uppercase font-bold">{errors.password}</p>}
            </div>

            <div className="flex items-start gap-2 bg-[#141414] p-3 rounded-xl border border-white/5">
              <input 
                type="checkbox" id="ageCheck" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 accent-[#D946EF] bg-transparent border-white/20 rounded"
              />
              <label htmlFor="ageCheck" className="text-[10px] text-white/60 leading-tight">
                Declaro que sou maior de 18 anos e concordo com os Termos de Uso e Política de Privacidade da plataforma.
              </label>
            </div>
            {errors.age && <p className="text-red-500 text-[9px] ml-1 uppercase font-bold">{errors.age}</p>}

            <button type="submit" className="w-full bg-gradient-to-r from-[#D946EF] to-purple-600 hover:from-[#c03be0] hover:to-purple-700 text-white font-black uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(217,70,239,0.3)] flex items-center justify-center gap-2">
              <ShieldCheck size={18} /> Criar Conta Segura
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
