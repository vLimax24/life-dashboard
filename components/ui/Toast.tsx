"use client";
import { CheckCircle } from "lucide-react";

interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  return (
    <div
      className={`fixed bottom-[90px] left-1/2 -translate-x-1/2 bg-[#1e2535] border border-white/20 shadow-xl rounded-full px-4 py-2.5 text-[13px] font-medium whitespace-nowrap z-50 flex items-center gap-2 transition-all duration-300 ${
        message
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <CheckCircle size={14} className="text-[#22c55e] shrink-0" />
      {message}
    </div>
  );
}
