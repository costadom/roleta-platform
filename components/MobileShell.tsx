import { ReactNode } from "react";

type MobileShellProps = {
  children: ReactNode;
};

export function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="relative w-full max-w-sm aspect-[9/16] overflow-hidden rounded-[2.5rem]">
        <img
          src="/images/bg.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-20 flex h-full flex-col px-4 pb-5 pt-10">
          {children}
        </div>
      </div>
    </div>
  );
}
