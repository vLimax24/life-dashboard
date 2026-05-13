"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { AddButton } from "@/components/ui/AddButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { StreakGrid } from "@/components/ui/StreakGrid";
import * as DB from "@/lib/db";
import { computeStreak } from "@/lib/streaks";
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
  CircleDot,
  Target,
  Plus,
  Zap,
} from "lucide-react";

const QUOTES = [
  '"Disziplin ist die Brücke zwischen Zielen und Erfolg."',
  '"Du musst dich nicht großartig fühlen, um anzufangen. Aber du musst anfangen, um dich großartig zu fühlen."',
  '"Jeder Tag ist eine neue Chance, besser zu werden."',
  '"Kleine Schritte täglich führen zu großen Ergebnissen."',
  '"Die Investition in Wissen bringt immer die besten Zinsen."',
  '"Nicht Talent, sondern Konsequenz entscheidet über Erfolg."',
];

interface StreakDef {
  key: string;
  label: string;
  target: number;
  color: string;
}

const STREAK_DEFS: StreakDef[] = [
  { key: "water_", label: "💧 Wasser", target: 8, color: "#60a5fa" },
  { key: "study_", label: "📚 Gelernt", target: 1, color: "#818cf8" },
  { key: "workout_", label: "💪 Training", target: 1, color: "#4ade80" },
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
  // streakMaps[prefix] = the full prefix map for that tracker
  const [streakMaps, setStreakMaps] = useState<Record<string, Record<string, number>>>({});
  const [streaks, setStreaks] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    // One batch for scalar/list keys
    const scalarKeys = ["profile_name", "daily_goals", "events", "exam_plans"];
    const [scalars, waterMap, studyMap, workoutMap] = await Promise.all([
      DB.getMany<unknown>(scalarKeys, null),
      DB.getByPrefix<number>("water_"),
      DB.getByPrefix<number>("study_"),
      DB.getByPrefix<number>("workout_"),
    ]);

    const n = (scalars["profile_name"] as string) ?? "";
    const allGoals = (scalars["daily_goals"] as DailyGoal[]) ?? [];
    const ev = (scalars["events"] as Event[]) ?? [];
    const exams = (scalars["exam_plans"] as ExamPlan[]) ?? [];

    setName(n);

    const waterVal = (waterMap["water_" + today] ?? 0) as number;
    setWater(waterVal);

    // Compute all streaks from maps (no extra requests)
    const maps: Record<string, Record<string, number>> = {
      water_: waterMap,
      study_: studyMap,
      workout_: workoutMap,
    };
    setStreakMaps(maps);

    const newStreaks: Record<string, number> = {};
    for (const def of STREAK_DEFS) {
      newStreaks[def.key] = computeStreak(maps[def.key], def.key, def.target);
    }
    setStreaks(newStreaks);

    const filtered = allGoals.filter(
      (g) => g.repeat === "daily" || g.date === today
    );
    setGoals(filtered);

    // Batch-fetch all goal_done keys for today in ONE request
    const goalDoneKeys = filtered.map((g) => `goal_done_${g.id}_${today}`);
    const doneBatch = await DB.getMany<boolean>(goalDoneKeys, false);
    const doneMap: Record<number, boolean> = {};
    for (const g of filtered) {
      doneMap[g.id] = doneBatch[`goal_done_${g.id}_${today}`] ?? false;
    }
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
    const cur = water;
    const newVal = idx < cur ? idx : idx + 1;
    await DB.set("water_" + today, newVal);
    setWater(newVal);
  };

  const toggleGoal = async (id: number) => {
    const key = "goal_done_" + id + "_" + today;
    const was = goalDone[id] ?? false;
    await DB.set(key, !was);
    setGoalDone((prev) => ({ ...prev, [id]: !was }));
  };

  const deleteGoal = async (id: number) => {
    const allGoals = await DB.get<DailyGoal[]>("daily_goals", []);
    await DB.set(
      "daily_goals",
      allGoals.filter((g) => g.id !== id)
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
  const waterStreak = streaks["water_"] ?? 0;

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
            val: waterStreak,
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
        {STREAK_DEFS.map((def) => {
          const map = streakMaps[def.key] ?? {};
          const val = (map[def.key + today] ?? 0) as number;
          const pct = Math.min(100, (val / def.target) * 100);
          const s = streaks[def.key] ?? 0;
          return (
            <div key={def.key} className="flex items-center gap-2.5 mb-2">
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
        })}
        <div className="mt-3">
          <div className="text-[12px] text-[#8892a4] mb-1.5">
            Letzte 91 Tage
          </div>
          <StreakGrid
            prefix="water_"
            target={8}
            color="#60a5fa"
            prefetchedMap={streakMaps["water_"]}
          />
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
                  86400000
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
                86400000
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

      {/* Daily Focus mini-widget */}
      <DailyFocusMini today={today} refreshKey={refreshKey} />

      {/* Homework Quick Capture */}
      <HomeworkCapture refreshKey={refreshKey} onToast={() => {}} />
    </div>
  );
}

// ─── Daily Focus Mini Widget ──────────────────────────────────────────────────
function DailyFocusMini({ today, refreshKey }: { today: string; refreshKey: number }) {
  const [focus, setFocus] = useState<{ school: string; health: string; personal: string } | null>(null);

  useEffect(() => {
    DB.get<{ school: string; health: string; personal: string } | null>(`daily_focus_${today}`, null).then(setFocus);
  }, [today, refreshKey]);

  if (!focus || (!focus.school && !focus.health && !focus.personal)) return null;

  const items = [
    { key: "school" as const, emoji: "📚", color: "#60a5fa" },
    { key: "health" as const, emoji: "💪", color: "#4ade80" },
    { key: "personal" as const, emoji: "✨", color: "#a78bfa" },
  ].filter(i => focus[i.key]);

  return (
    <Card>
      <CardTitle icon={Target}>Heutiger Fokus</CardTitle>
      <div className="flex gap-2 flex-wrap">
        {items.map(({ key, emoji, color }) => (
          <div key={key} className="flex items-center gap-1.5 bg-[#1e2535] rounded-xl px-3 py-1.5 text-[13px]">
            <span>{emoji}</span>
            <span style={{ color }} className="font-medium">{focus[key]}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Homework Quick Capture ───────────────────────────────────────────────────
interface HomeworkItem {
  id: number;
  text: string;
  subject?: string;
  dueDate?: string;
  done: boolean;
  createdAt: string;
}

const SUBJECT_SHORTCUTS: Record<string, string> = {
  math: "Mathe", mathe: "Mathe", m: "Mathe",
  deutsch: "Deutsch", de: "Deutsch", d: "Deutsch",
  englisch: "Englisch", en: "Englisch", e: "Englisch",
  physik: "Physik", ph: "Physik",
  chemie: "Chemie", ch: "Chemie",
  bio: "Biologie", biologie: "Biologie",
  geo: "Geografie", geografie: "Geografie",
  geschichte: "Geschichte", ge: "Geschichte",
  sport: "Sport", sp: "Sport",
  kunst: "Kunst", ku: "Kunst",
};

const WEEKDAYS: Record<string, number> = {
  montag: 1, mo: 1, dienstag: 2, di: 2, mittwoch: 3, mi: 3,
  donnerstag: 4, do: 4, freitag: 5, fr: 5, samstag: 6, sa: 6, sonntag: 0, so: 0,
};

function parseHomework(raw: string): Partial<HomeworkItem> {
  const parts = raw.trim().split(/\s+/);
  let subject: string | undefined;
  let dueDate: string | undefined;
  const textParts: string[] = [];

  for (const part of parts) {
    const lower = part.toLowerCase().replace(/[.,!?]$/, "");
    if (SUBJECT_SHORTCUTS[lower]) {
      subject = SUBJECT_SHORTCUTS[lower];
    } else if (WEEKDAYS[lower] !== undefined) {
      const target = WEEKDAYS[lower];
      const now = new Date();
      const diff = ((target - now.getDay()) + 7) % 7 || 7;
      const due = new Date(now);
      due.setDate(due.getDate() + diff);
      dueDate = due.toISOString().split("T")[0];
    } else {
      textParts.push(part);
    }
  }

  return { subject, dueDate, text: textParts.join(" ") || raw };
}

function HomeworkCapture({ refreshKey, onToast }: { refreshKey: number; onToast: (m: string) => void }) {
  const [items, setItems] = useState<HomeworkItem[]>([]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    DB.get<HomeworkItem[]>("homework", []).then(setItems);
  }, [refreshKey]);

  const add = async () => {
    if (!input.trim()) return;
    const parsed = parseHomework(input);
    const item: HomeworkItem = {
      id: Date.now(),
      text: parsed.text || input,
      subject: parsed.subject,
      dueDate: parsed.dueDate,
      done: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [item, ...items];
    setItems(updated);
    await DB.set("homework", updated);
    setInput("");
    inputRef.current?.focus();
  };

  const toggle = async (id: number) => {
    const updated = items.map(i => i.id === id ? { ...i, done: !i.done } : i);
    setItems(updated);
    await DB.set("homework", updated);
  };

  const remove = async (id: number) => {
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    await DB.set("homework", updated);
  };

  const active = items.filter(i => !i.done);
  const done = items.filter(i => i.done);

  return (
    <Card>
      <CardTitle icon={Zap}>Hausaufgaben</CardTitle>
      <div className="flex gap-2 mb-3">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
          placeholder='z.B. "Mathe S.42 Freitag"'
          className="flex-1 bg-[#1e2535] border border-white/[0.12] rounded-xl px-3 py-2 text-[13px] text-[#f0f2f7] placeholder-[#4a5568] focus:outline-none focus:border-[#4f8ef7] transition-colors"
        />
        <button
          onClick={add}
          disabled={!input.trim()}
          className="bg-[#4f8ef7]/20 text-[#4f8ef7] rounded-xl px-3 flex items-center disabled:opacity-40 hover:bg-[#4f8ef7]/30 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
      <p className="text-[11px] text-[#4a5568] mb-3">Tipp: Fach + Tag automatisch erkannt (z.B. "Mathe Freitag")</p>

      {active.length === 0 && <p className="text-[13px] text-[#4a5568] text-center py-2">Keine offenen Hausaufgaben ✓</p>}

      {active.map(item => (
        <div key={item.id} className="flex items-center gap-2.5 py-2 border-b border-white/[0.05] last:border-0">
          <button onClick={() => toggle(item.id)} className="w-5 h-5 rounded border border-white/20 flex items-center justify-center shrink-0 hover:border-[#4ade80] transition-colors">
            <span className="text-[10px] opacity-0 hover:opacity-100">✓</span>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[13px]">{item.text}</p>
            <div className="flex gap-2 mt-0.5">
              {item.subject && <span className="text-[10px] text-[#60a5fa]">{item.subject}</span>}
              {item.dueDate && <span className="text-[10px] text-[#f59e0b]">{new Date(item.dueDate + "T12:00:00").toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" })}</span>}
            </div>
          </div>
          <button onClick={() => remove(item.id)} className="text-[#4a5568] hover:text-[#f87171] p-1 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      ))}

      {done.length > 0 && (
        <p className="text-[11px] text-[#4a5568] text-center mt-2">{done.length} erledigt</p>
      )}
    </Card>
  );
}
