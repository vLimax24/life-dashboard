"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { AddButton } from "@/components/ui/AddButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { StreakGrid } from "@/components/ui/StreakGrid";
import * as DB from "@/lib/db";
import { getStreak } from "@/lib/streaks";
import type { DailyGoal, Event, ExamPlan } from "@/lib/types";
import {
  Droplets,
  Flame,
  CalendarDays,
  CheckSquare,
  CalendarClock,
  BookOpen,
  Trash2,
  Hand,
  BookMarked,
  Dumbbell,
  Check,
  AlertCircle,
  AlertTriangle,
  CircleDot,
} from "lucide-react";

const QUOTES = [
  '"Disziplin ist die Brücke zwischen Zielen und Erfolg."',
  '"Du musst dich nicht großartig fühlen, um anzufangen. Aber du musst anfangen, um dich großartig zu fühlen."',
  '"Jeder Tag ist eine neue Chance, besser zu werden."',
  '"Kleine Schritte täglich führen zu großen Ergebnissen."',
  '"Die Investition in Wissen bringt immer die besten Zinsen."',
  '"Nicht Talent, sondern Konsequenz entscheidet über Erfolg."',
];

interface Props {
  onAddEvent: () => void;
  onAddGoal: () => void;
  refreshKey: number;
}

