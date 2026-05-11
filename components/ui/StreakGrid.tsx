"use client";
import { getStreakGridData } from "@/lib/streaks";

interface StreakGridProps {
  prefix: string;
  target: number;
  color: string;
}

export function StreakGrid({ prefix, target, color }: StreakGridProps) {
  const cells = getStreakGridData(prefix, target);
  return (
    <div className="grid gap-[3px]" style={{ gridTemplateColumns: "repeat(13, 1fr)" }}>
      {cells.map(({ val, date }) => {
        const isDone = val >= target;
        const isPartial = val > 0 && !isDone;
        return (
          <div
            key={date}
            title={`${date}: ${isDone ? "✓" : `${val}/${target}`}`}
            className="aspect-square rounded-[3px] cursor-pointer hover:scale-125 transition-transform"
            style={{
              background: isDone ? color : isPartial ? color + "44" : "#1e2535",
            }}
          />
        );
      })}
    </div>
  );
}
