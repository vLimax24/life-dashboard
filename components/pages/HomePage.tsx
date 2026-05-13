"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { AddButton } from "@/components/ui/AddButton";
import { EmptyState } from "@/components/ui/EmptyState";
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
  Zap,
  Plus,
  Minus,
} from "lucide-react";

const QUOTES = [
  "Disziplin ist die Brücke zwischen Zielen und Erfolg.",
  "Kleine Schritte täglich führen zu großen Ergebnissen.",
  "Nicht Talent, sondern Konsequenz entscheidet über Erfolg.",
  "Jeder Tag ist eine neue Chance, besser zu werden.",
  "Die Investition in Wissen bringt immer die besten Zinsen.",
];

interface HomeworkItem {
  id: number;
  text: string;
  subject?: string;
  dueDate?: string;
  done: boolean;
  createdAt: string;
}

const SUBJECT_MAP: Record<string, string> = {
  math: "Mathe",
  mathe: "Mathe",
  deutsch: "Deutsch",
  de: "Deutsch",
  englisch: "Englisch",
  en: "Englisch",
  physik: "Physik",
  ph: "Physik",
  chemie: "Chemie",
  bio: "Biologie",
  biologie: "Biologie",
  geo: "Geografie",
  geschichte: "Geschichte",
  sport: "Sport",
  kunst: "Kunst",
};

const WEEKDAY_MAP: Record<string, number> = {
  montag: 1,
  mo: 1,
  dienstag: 2,
  di: 2,
  mittwoch: 3,
  mi: 3,
  donnerstag: 4,
  do: 4,
  freitag: 5,
  fr: 5,
  samstag: 6,
  sa: 6,
};

function parseHomework(raw: string): Partial<HomeworkItem> {
  const parts = raw.trim().split(/\s+/);
  let subject: string | undefined;
  let dueDate: string | undefined;
  const rest: string[] = [];
  for (const p of parts) {
    const l = p.toLowerCase().replace(/[.,!?]$/, "");
    if (SUBJECT_MAP[l]) subject = SUBJECT_MAP[l];
    else if (WEEKDAY_MAP[l] !== undefined) {
      const target = WEEKDAY_MAP[l];
      const now = new Date();
      const diff = (target - now.getDay() + 7) % 7 || 7;
      const d = new Date(now);
      d.setDate(d.getDate() + diff);
      dueDate = d.toISOString().split("T")[0];
    } else rest.push(p);
  }
  return { subject, dueDate, text: rest.join(" ") || raw };
}

// ─── Pushup Ring Tracker ──────────────────────────────────────────────────────

