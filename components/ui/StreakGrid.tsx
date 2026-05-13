"use client";
import { useEffect, useState } from "react";
import { getStreakGridData, computeStreakGridData } from "@/lib/streaks";

interface StreakGridProps {
  prefix: string;
  target: number;
  color: string;
  /** Optional: pass a pre-fetched map to skip the DB request entirely */
  prefetchedMap?: Record<string, number>;
}

export function StreakGrid({ prefix, target, color, prefetchedMap }: StreakGridProps) {
  const [cells, setCells] = useState<{ val: number; date: string }[]>([]);

  useEffect(() => {
    if (prefetchedMap) {
      setCells(computeStreakGridData(prefetchedMap, prefix));
    } else {
      getStreakGridData(prefix, target).then(setCells);
    }
  }, [prefix, target, prefetchedMap]);

  if (!cells.length)
    return <div className="h-12 bg-[#1e2535] rounded animate-pulse" />;

  return (
    <div
      className="grid gap-[3px]"
      style={{ gridTemplateColumns: "repeat(13, 1fr)" }}
    >
      {cells.map(({ val, date }) => {
        const isDone = val >= target;
        const isPartial = val > 0 && !isDone;
        return (
          <div
            key={date}
            title={`${date}: ${isDone ? "✓" : `${val}/${target}`}`}
            className="aspect-square rounded-[3px] cursor-pointer hover:scale-125 transition-transform"
            style={{
              background: isDone ? color : isPartial ? color + "55" : "#1e2535",
            }}
          />
        );
      })}
    </div>
  );
}
