"use client";
import { ReactNode } from "react";

interface AddButtonProps {
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

export function AddButton({ onClick, children, className = "" }: AddButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full py-3 bg-gradient-to-r from-blue-500/15 to-purple-500/15 border border-dashed border-blue-400/40 rounded-lg text-[#4f8ef7] text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:bg-blue-500/20 active:scale-[0.98] ${className}`}
    >
      {children}
    </button>
  );
}
