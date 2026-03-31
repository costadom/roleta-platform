import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LabzSexy | Onde as Musas se destacam!",
  description: "A plataforma oficial de conteúdo das Musas. Gire e ganhe prêmios exclusivos!",
  openGraph: {
    title: "LabzSexy | Onde as Musas se destacam!",
    description: "Gire e ganhe prêmios exclusivos!",
    url: "https://labzsexyroll.vercel.app", 
    siteName: "LabzSexy",
    images: [
      {
        url: "/opengraph-image.png", // Puxa a imagem que você colocou na pasta public
        width: 1200,
        height: 630,
        alt: "LabzSexy - Onde as Musas se destacam!",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}