export function HomePage({ onAddEvent, onAddGoal, refreshKey }: Props) {
  const today = DB.getToday();
  const [water, setWater] = useState(0);
  const [quote, setQuote] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [goalDone, setGoalDone] = useState<Record<number, boolean>>({});
  const [events, setEvents] = useState<Event[]>([]);
  const [activePlan, setActivePlan] = useState<ExamPlan | null>(null);
  const [streak, setStreak] = useState(0);

  const load = useCallback(async () => {
    const [w, n, allGoals, ev, exams, s] = await Promise.all([
      DB.get<number>("water_" + today, 0),
      DB.get<string>("profile_name", ""),
      DB.get<DailyGoal[]>("daily_goals", []),
      DB.get<Event[]>("events", []),
      DB.get<ExamPlan[]>("exam_plans", []),
      getStreak("water_"),
    ]);
    setWater(w);
    setName(n);
    setStreak(s);

    const filtered = allGoals.filter(
      (g) => g.repeat === "daily" || g.date === today,
    );
    setGoals(filtered);

    const doneMap: Record<number, boolean> = {};
    await Promise.all(
      filtered.map(async (g) => {
        doneMap[g.id] = await DB.get<boolean>(
          "goal_done_" + g.id + "_" + today,
          false,
        );
      }),
    );
    setGoalDone(doneMap);

    setEvents(ev.filter((e) => e.date >= today).slice(0, 5));
    const active = exams.filter((e) => e.date >= today);
    setActivePlan(active[0] || null);
  }, [today]);

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const toggleWater = async (idx: number) => {
    const cur = await DB.get<number>("water_" + today, 0);
    const newVal = idx < cur ? idx : idx + 1;
    await DB.set("water_" + today, newVal);
    setWater(newVal);
  };

  const toggleGoal = async (id: number) => {
    const key = "goal_done_" + id + "_" + today;
    const was = await DB.get<boolean>(key, false);
    await DB.set(key, !was);
    setGoalDone((prev) => ({ ...prev, [id]: !was }));
  };

  const deleteGoal = async (id: number) => {
    const allGoals = await DB.get<DailyGoal[]>("daily_goals", []);
    await DB.set(
      "daily_goals",
      allGoals.filter((g) => g.id !== id),
    );
    load();
  };

  const [greeting, setGreeting] = useState("");
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Guten Morgen" : h < 18 ? "Hey" : "Guten Abend");
  }, []);

  const eventColors: Record<string, string> = {
    exam: "#f87171",
    test: "#fbbf24",
    vortrag: "#7c5cfc",
    sport: "#22c55e",
    other: "#8892a4",
  };
  const eventLabels: Record<string, string> = {
    exam: "Klausur",
    test: "Test",
    vortrag: "Vortrag",
    sport: "Sport",
    other: "Termin",
  };

  const doneGoals = goals.filter((g) => goalDone[g.id]).length;
  const goalPct =
    goals.length > 0 ? Math.round((doneGoals / goals.length) * 100) : 0;
  const weekEvents = events.filter((e) => {
    const d = new Date(e.date + "T12:00:00");
    const now = new Date();
    return d >= now && d <= new Date(now.getTime() + 7 * 86400000);
  }).length;

  const todayStep = activePlan?.plan.find((p) => p.date === today);

  return (
    <div>
      <div className="relative bg-gradient-to-br from-[#1a2540] to-[#1e1a3a] border border-blue-400/20 rounded-[14px] p-[18px] mb-3 overflow-hidden">
        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-[radial-gradient(circle,rgba(79,142,247,0.15),transparent_70%)]" />
        <div className="text-[22px] font-bold flex items-center gap-2">
          {greeting}
          {name ? `, ${name}` : ""}{" "}
          <Hand size={22} className="text-[#fbbf24]" />
        </div>
        <div className="text-sm text-[#8892a4] mt-0.5">
          11. Klasse · Gymnasium Sachsen
        </div>
        {quote && (
          <div className="text-[13px] text-white/70 mt-2.5 italic border-l-2 border-[#4f8ef7] pl-2.5">
            {quote}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-3">
        {[
          {
            val: streak,
            label: "Tage Streak",
            icon: <Flame size={11} className="inline mr-0.5" />,
            color: "#22c55e",
          },
          {
            val: weekEvents,
            label: "Termine diese Woche",
            icon: null,
            color: "#fbbf24",
          },
          {
            val: `${water}/8`,
            label: "Gläser heute",
            icon: null,
            color: "#4f8ef7",
          },
          {
            val: `${goalPct}%`,
            label: "Tagesziele",
            icon: null,
            color: "#f472b6",
          },
        ].map((s, i) => (
          <div key={i} className="bg-[#1e2535] rounded-lg p-3 text-center">
            <div
              className="text-[26px] font-bold font-mono"
              style={{ color: s.color }}
            >
              {s.val}
            </div>
            <div className="text-[11px] text-[#8892a4] mt-0.5 flex items-center justify-center gap-0.5">
              {s.icon}
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <Card>
        <CardTitle icon={Droplets}>Wasser-Tracker</CardTitle>
        <div
          className="grid gap-1.5 mb-3"
          style={{ gridTemplateColumns: "repeat(8, 1fr)" }}
        >
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              onClick={() => toggleWater(i)}
              className={`relative overflow-hidden rounded-[4px_4px_8px_8px] border-[1.5px] cursor-pointer transition-all flex items-center justify-center aspect-[0.7] ${i < water ? "border-blue-400" : "border-white/14 bg-[#1e2535]"}`}
            >
              <div
                className="absolute bottom-0 left-0 right-0 rounded-b-[6px] transition-all duration-400"
                style={{
                  height: i < water ? "100%" : "0%",
                  background: "linear-gradient(180deg,#60a5fa,#3b82f6)",
                }}
              />
              <span className="relative z-10">
                {i < water ? (
                  <Droplets size={14} className="text-white" />
                ) : (
                  <CircleDot size={14} className="text-white/30" />
                )}
              </span>
            </div>
          ))}
        </div>
        <div className="text-sm text-[#8892a4] text-center">
          Bisher <span className="text-[#4f8ef7] font-semibold">{water}</span>{" "}
          von 8 Gläsern (2 Liter)
        </div>
      </Card>

      <Card>
        <CardTitle icon={Flame}>Daily Streaks</CardTitle>
        {[
          { key: "water_", label: "💧 Wasser", target: 8, color: "#60a5fa" },
          { key: "study_", label: "📚 Gelernt", target: 1, color: "#818cf8" },
          {
            key: "workout_",
            label: "💪 Training",
            target: 1,
            color: "#4ade80",
          },
        ].map((def) => (
          <AsyncStreakRow key={def.key} def={def} today={today} />
        ))}
        <div className="mt-3">
          <div className="text-[12px] text-[#8892a4] mb-1.5">
            Letzte 91 Tage
          </div>
          <StreakGrid prefix="water_" target={8} color="#60a5fa" />
        </div>
      </Card>

      <Card>
        <CardTitle icon={CalendarClock}>Nächste Termine</CardTitle>
        {events.length === 0 ? (
          <EmptyState icon={CalendarDays} text="Keine Termine eingetragen" />
        ) : (
          events.map((e) => {
            const d = new Date(e.date + "T12:00:00");
            const dateStr = d.toLocaleDateString("de-DE", {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
            });
            const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
            const urgency = diff <= 2 ? "🚨 " : diff <= 5 ? "⚠️ " : "";
            return (
              <div
                key={e.id}
                className="flex items-start gap-3 p-2.5 bg-[#1e2535] rounded-lg mb-2 cursor-pointer hover:bg-white/7 transition-colors"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                  style={{
                    background: eventColors[e.type] || eventColors.other,
                  }}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {urgency}
                    {e.title}
                    {e.subject ? ` (${e.subject})` : ""}
                  </div>
                  <div className="text-xs text-[#8892a4] mt-0.5">
                    {dateStr} · in {diff} Tag{diff !== 1 ? "en" : ""}
                  </div>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold badge-${e.type}`}
                >
                  {eventLabels[e.type] || "Termin"}
                </span>
              </div>
            );
          })
        )}
        <AddButton onClick={onAddEvent}>Termin hinzufügen</AddButton>
      </Card>

      <Card>
        <CardTitle icon={BookOpen}>Aktiver Lernplan</CardTitle>
        {!activePlan ? (
          <EmptyState icon={BookOpen} text="Kein aktiver Lernplan" />
        ) : todayStep ? (
          <div>
            <div className="text-xs text-[#8892a4] mb-2">
              {activePlan.subject} ·{" "}
              {Math.ceil(
                (new Date(activePlan.date + "T12:00:00").getTime() -
                  Date.now()) /
                  86400000,
              )}{" "}
              Tage bis zur Prüfung
            </div>
            <div className="flex gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg items-start">
              <div className="w-9 h-9 rounded-full bg-[#4f8ef7] text-white flex items-center justify-center text-sm font-bold font-mono shrink-0">
                {todayStep.dayNum}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{todayStep.title}</div>
                <div className="text-xs text-[#8892a4] mt-1">
                  {todayStep.desc}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-[#8892a4]">
            {activePlan.subject} ·{" "}
            {Math.ceil(
              (new Date(activePlan.date + "T12:00:00").getTime() - Date.now()) /
                86400000,
            )}{" "}
            Tage bis zur Prüfung
          </div>
        )}
      </Card>

      <Card>
        <CardTitle icon={CheckSquare}>Tagesziele</CardTitle>
        {goals.length === 0 ? (
          <EmptyState icon={CheckSquare} text="Keine Tagesziele" />
        ) : (
          goals.map((g) => {
            const done = goalDone[g.id] ?? false;
            return (
              <div
                key={g.id}
                className="flex items-start gap-3 p-3 bg-[#1e2535] rounded-lg mb-2"
              >
                <button
                  onClick={() => toggleGoal(g.id)}
                  className={`w-[22px] h-[22px] rounded-md border-[1.5px] flex items-center justify-center shrink-0 mt-px transition-all ${done ? "bg-[#22c55e] border-[#22c55e]" : "bg-transparent border-white/20"}`}
                >
                  {done && <span className="text-white text-xs">✓</span>}
                </button>
                <div className="flex-1">
                  <div
                    className={`text-sm ${done ? "line-through text-[#8892a4]" : ""}`}
                  >
                    {g.text}
                  </div>
                  <div className="text-[11px] text-[#8892a4] mt-0.5">
                    {g.repeat === "daily" ? "Täglich" : "Heute"}
                  </div>
                </div>
                <button
                  onClick={() => deleteGoal(g.id)}
                  className="text-[#8892a4] hover:text-[#f87171] transition-colors p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
        <AddButton onClick={onAddGoal}>Ziel hinzufügen</AddButton>
      </Card>
    </div>
  );
}

function AsyncStreakRow({
  def,
  today,
}: {
  def: { key: string; label: string; target: number; color: string };
  today: string;
}) {
  const [s, setS] = useState(0);
  const [val, setVal] = useState(0);

  useEffect(() => {
    getStreak(def.key).then(setS);
    DB.get<number>(def.key + today, 0).then(setVal);
  }, [def.key, today]);

  const pct = Math.min(100, (val / def.target) * 100);

  return (
    <div className="flex items-center gap-2.5 mb-2">
      <span className="text-[13px] font-medium w-[90px] shrink-0">
        {def.label}
      </span>
      <div className="flex-1 h-1.5 bg-[#1e2535] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: pct + "%", background: def.color }}
        />
      </div>
      <span className="text-[12px] font-mono text-[#8892a4]">{s}d 🔥</span>
    </div>
  );
}
