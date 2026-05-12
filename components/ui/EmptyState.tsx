import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  text: string;
}

export function EmptyState({ icon: Icon, text }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-7 text-[#8892a4] text-sm gap-2.5">
      <Icon size={28} strokeWidth={1.5} className="opacity-30" />
      <span className="text-[13px]">{text}</span>
    </div>
  );
}
