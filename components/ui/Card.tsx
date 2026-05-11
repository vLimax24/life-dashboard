import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-[#161b27] border border-white/[0.08] rounded-[14px] p-4 mb-3 ${className}`}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: ReactNode;
  icon?: ReactNode;
}

export function CardTitle({ children, icon }: CardTitleProps) {
  return (
    <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#8892a4] uppercase tracking-[0.8px] mb-3">
      {icon && <span className="text-sm">{icon}</span>}
      {children}
    </div>
  );
}
