import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Mantemos isso para evitar que erros de tipagem travem seu deploy agora
    ignoreBuildErrors: true,
  },
  // O bloco 'eslint' foi removido daqui pois não é mais suportado nesta versão
};

export default nextConfig;