function PushupTracker({ refreshKey }: { refreshKey: number }) {
  const today = DB.getToday();
  const GOAL = 100;
  const [count, setCount] = useState(0);
  const [adding, setAdding] = useState(10);
  const [streak, setStreak] = useState(0);
  const [burst, setBurst] = useState(false);

  const load = useCallback(async () => {
    const [val, map] = await Promise.all([
      DB.get<number>("pushups_" + today, 0),
      DB.getByPrefix<number>("pushups_"),
    ]);
    setCount(val);
    const goalMap: Record<string, number> = {};
    for (const [k, v] of Object.entries(map)) goalMap[k] = v >= GOAL ? 1 : 0;
    setStreak(computeStreak(goalMap, "pushups_", 1));
  }, [today]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const add = async (n: number) => {
    const newVal = Math.max(0, Math.min(999, count + n));
    setCount(newVal);
    setBurst(true);
    setTimeout(() => setBurst(false), 350);
    await DB.set("pushups_" + today, newVal);
  };

  const pct = Math.min(1, count / GOAL);
  const done = count >= GOAL;

  // SVG ring
  const R = 46;
  const circumference = 2 * Math.PI * R;
  const dashOffset = circumference * (1 - pct);

  return (
    <Card className={done ? "border-[#4ade80]/30" : ""}>
      <div className="flex items-center justify-between mb-4">
        <CardTitle icon={Zap}>Liegestütze</CardTitle>
        {streak > 0 && (
          <span className="text-[12px] text-[#f59e0b] font-semibold flex items-center gap-1">
            <Flame size={12} /> {streak}d Streak
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* SVG Ring */}
        <div className="relative shrink-0 w-[120px] h-[120px]">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke="#1e2535"
              strokeWidth="9"
            />
            <circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke={done ? "#4ade80" : "#4f8ef7"}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 60 60)"
              style={{
                transition:
                  "stroke-dashoffset 0.45s cubic-bezier(0.4,0,0.2,1), stroke 0.3s",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span
              className="text-[26px] font-bold font-mono leading-none transition-all duration-200"
              style={{
                color: done ? "#4ade80" : "#f0f2f7",
                transform: burst ? "scale(1.18)" : "scale(1)",
              }}
            >
              {count}
            </span>
            <span className="text-[11px] text-[#4a5568] mt-0.5">/ {GOAL}</span>
            {done && (
              <span className="text-[9px] text-[#4ade80] font-bold mt-0.5">
                DONE ✓
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 space-y-3">
          {/* Set size */}
          <div className="flex gap-1.5 flex-wrap">
            {[5, 10, 15, 20, 25].map((n) => (
              <button
                key={n}
                onClick={() => setAdding(n)}
                className={`px-2.5 py-1 rounded-[8px] text-[12px] font-semibold transition-all ${
                  adding === n
                    ? "bg-[#4f8ef7] text-white"
                    : "bg-[#1e2535] text-[#8892a4]"
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          {/* +/- */}
          <div className="flex gap-2">
            <button
              onClick={() => add(adding)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#4f8ef7] text-white rounded-[10px] py-2.5 text-[15px] font-bold active:scale-95 transition-transform"
            >
              <Plus size={15} />
              {adding}
            </button>
            <button
              onClick={() => add(-adding)}
              className="bg-[#1e2535] text-[#8892a4] rounded-[10px] w-10 flex items-center justify-center hover:text-white transition-colors"
            >
              <Minus size={14} />
            </button>
          </div>

          <p className="text-[12px] text-[#8892a4]">
            {done
              ? count > GOAL
                ? `+${count - GOAL} extra 🔥`
                : "Tagesziel erreicht! 💪"
              : `Noch ${GOAL - count} übrig`}
          </p>
        </div>
      </div>

      {/* Progress dots */}
      <div className="mt-3.5 flex gap-[3px]">
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{
              background:
                i < Math.round(pct * 20)
                  ? done
                    ? "#4ade80"
                    : "#4f8ef7"
                  : "#1e2535",
            }}
          />
        ))}
      </div>
    </Card>
  );
}

// ─── Water Tracker ────────────────────────────────────────────────────────────

function WaterTracker({
  water,
  onToggle,
}: {
  water: number;
  onToggle: (i: number) => void;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <CardTitle icon={Droplets}>Wasser</CardTitle>
        <span className="text-[13px] font-bold text-[#60a5fa] font-mono">
          {water} / 8
        </span>
      </div>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: "repeat(8, 1fr)" }}
      >
        {Array.from({ length: 8 }, (_, i) => (
          <button
            key={i}
            onClick={() => onToggle(i)}
            className="relative overflow-hidden rounded-[4px_4px_7px_7px] transition-all duration-300 active:scale-90"
            style={{
              aspectRatio: "0.65",
              border: `1.5px solid ${i < water ? "#3b82f6" : "rgba(255,255,255,0.07)"}`,
              background:
                i < water
                  ? "linear-gradient(180deg,#93c5fd,#2563eb)"
                  : "#1e2535",
            }}
          >
            <Droplets
              size={10}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
                color:
                  i < water
                    ? "rgba(255,255,255,0.9)"
                    : "rgba(255,255,255,0.12)",
              }}
            />
          </button>
        ))}
      </div>
      <p className="text-[11px] text-[#4a5568] text-center mt-2">
        {water >= 8
          ? "✓ Ziel erreicht!"
          : `${water * 250} ml · noch ${(8 - water) * 250} ml`}
      </p>
    </Card>
  );
}

// ─── Props & Main ─────────────────────────────────────────────────────────────

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
  const [greeting, setGreeting] = useState("");
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [goalDone, setGoalDone] = useState<Record<number, boolean>>({});
  const [events, setEvents] = useState<Event[]>([]);
  const [activePlan, setActivePlan] = useState<ExamPlan | null>(null);
  const [streaks, setStreaks] = useState<
    { label: string; val: number; color: string }[]
  >([]);
  const [dailyFocus, setDailyFocus] = useState<{
    school: string;
    health: string;
    personal: string;
  } | null>(null);
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [hwInput, setHwInput] = useState("");
  const hwRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const scalarKeys = [
      "profile_name",
      "daily_goals",
      "events",
      "exam_plans",
      `daily_focus_${today}`,
      "homework",
    ];
    const [scalars, waterMap, studyMap, workoutMap] = await Promise.all([
      DB.getMany<unknown>(scalarKeys, null),
      DB.getByPrefix<number>("water_"),
      DB.getByPrefix<number>("study_"),
      DB.getByPrefix<number>("workout_"),
    ]);

    setName((scalars["profile_name"] as string) ?? "");
    setWater((waterMap["water_" + today] ?? 0) as number);

    setStreaks([
      {
        label: "💧 Wasser",
        val: computeStreak(waterMap, "water_", 8),
        color: "#60a5fa",
      },
      {
        label: "📚 Lernen",
        val: computeStreak(studyMap, "study_", 1),
        color: "#818cf8",
      },
      {
        label: "💪 Training",
        val: computeStreak(workoutMap, "workout_", 1),
        color: "#4ade80",
      },
    ]);

    const allGoals = (scalars["daily_goals"] as DailyGoal[]) ?? [];
    const filtered = allGoals.filter(
      (g) => g.repeat === "daily" || g.date === today,
    );
    setGoals(filtered);

    const doneBatch = await DB.getMany<boolean>(
      filtered.map((g) => `goal_done_${g.id}_${today}`),
      false,
    );
    const doneMap: Record<number, boolean> = {};
    for (const g of filtered)
      doneMap[g.id] = doneBatch[`goal_done_${g.id}_${today}`] ?? false;
    setGoalDone(doneMap);

    const ev = (scalars["events"] as Event[]) ?? [];
    setEvents(ev.filter((e) => e.date >= today).slice(0, 5));
    const exams = (scalars["exam_plans"] as ExamPlan[]) ?? [];
    setActivePlan(exams.filter((e) => e.date >= today)[0] || null);

    const focus = scalars[`daily_focus_${today}`] as {
      school: string;
      health: string;
      personal: string;
    } | null;
    setDailyFocus(
      focus?.school || focus?.health || focus?.personal ? focus : null,
    );
    setHomework((scalars["homework"] as HomeworkItem[]) ?? []);
  }, [today]);

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Guten Morgen" : h < 17 ? "Hey" : "Guten Abend");
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const toggleWater = async (idx: number) => {
    const newVal = idx < water ? idx : idx + 1;
    await DB.set("water_" + today, newVal);
    setWater(newVal);
  };

  const toggleGoal = async (id: number) => {
    const was = goalDone[id] ?? false;
    await DB.set(`goal_done_${id}_${today}`, !was);
    setGoalDone((p) => ({ ...p, [id]: !was }));
  };

  const deleteGoal = async (id: number) => {
    const all = await DB.get<DailyGoal[]>("daily_goals", []);
    await DB.set(
      "daily_goals",
      all.filter((g) => g.id !== id),
    );
    load();
  };

  const addHomework = async () => {
    if (!hwInput.trim()) return;
    const parsed = parseHomework(hwInput);
    const item: HomeworkItem = {
      id: Date.now(),
      text: parsed.text || hwInput,
      subject: parsed.subject,
      dueDate: parsed.dueDate,
      done: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [item, ...homework];
    setHomework(updated);
    await DB.set("homework", updated);
    setHwInput("");
  };

  const toggleHomework = async (id: number) => {
    const updated = homework.map((i) =>
      i.id === id ? { ...i, done: !i.done } : i,
    );
    setHomework(updated);
    await DB.set("homework", updated);
  };

  const removeHomework = async (id: number) => {
    const updated = homework.filter((i) => i.id !== id);
    setHomework(updated);
    await DB.set("homework", updated);
  };

  const doneGoals = goals.filter((g) => goalDone[g.id]).length;
  const todayStep = activePlan?.plan.find((p) => p.date === today);
  const activeHw = homework.filter((h) => !h.done);
  const nextEvent = events[0];

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

  return (
    <div className="pt-1 pb-2">
      {/* ══ Hero card ══════════════════════════════════════════════ */}
      <div
        className="relative rounded-[20px] overflow-hidden mb-3 px-5 pt-5 pb-5"
        style={{
          background:
            "linear-gradient(140deg, #162040 0%, #1b1838 55%, #0f1117 100%)",
        }}
      >
        {/* glow blobs */}
        <div
          className="absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(79,142,247,0.18) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-28 h-28 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(124,92,252,0.12) 0%, transparent 70%)",
          }}
        />

        <div className="relative">
          <p className="text-[13px] font-medium text-[#6b9fff] mb-1">
            {greeting}
            {name ? `, ${name}` : ""} 👋
          </p>
          <h1 className="text-[24px] font-bold leading-[1.2] mb-4 text-white">
            Was machst du
            <br />
            heute möglich?
          </h1>

          {/* 3-stat row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                val: `${doneGoals}/${goals.length}`,
                label: "Ziele",
                color: "#4ade80",
              },
              { val: `${water}/8`, label: "Wasser", color: "#60a5fa" },
              {
                val: String(events.length),
                label: "Termine",
                color: "#fbbf24",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-[12px] px-2 py-2.5 text-center"
                style={{
                  background: "rgba(0,0,0,0.28)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <p
                  className="text-[17px] font-bold font-mono"
                  style={{ color: s.color }}
                >
                  {s.val}
                </p>
                <p className="text-[10px] text-white/35 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ Quote ═════════════════════════════════════════════════ */}
      {quote && (
        <div className="mb-3 flex items-start gap-2.5 px-4 py-3 rounded-[14px] bg-[#161b27] border border-white/[0.05]">
          <span className="text-[#4f8ef7] text-[18px] leading-none font-serif mt-[-2px]">
            "
          </span>
          <p className="text-[12.5px] text-[#6a7891] leading-relaxed italic">
            {quote}
          </p>
        </div>
      )}

      {/* ══ Daily Focus pills (if set) ═════════════════════════════ */}
      {dailyFocus && (
        <div className="mb-3 flex gap-2">
          {[
            {
              key: "school" as const,
              emoji: "📚",
              color: "#60a5fa",
              label: "Schule",
            },
            {
              key: "health" as const,
              emoji: "💪",
              color: "#4ade80",
              label: "Fitness",
            },
            {
              key: "personal" as const,
              emoji: "✨",
              color: "#a78bfa",
              label: "Privat",
            },
          ]
            .filter((i) => dailyFocus[i.key])
            .map(({ key, emoji, color }) => (
              <div
                key={key}
                className="flex-1 bg-[#161b27] border border-white/[0.07] rounded-[12px] px-2 py-2.5 flex flex-col items-center gap-1"
              >
                <span className="text-[14px]">{emoji}</span>
                <p
                  className="text-[11px] font-medium text-center leading-tight truncate w-full text-center"
                  style={{ color }}
                >
                  {dailyFocus[key]}
                </p>
              </div>
            ))}
        </div>
      )}

      {/* ══ Streaks ═══════════════════════════════════════════════ */}
      <div className="flex gap-2 mb-3">
        {streaks.map((s) => (
          <div
            key={s.label}
            className="flex-1 bg-[#161b27] border border-white/[0.07] rounded-[14px] px-2 py-3 flex flex-col items-center gap-1.5"
          >
            <span
              className="text-[22px] font-bold font-mono leading-none"
              style={{ color: s.color }}
            >
              {s.val}
            </span>
            <span className="text-[10px] text-[#4a5568] leading-tight text-center">
              {s.label}
              <br />
              Streak
            </span>
          </div>
        ))}
      </div>

      {/* ══ Water ═════════════════════════════════════════════════ */}
      <WaterTracker water={water} onToggle={toggleWater} />

      {/* ══ Pushups ═══════════════════════════════════════════════ */}
      <PushupTracker refreshKey={refreshKey} />

      {/* ══ Urgent event banner ════════════════════════════════════ */}
      {nextEvent &&
        (() => {
          const d = new Date(nextEvent.date + "T12:00:00");
          const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
          const urgent = diff <= 2;
          return (
            <div
              className="mb-3 flex items-center gap-3 px-3.5 py-3 rounded-[14px] border"
              style={{
                background: urgent
                  ? "rgba(248,113,113,0.07)"
                  : "rgba(79,142,247,0.05)",
                borderColor: urgent
                  ? "rgba(248,113,113,0.22)"
                  : "rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: eventColors[nextEvent.type] }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate">
                  {nextEvent.title}
                </p>
                <p className="text-[11px] text-[#4a5568]">
                  {diff === 0
                    ? "Heute"
                    : diff === 1
                      ? "Morgen"
                      : `in ${diff} Tagen`}
                </p>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-1 rounded-full badge-${nextEvent.type}`}
              >
                {eventLabels[nextEvent.type]}
              </span>
            </div>
          );
        })()}

      {/* ══ Goals ════════════════════════════════════════════════ */}
      <Card>
        <div className="flex items-center justify-between mb-2.5">
          <CardTitle icon={CheckSquare}>Tagesziele</CardTitle>
          <span className="text-[12px] text-[#4a5568]">
            {doneGoals}/{goals.length}
          </span>
        </div>
        {goals.length > 0 && (
          <div className="h-[3px] bg-[#1e2535] rounded-full mb-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(doneGoals / goals.length) * 100}%`,
                background: doneGoals === goals.length ? "#4ade80" : "#4f8ef7",
              }}
            />
          </div>
        )}
        {goals.length === 0 ? (
          <EmptyState icon={CheckSquare} text="Keine Tagesziele" />
        ) : (
          <div className="space-y-1.5">
            {goals.map((g) => {
              const done = goalDone[g.id] ?? false;
              return (
                <div
                  key={g.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] transition-colors ${done ? "bg-[#141f14]" : "bg-[#1e2535]"}`}
                >
                  <button
                    onClick={() => toggleGoal(g.id)}
                    className={`w-5 h-5 rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0 transition-all ${done ? "bg-[#4ade80] border-[#4ade80]" : "border-white/[0.18]"}`}
                  >
                    {done && (
                      <span className="text-[#0f1117] text-[10px] font-bold">
                        ✓
                      </span>
                    )}
                  </button>
                  <p
                    className={`flex-1 text-[13px] leading-snug ${done ? "line-through text-[#4a5568]" : ""}`}
                  >
                    {g.text}
                  </p>
                  <button
                    onClick={() => deleteGoal(g.id)}
                    className="text-[#323d50] hover:text-[#f87171] p-1 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-2">
          <AddButton onClick={onAddGoal}>Ziel hinzufügen</AddButton>
        </div>
      </Card>

      {/* ══ Homework ════════════════════════════════════════════════ */}
      <Card>
        <CardTitle icon={Zap}>Hausaufgaben</CardTitle>
        <div className="flex gap-2 mb-2.5">
          <input
            ref={hwRef}
            value={hwInput}
            onChange={(e) => setHwInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addHomework()}
            placeholder='"Mathe S.42 Freitag"'
            className="flex-1 bg-[#1e2535] border border-white/[0.09] rounded-[10px] px-3 py-2.5 text-[14px] text-[#f0f2f7] placeholder-[#323d50] focus:outline-none focus:border-[#4f8ef7]/50 transition-colors"
          />
          <button
            onClick={addHomework}
            disabled={!hwInput.trim()}
            className="bg-[#4f8ef7] text-white rounded-[10px] w-10 flex items-center justify-center disabled:opacity-35 active:scale-95 transition-all"
          >
            <Plus size={16} />
          </button>
        </div>
        {activeHw.length === 0 ? (
          <p className="text-[12px] text-[#4a5568] text-center py-1">
            Alle erledigt ✓
          </p>
        ) : (
          <div>
            {activeHw.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2.5 py-2.5 border-b border-white/[0.05] last:border-0"
              >
                <button
                  onClick={() => toggleHomework(item.id)}
                  className="w-4 h-4 rounded border border-white/[0.18] flex items-center justify-center shrink-0 hover:border-[#4ade80] transition-colors"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px]">{item.text}</p>
                  <div className="flex gap-2 mt-0.5">
                    {item.subject && (
                      <span className="text-[10px] text-[#60a5fa]">
                        {item.subject}
                      </span>
                    )}
                    {item.dueDate && (
                      <span className="text-[10px] text-[#f59e0b]">
                        {new Date(
                          item.dueDate + "T12:00:00",
                        ).toLocaleDateString("de-DE", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeHomework(item.id)}
                  className="text-[#323d50] hover:text-[#f87171] p-1 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
        {homework.filter((h) => h.done).length > 0 && (
          <p className="text-[10px] text-[#323d50] text-center mt-2">
            {homework.filter((h) => h.done).length} erledigt
          </p>
        )}
      </Card>

      {/* ══ Exam plan ════════════════════════════════════════════ */}
      {activePlan && (
        <Card>
          <CardTitle icon={BookOpen}>Aktiver Lernplan</CardTitle>
          <div className="flex items-start gap-3 bg-[#1e2535] rounded-[10px] p-3">
            <div className="w-9 h-9 rounded-full bg-[#4f8ef7] text-white flex items-center justify-center text-[13px] font-bold shrink-0">
              {todayStep ? todayStep.dayNum : "—"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold">{activePlan.subject}</p>
              {todayStep ? (
                <>
                  <p className="text-[13px] font-medium mt-0.5">
                    {todayStep.title}
                  </p>
                  <p className="text-[11px] text-[#8892a4] mt-0.5">
                    {todayStep.desc}
                  </p>
                </>
              ) : (
                <p className="text-[12px] text-[#8892a4] mt-0.5">
                  Noch{" "}
                  {Math.ceil(
                    (new Date(activePlan.date + "T12:00:00").getTime() -
                      Date.now()) /
                      86400000,
                  )}{" "}
                  Tage
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ══ Upcoming events ══════════════════════════════════════ */}
      <Card>
        <div className="flex items-center justify-between mb-2.5">
          <CardTitle icon={CalendarClock}>Termine</CardTitle>
          <button
            onClick={onAddEvent}
            className="text-[12px] text-[#4f8ef7] flex items-center gap-1"
          >
            <Plus size={12} /> Neu
          </button>
        </div>
        {events.length === 0 ? (
          <EmptyState icon={CalendarDays} text="Keine Termine" />
        ) : (
          <div className="space-y-1.5">
            {events.map((e) => {
              const diff = Math.ceil(
                (new Date(e.date + "T12:00:00").getTime() - Date.now()) /
                  86400000,
              );
              return (
                <div
                  key={e.id}
                  className="flex items-center gap-3 px-3 py-2.5 bg-[#1e2535] rounded-[10px]"
                >
                  <div
                    className="w-[7px] h-[7px] rounded-full shrink-0"
                    style={{ background: eventColors[e.type] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">
                      {e.title}
                      {e.subject ? ` · ${e.subject}` : ""}
                    </p>
                    <p className="text-[11px] text-[#4a5568]">
                      {diff === 0
                        ? "Heute"
                        : diff === 1
                          ? "Morgen"
                          : `in ${diff} Tagen`}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold badge-${e.type}`}
                  >
                    {eventLabels[e.type]}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
