"use client";

interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  return (
    <div
      className={`fixed bottom-[90px] left-1/2 -translate-x-1/2 bg-[#1e2535] border border-white/20 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap z-50 transition-all duration-300 ${
        message ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5 pointer-events-none"
      }`}
    >
      {message}
    </div>
  );
}
