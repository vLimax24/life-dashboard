"use client";

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1.5 mb-4 bg-[#1e2535] p-1 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 py-2 px-1.5 rounded-md text-[13px] font-semibold transition-all ${
            active === tab.id
              ? "bg-[#161b27] text-[#f0f2f7]"
              : "bg-transparent text-[#8892a4]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
