interface EmptyStateProps {
  icon: string;
  text: string;
}

export function EmptyState({ icon, text }: EmptyStateProps) {
  return (
    <div className="text-center py-6 text-[#8892a4] text-sm">
      <span className="block text-[32px] mb-2 opacity-40">{icon}</span>
      {text}
    </div>
  );
}
