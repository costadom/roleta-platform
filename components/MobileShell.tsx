import { ReactNode } from "react";

type MobileShellProps = {
  children: ReactNode;
};

export function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#120008] px-3 py-6">
      <div className="relative w-full max-w-sm aspect-[9/16] overflow-hidden rounded-[2.5rem] border border-white/10 bg-black shadow-[0_30px_80px_rgba(0,0,0,0.85)]">
        <img
          src="/images/bgs4.jpeg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-black/28" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.24)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/28 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/78 via-black/35 to-transparent" />

        <div className="absolute left-1/2 top-[42%] h-[58%] w-[95%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(120,0,40,0.16)_0%,rgba(120,0,40,0.08)_38%,rgba(0,0,0,0)_72%)] blur-2xl" />

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0)_18%,rgba(255,255,255,0)_100%)]" />

        <div className="relative z-20 flex h-full flex-col px-4 pb-5 pt-8">
          {children}
        </div>
      </div>
    </div>
  );
}
