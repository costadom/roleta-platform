import { ReactNode } from "react";
import Image from "next/image";

type MobileShellProps = {
  children: ReactNode;
};

export function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#120008] px-3 py-6 sm:px-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#1c030a] shadow-[0_24px_80px_rgba(0,0,0,0.85)] aspect-[9/19.5]">
        {/* Background image (modelo) + overlay */}
        <div className="absolute inset-0">
          <Image
            src="/images/model-bg.jpg"
            alt="Modelo em cenário de cassino"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#120008]/10 via-[#120008]/45 to-[#120008]" />
        </div>

        {/* Bezel top */}
        <div className="pointer-events-none absolute inset-x-16 top-2 z-30 h-6 rounded-full bg-black/40 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" />

        {/* Overlay escuro extra para leitura na parte inferior */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-black/80 via-black/60 to-transparent" />

        {/* Foreground content */}
        <div className="absolute inset-0 z-20 flex flex-col px-4 pb-5 pt-10">{children}</div>
      </div>
    </div>
  );
}

