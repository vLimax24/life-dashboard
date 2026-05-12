"use client";
import { ReactNode } from "react";
import { Plus } from "lucide-react";

interface AddButtonProps {
  onClick: () => void;
  children?: ReactNode;
  className?: string;
}

export function AddButton({
  onClick,
  children,
  className = "",
}: AddButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full py-3 bg-[#1e2535] border border-dashed border-white/20 rounded-lg text-[#8892a4] hover:text-[#4f8ef7] hover:border-[#4f8ef7]/50 text-sm font-medium flex items-center justify-center gap-2 transition-all hover:bg-[#1e2535]/80 active:scale-[0.98] ${className}`}
    >
      <Plus size={15} strokeWidth={2.5} />
      {children}
    </button>
  );
}
