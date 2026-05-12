import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-[#161b27] border border-white/[0.08] rounded-[14px] p-4 mb-3 ${className}`}
    >
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: ReactNode;
  icon?: LucideIcon;
}

export function CardTitle({ children, icon: Icon }: CardTitleProps) {
  return (
    <div className="flex items-center gap-2 text-[12px] font-semibold text-[#8892a4] uppercase tracking-[0.9px] mb-3">
      {Icon && <Icon size={13} strokeWidth={2.2} className="text-[#4f8ef7]" />}
      {children}
    </div>
  );
}
