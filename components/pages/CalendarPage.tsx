"use client";
import { useState, useCallback, useEffect } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { AddButton } from "@/components/ui/AddButton";
import { EmptyState } from "@/components/ui/EmptyState";
import * as DB from "@/lib/db";
import type { Event } from "@/lib/types";
import { CalendarDays, List } from "lucide-react";

interface Props {
  onAddEvent: (date?: string) => void;
  refreshKey: number;
}

const MONTHS = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];
const EVENT_COLORS: Record<string, string> = {
  exam: "#f87171",
  test: "#fbbf24",
  vortrag: "#7c5cfc",
  sport: "#22c55e",
  other: "#8892a4",
};
const EVENT_LABELS: Record<string, string> = {
  exam: "Klausur",
  test: "Test",
  vortrag: "Vortrag",
  sport: "Sport",
  other: "Termin",
};

export function CalendarPage({ onAddEvent, refreshKey }: Props) {
  const today = DB.getToday();
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [events, setEvents] = useState<Event[]>([]);

  const load = useCallback(async () => {
    setEvents(await DB.get<Event[]>("events", []));
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const navMonth = (dir: number) => {
    let m = calMonth + dir,
      y = calYear;
    if (m > 11) {
      m = 0;
      y++;
    }
    if (m < 0) {
      m = 11;
      y--;
    }
    setCalMonth(m);
    setCalYear(y);
  };

  const deleteEvent = async (id: number) => {
    if (!confirm("Termin löschen?")) return;
    const updated = events.filter((e) => e.id !== id);
    await DB.set("events", updated);
    setEvents(updated);
  };

  const first = new Date(calYear, calMonth, 1);
  let startDow = first.getDay();
  if (startDow === 0) startDow = 7;
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const prevDays = new Date(calYear, calMonth, 0).getDate();

  const days: { num: number; dateStr: string; isOther: boolean }[] = [];
  for (let i = startDow - 1; i > 0; i--)
    days.push({ num: prevDays - i + 1, dateStr: "", isOther: true });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({ num: d, dateStr, isOther: false });
  }

  return (
    <div>
      <div className="text-[20px] font-bold mb-3.5 mt-1">📅 Kalender</div>

      <Card>
        <div className="flex items-center justify-between mb-3.5">
          <button
            onClick={() => navMonth(-1)}
            className="bg-[#1e2535] border-none text-white px-3 py-1.5 rounded-lg text-base cursor-pointer"
          >
            ‹
          </button>
          <span className="text-base font-semibold">
            {MONTHS[calMonth]} {calYear}
          </span>
          <button
            onClick={() => navMonth(1)}
            className="bg-[#1e2535] border-none text-white px-3 py-1.5 rounded-lg text-base cursor-pointer"
          >
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
            <div
              key={d}
              className="text-center text-[11px] text-[#8892a4] font-semibold py-1"
            >
              {d}
            </div>
          ))}
          {days.map((day, i) => {
            if (day.isOther)
              return (
                <div
                  key={`o${i}`}
                  className="aspect-square flex items-center justify-center text-[13px] text-white/20"
                >
                  {day.num}
                </div>
              );
            const dayEvents = events.filter((e) => e.date === day.dateStr);
            const isToday = day.dateStr === today;
            const hasExam = dayEvents.some((e) => e.type === "exam");
            const hasTest = dayEvents.some((e) => e.type === "test");
            const hasEvent = dayEvents.length > 0 && !hasExam && !hasTest;
            return (
              <div
                key={day.dateStr}
                onClick={() => {
                  if (dayEvents.length)
                    alert(dayEvents.map((e) => e.title).join(" · "));
                  else onAddEvent(day.dateStr);
                }}
                className={`aspect-square flex items-center justify-center text-[13px] rounded-lg cursor-pointer relative transition-colors hover:bg-[#1e2535] ${isToday ? "bg-[#4f8ef7] text-white font-bold" : ""}`}
              >
                {day.num}
                {(hasExam || hasTest || hasEvent) && (
                  <span
                    className="absolute bottom-[3px] w-1 h-1 rounded-full"
                    style={{
                      background: hasExam
                        ? "#f87171"
                        : hasTest
                          ? "#fbbf24"
                          : "#fb923c",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardTitle icon={List}>Alle Termine</CardTitle>
        {events.length === 0 ? (
          <EmptyState icon={CalendarDays} text="Keine Termine" />
        ) : (
          events.map((e) => {
            const d = new Date(e.date + "T12:00:00");
            const dateStr = d.toLocaleDateString("de-DE", {
              weekday: "short",
              day: "2-digit",
              month: "long",
            });
            const past = e.date < today;
            return (
              <div
                key={e.id}
                onClick={() => deleteEvent(e.id)}
                className={`flex items-start gap-3 p-2.5 bg-[#1e2535] rounded-lg mb-2 cursor-pointer hover:bg-white/7 transition-colors ${past ? "opacity-50" : ""}`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                  style={{ background: EVENT_COLORS[e.type] }}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {e.title}
                    {e.subject ? ` · ${e.subject}` : ""}
                  </div>
                  <div className="text-xs text-[#8892a4] mt-0.5">{dateStr}</div>
                </div>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{
                    background: EVENT_COLORS[e.type] + "33",
                    color: EVENT_COLORS[e.type],
                  }}
                >
                  {EVENT_LABELS[e.type]}
                </span>
              </div>
            );
          })
        )}
        <AddButton onClick={() => onAddEvent()} className="mt-2">
          Termin hinzufügen
        </AddButton>
      </Card>

      <Card>
        <CardTitle>Legende</CardTitle>
        <div className="flex gap-3 flex-wrap">
          {[
            ["#f87171", "Klausur"],
            ["#fbbf24", "Test"],
            ["#7c5cfc", "Vortrag"],
            ["#fb923c", "Sonstiges"],
          ].map(([color, label]) => (
            <span key={label} className="text-xs flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ background: color }}
              />
              {label}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}
