"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import * as DB from "@/lib/db";
import {
  Inbox,
  Brain,
  Sun,
  Moon,
  Smile,
  CheckCircle2,
  Circle,
  Plus,
  X,
  Tag,
  CalendarPlus,
  Target,
  Archive,
  GripVertical,
  Timer,
  Flame,
  Zap,
  TrendingUp,
  ChevronRight,
  Check,
  Sparkles,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface BrainItem {
  id: number;
  text: string;
  tag?: string;
  createdAt: string;
  done: boolean;
  archived: boolean;
  convertedTo?: "task" | "event" | "goal";
}

interface RoutineStep {
  id: number;
  text: string;
  category: "health" | "hygiene" | "planning" | "mindset" | "other";
  estimatedMin: number;
  hasTimer: boolean;
}

interface DailyFocus {
  school: string;
  health: string;
  personal: string;
  date: string;
}

interface MoodEntry {
  date: string;
  energy: number;
  stress: number;
  focus: number;
  mood: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TAGS = ["Schule", "Fitness", "Privat", "Idee", "Wichtig"];
const CAT_COLORS: Record<string, string> = {
  health: "#4ade80",
  hygiene: "#60a5fa",
  planning: "#f59e0b",
  mindset: "#a78bfa",
  other: "#8892a4",
};
const CAT_LABELS: Record<string, string> = {
  health: "Gesundheit",
  hygiene: "Hygiene",
  planning: "Planung",
  mindset: "Mindset",
  other: "Sonstiges",
};

const DEFAULT_MORNING: RoutineStep[] = [
  { id: 1, text: "Wasser trinken", category: "health", estimatedMin: 1, hasTimer: false },
  { id: 2, text: "Strecken", category: "health", estimatedMin: 5, hasTimer: true },
  { id: 3, text: "Frühstück", category: "health", estimatedMin: 15, hasTimer: false },
  { id: 4, text: "Tag überblicken", category: "planning", estimatedMin: 3, hasTimer: true },
];

const DEFAULT_EVENING: RoutineStep[] = [
  { id: 1, text: "Schulranzen vorbereiten", category: "planning", estimatedMin: 5, hasTimer: false },
  { id: 2, text: "Offene Aufgaben prüfen", category: "planning", estimatedMin: 5, hasTimer: false },
  { id: 3, text: "Morgen planen", category: "planning", estimatedMin: 5, hasTimer: true },
  { id: 4, text: "Handy weglegen", category: "mindset", estimatedMin: 1, hasTimer: false },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Slider({
  label,
  emoji,
  value,
  onChange,
  color,
}: {
  label: string;
  emoji: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[13px] text-[#c8d0e0]">
          {emoji} {label}
        </span>
        <span className="text-[13px] font-semibold" style={{ color }}>
          {value}/10
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${(value - 1) * 11.1}%, #1e2535 ${(value - 1) * 11.1}%, #1e2535 100%)`,
        }}
      />
    </div>
  );
}

function RoutineStepItem({
  step,
  done,
  onToggle,
  activeTimer,
  onStartTimer,
}: {
  step: RoutineStep;
  done: boolean;
  onToggle: () => void;
  activeTimer: { id: number; remaining: number } | null;
  onStartTimer: (id: number, seconds: number) => void;
}) {
  const isTimerActive = activeTimer?.id === step.id;
  const color = CAT_COLORS[step.category];

  return (
    <div
      className={`flex items-center gap-3 py-2.5 border-b border-white/[0.06] last:border-0 transition-opacity ${done ? "opacity-40" : ""}`}
    >
      <button onClick={onToggle} className="shrink-0 transition-transform active:scale-90">
        {done ? (
          <CheckCircle2 size={22} className="text-[#4ade80]" />
        ) : (
          <Circle size={22} style={{ color }} />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-[14px] font-medium ${done ? "line-through" : ""}`}>{step.text}</p>
        <p className="text-[11px] mt-0.5" style={{ color: color + "aa" }}>
          {CAT_LABELS[step.category]} · {step.estimatedMin} Min
        </p>
      </div>
      {step.hasTimer && !done && (
        <button
          onClick={() => onStartTimer(step.id, step.estimatedMin * 60)}
          className={`shrink-0 px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${isTimerActive ? "bg-[#f59e0b]/20 text-[#f59e0b]" : "bg-white/[0.06] text-[#8892a4] hover:text-white"}`}
        >
          {isTimerActive
            ? `${Math.floor(activeTimer!.remaining / 60)}:${String(activeTimer!.remaining % 60).padStart(2, "0")}`
            : <Timer size={13} />}
        </button>
      )}
    </div>
  );
}

// ─── Section: Brain Dump ──────────────────────────────────────────────────────

function BrainDumpSection({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<BrainItem[]>([]);
  const [input, setInput] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [showArchive, setShowArchive] = useState(false);
  const [converting, setConverting] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const data = await DB.get<BrainItem[]>("brain_dump", []);
    setItems(data);
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const save = async (updated: BrainItem[]) => {
    setItems(updated);
    await DB.set("brain_dump", updated);
  };

  const addItem = async () => {
    if (!input.trim()) return;
    const newItem: BrainItem = {
      id: Date.now(),
      text: input.trim(),
      tag: selectedTag,
      createdAt: new Date().toISOString(),
      done: false,
      archived: false,
    };
    await save([newItem, ...items]);
    setInput("");
    setSelectedTag(undefined);
    inputRef.current?.focus();
  };

  const toggle = async (id: number) => {
    await save(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  };

  const archive = async (id: number) => {
    await save(items.map((i) => (i.id === id ? { ...i, archived: true } : i)));
  };

  const remove = async (id: number) => {
    await save(items.filter((i) => i.id !== id));
  };

  const convertTo = async (id: number, type: "task" | "event" | "goal") => {
    await save(items.map((i) => (i.id === id ? { ...i, convertedTo: type, archived: true } : i)));
    setConverting(null);
  };

  const active = items.filter((i) => !i.archived);
  const archived = items.filter((i) => i.archived);

  return (
    <Card>
      <CardTitle icon={Inbox}>Brain Dump</CardTitle>
      {/* Quick input */}
      <div className="flex gap-2 mb-3">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="Gedanke raus... Enter drücken"
          className="flex-1 bg-[#1e2535] border border-white/[0.12] rounded-xl px-3 py-2.5 text-[14px] text-[#f0f2f7] placeholder-[#4a5568] focus:outline-none focus:border-[#4f8ef7] transition-colors"
          autoComplete="off"
        />
        <button
          onClick={addItem}
          disabled={!input.trim()}
          className="bg-[#4f8ef7]/20 text-[#4f8ef7] rounded-xl px-3 flex items-center justify-center disabled:opacity-40 hover:bg-[#4f8ef7]/30 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Tag selector */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {TAGS.map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTag(selectedTag === t ? undefined : t)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${selectedTag === t ? "bg-[#4f8ef7] text-white" : "bg-white/[0.06] text-[#8892a4] hover:text-white"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Items */}
      {active.length === 0 && (
        <p className="text-[13px] text-[#4a5568] text-center py-3">
          Kopf ist frei ✨
        </p>
      )}
      <div className="space-y-0.5">
        {active.map((item) => (
          <div key={item.id} className="group">
            <div className="flex items-start gap-2.5 py-2.5 border-b border-white/[0.05] last:border-0">
              <button onClick={() => toggle(item.id)} className="mt-0.5 shrink-0">
                {item.done ? (
                  <CheckCircle2 size={18} className="text-[#4ade80]" />
                ) : (
                  <Circle size={18} className="text-[#4a5568]" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-[14px] leading-snug ${item.done ? "line-through text-[#4a5568]" : "text-[#f0f2f7]"}`}>
                  {item.text}
                </p>
                {item.tag && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[11px] text-[#4f8ef7] bg-[#4f8ef7]/10 px-2 py-0.5 rounded-full">
                    <Tag size={9} /> {item.tag}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {converting === item.id ? (
                  <div className="flex gap-1">
                    <button onClick={() => convertTo(item.id, "task")} className="text-[11px] bg-[#4ade80]/10 text-[#4ade80] px-2 py-1 rounded-lg">Aufgabe</button>
                    <button onClick={() => convertTo(item.id, "event")} className="text-[11px] bg-[#f59e0b]/10 text-[#f59e0b] px-2 py-1 rounded-lg">Event</button>
                    <button onClick={() => convertTo(item.id, "goal")} className="text-[11px] bg-[#a78bfa]/10 text-[#a78bfa] px-2 py-1 rounded-lg">Ziel</button>
                    <button onClick={() => setConverting(null)} className="text-[#8892a4]"><X size={14} /></button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setConverting(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-[#8892a4] hover:text-[#4f8ef7] p-1 transition-all"
                    >
                      <ChevronRight size={14} />
                    </button>
                    <button
                      onClick={() => archive(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-[#8892a4] hover:text-[#f59e0b] p-1 transition-all"
                    >
                      <Archive size={14} />
                    </button>
                    <button
                      onClick={() => remove(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-[#8892a4] hover:text-[#f87171] p-1 transition-all"
                    >
                      <X size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {archived.length > 0 && (
        <button
          onClick={() => setShowArchive(!showArchive)}
          className="mt-3 text-[12px] text-[#4a5568] hover:text-[#8892a4] transition-colors w-full text-center"
        >
          {showArchive ? "Archiv ausblenden" : `${archived.length} archivierte Einträge`}
        </button>
      )}
      {showArchive && (
        <div className="mt-2 space-y-0.5 opacity-50">
          {archived.map((item) => (
            <div key={item.id} className="flex items-center gap-2 py-2 border-b border-white/[0.04] last:border-0">
              <Archive size={14} className="text-[#4a5568] shrink-0" />
              <p className="text-[13px] text-[#4a5568] line-through flex-1">{item.text}</p>
              {item.convertedTo && (
                <span className="text-[10px] bg-white/[0.06] px-1.5 py-0.5 rounded text-[#8892a4]">→ {item.convertedTo}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Section: Daily Focus ─────────────────────────────────────────────────────

function DailyFocusSection({ refreshKey }: { refreshKey: number }) {
  const today = DB.getToday();
  const [focus, setFocus] = useState<DailyFocus>({ school: "", health: "", personal: "", date: today });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<DailyFocus>({ school: "", health: "", personal: "", date: today });

  const load = useCallback(async () => {
    const data = await DB.get<DailyFocus>(`daily_focus_${today}`, { school: "", health: "", personal: "", date: today });
    setFocus(data);
    setDraft(data);
  }, [today]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const save = async () => {
    const updated = { ...draft, date: today };
    await DB.set(`daily_focus_${today}`, updated);
    setFocus(updated);
    setEditing(false);
  };

  const isEmpty = !focus.school && !focus.health && !focus.personal;

  const focusItems = [
    { key: "school" as const, label: "Schule", emoji: "📚", color: "#60a5fa" },
    { key: "health" as const, label: "Fitness", emoji: "💪", color: "#4ade80" },
    { key: "personal" as const, label: "Privat", emoji: "✨", color: "#a78bfa" },
  ];

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <CardTitle icon={Target}>3 Fokus heute</CardTitle>
        <button
          onClick={() => setEditing(!editing)}
          className="text-[12px] text-[#4f8ef7] hover:text-[#7c5cfc] transition-colors"
        >
          {editing ? "Abbrechen" : isEmpty ? "Setzen" : "Ändern"}
        </button>
      </div>

      {editing ? (
        <div className="space-y-2.5">
          {focusItems.map(({ key, label, emoji, color }) => (
            <div key={key}>
              <label className="text-[12px] mb-1 block" style={{ color: color + "cc" }}>
                {emoji} {label}
              </label>
              <input
                value={draft[key]}
                onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                placeholder={`Einen ${label}-Fokus...`}
                className="w-full bg-[#1e2535] border border-white/[0.12] rounded-xl px-3 py-2 text-[14px] text-[#f0f2f7] placeholder-[#4a5568] focus:outline-none focus:border-[#4f8ef7] transition-colors"
              />
            </div>
          ))}
          <button
            onClick={save}
            className="w-full bg-[#4f8ef7] text-white rounded-xl py-2.5 text-[14px] font-semibold mt-1 hover:bg-[#4f8ef7]/90 transition-colors"
          >
            Speichern
          </button>
        </div>
      ) : isEmpty ? (
        <p className="text-[13px] text-[#4a5568] text-center py-4">
          Noch kein Fokus gesetzt — was zählt heute?
        </p>
      ) : (
        <div className="space-y-2.5">
          {focusItems.map(({ key, label, emoji, color }) =>
            focus[key] ? (
              <div key={key} className="flex items-center gap-3 bg-[#1e2535] rounded-xl px-3 py-2.5">
                <span className="text-[18px]">{emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium mb-0.5" style={{ color: color + "bb" }}>
                    {label}
                  </p>
                  <p className="text-[14px] font-medium truncate">{focus[key]}</p>
                </div>
              </div>
            ) : null
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Section: Mood Tracker ────────────────────────────────────────────────────

function MoodSection({ refreshKey }: { refreshKey: number }) {
  const today = DB.getToday();
  const [entry, setEntry] = useState<MoodEntry>({ date: today, energy: 5, stress: 5, focus: 5, mood: 5 });
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const load = useCallback(async () => {
    const todayData = await DB.get<MoodEntry | null>(`mood_${today}`, null);
    if (todayData) { setEntry(todayData); setSaved(true); }
    const hist = await DB.get<MoodEntry[]>("mood_history", []);
    setHistory(hist.slice(-7));
  }, [today]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const saveEntry = async () => {
    const updated = { ...entry, date: today };
    await DB.set(`mood_${today}`, updated);
    const hist = await DB.get<MoodEntry[]>("mood_history", []);
    const filtered = hist.filter((h) => h.date !== today);
    await DB.set("mood_history", [...filtered, updated]);
    setSaved(true);
    setHistory([...filtered.slice(-6), updated]);
  };

  const sliders = [
    { key: "energy" as const, label: "Energie", emoji: "⚡", color: "#f59e0b" },
    { key: "mood" as const, label: "Stimmung", emoji: "😊", color: "#4ade80" },
    { key: "focus" as const, label: "Fokus", emoji: "🎯", color: "#60a5fa" },
    { key: "stress" as const, label: "Stress", emoji: "😮‍💨", color: "#f87171" },
  ];

  const avg = Math.round((entry.energy + entry.mood + entry.focus + (10 - entry.stress)) / 4);

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <CardTitle icon={Smile}>Wie geht's dir?</CardTitle>
        {history.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-[12px] text-[#8892a4] hover:text-[#4f8ef7] transition-colors flex items-center gap-1"
          >
            <TrendingUp size={12} />
            Verlauf
          </button>
        )}
      </div>

      {showHistory ? (
        <div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {history.map((h) => {
              const score = Math.round((h.energy + h.mood + h.focus + (10 - h.stress)) / 4);
              const color = score >= 7 ? "#4ade80" : score >= 5 ? "#f59e0b" : "#f87171";
              const day = new Date(h.date).toLocaleDateString("de-DE", { weekday: "short" }).slice(0, 2);
              return (
                <div key={h.date} className="flex flex-col items-center gap-1">
                  <div className="w-full rounded-md" style={{ background: color + "33", height: `${score * 8}px`, minHeight: 8 }} />
                  <span className="text-[9px] text-[#4a5568]">{day}</span>
                </div>
              );
            })}
          </div>
          <button onClick={() => setShowHistory(false)} className="text-[12px] text-[#4a5568] w-full text-center mt-1">
            Schließen
          </button>
        </div>
      ) : (
        <>
          {sliders.map(({ key, label, emoji, color }) => (
            <Slider
              key={key}
              label={label}
              emoji={emoji}
              value={entry[key]}
              onChange={(v) => { setEntry((e) => ({ ...e, [key]: v })); setSaved(false); }}
              color={color}
            />
          ))}
          <div className="flex items-center justify-between mt-3">
            <div className="text-[13px] text-[#8892a4]">
              Gesamt: <span className="font-bold text-white">{avg}/10</span>
            </div>
            <button
              onClick={saveEntry}
              className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${saved ? "bg-[#4ade80]/20 text-[#4ade80]" : "bg-[#4f8ef7] text-white hover:bg-[#4f8ef7]/90"}`}
            >
              {saved ? "✓ Gespeichert" : "Speichern"}
            </button>
          </div>
        </>
      )}
    </Card>
  );
}

// ─── Section: Routine ─────────────────────────────────────────────────────────

function RoutineSection({
  type,
  refreshKey,
}: {
  type: "morning" | "evening";
  refreshKey: number;
}) {
  const today = DB.getToday();
  const isMorning = type === "morning";
  const storageKey = isMorning ? "morning_routine" : "evening_routine";
  const doneKey = `${storageKey}_done_${today}`;

  const [steps, setSteps] = useState<RoutineStep[]>(isMorning ? DEFAULT_MORNING : DEFAULT_EVENING);
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [editing, setEditing] = useState(false);
  const [newStepText, setNewStepText] = useState("");
  const [activeTimer, setActiveTimer] = useState<{ id: number; remaining: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const [savedSteps, savedDone] = await Promise.all([
      DB.get<RoutineStep[]>(storageKey, isMorning ? DEFAULT_MORNING : DEFAULT_EVENING),
      DB.get<Record<number, boolean>>(doneKey, {}),
    ]);
    setSteps(savedSteps);
    setDone(savedDone);
  }, [storageKey, doneKey, isMorning]);

  useEffect(() => { load(); }, [load, refreshKey]);

  useEffect(() => {
    if (activeTimer && activeTimer.remaining > 0) {
      timerRef.current = setInterval(() => {
        setActiveTimer((t) => t ? { ...t, remaining: t.remaining - 1 } : null);
      }, 1000);
    } else if (activeTimer && activeTimer.remaining <= 0) {
      setActiveTimer(null);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeTimer?.id, activeTimer?.remaining === 0]);

  const startTimer = (id: number, seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveTimer({ id, remaining: seconds });
  };

  const toggleStep = async (id: number) => {
    const updated = { ...done, [id]: !done[id] };
    setDone(updated);
    await DB.set(doneKey, updated);
  };

  const addStep = async () => {
    if (!newStepText.trim()) return;
    const newStep: RoutineStep = {
      id: Date.now(),
      text: newStepText.trim(),
      category: "other",
      estimatedMin: 5,
      hasTimer: false,
    };
    const updated = [...steps, newStep];
    setSteps(updated);
    await DB.set(storageKey, updated);
    setNewStepText("");
  };

  const removeStep = async (id: number) => {
    const updated = steps.filter((s) => s.id !== id);
    setSteps(updated);
    await DB.set(storageKey, updated);
  };

  const completed = steps.filter((s) => done[s.id]).length;
  const total = steps.length;
  const allDone = total > 0 && completed === total;
  const totalMin = steps.reduce((a, s) => a + s.estimatedMin, 0);

  return (
    <Card className={allDone ? "border-[#4ade80]/30" : ""}>
      <div className="flex items-center justify-between mb-3">
        <CardTitle icon={isMorning ? Sun : Moon}>
          {isMorning ? "Morgenroutine" : "Abendroutine"}
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[#8892a4]">{totalMin} Min</span>
          <button
            onClick={() => setEditing(!editing)}
            className="text-[12px] text-[#8892a4] hover:text-[#4f8ef7] transition-colors"
          >
            {editing ? "Fertig" : "Bearbeiten"}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[#1e2535] rounded-full mb-4 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${total > 0 ? (completed / total) * 100 : 0}%`,
            background: allDone ? "#4ade80" : isMorning ? "#f59e0b" : "#7c5cfc",
          }}
        />
      </div>

      {allDone && (
        <div className="mb-3 bg-[#4ade80]/10 border border-[#4ade80]/20 rounded-xl px-3 py-2.5 flex items-center gap-2">
          <Sparkles size={16} className="text-[#4ade80]" />
          <p className="text-[13px] text-[#4ade80] font-medium">
            {isMorning ? "Starker Start in den Tag!" : "Gut gemacht — Ruhe verdient!"}
          </p>
        </div>
      )}

      {steps.map((step) => (
        editing ? (
          <div key={step.id} className="flex items-center gap-2 py-2 border-b border-white/[0.06] last:border-0">
            <GripVertical size={14} className="text-[#4a5568] shrink-0" />
            <span className="flex-1 text-[14px]">{step.text}</span>
            <button onClick={() => removeStep(step.id)} className="text-[#f87171] p-1">
              <X size={14} />
            </button>
          </div>
        ) : (
          <RoutineStepItem
            key={step.id}
            step={step}
            done={!!done[step.id]}
            onToggle={() => toggleStep(step.id)}
            activeTimer={activeTimer}
            onStartTimer={startTimer}
          />
        )
      ))}

      {editing && (
        <div className="flex gap-2 mt-3">
          <input
            value={newStepText}
            onChange={(e) => setNewStepText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addStep()}
            placeholder="Schritt hinzufügen..."
            className="flex-1 bg-[#1e2535] border border-white/[0.12] rounded-xl px-3 py-2 text-[13px] text-[#f0f2f7] placeholder-[#4a5568] focus:outline-none focus:border-[#4f8ef7] transition-colors"
          />
          <button
            onClick={addStep}
            className="bg-white/[0.08] text-white rounded-xl px-3 hover:bg-white/[0.12] transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      )}

      <div className="mt-3 text-[12px] text-[#4a5568] text-center">
        {completed}/{total} Schritte · {completed === total && total > 0 ? "✓ Fertig" : `${total - completed} übrig`}
      </div>
    </Card>
  );
}

// ─── Section: Done For Today ──────────────────────────────────────────────────

function DoneForTodaySection({ refreshKey }: { refreshKey: number }) {
  const today = DB.getToday();
  const [status, setStatus] = useState<"loading" | "done" | "partial" | "busy">("loading");
  const [details, setDetails] = useState({ tasks: 0, tasksDone: 0, events: 0, morningDone: 0, morningTotal: 0 });

  const analyze = useCallback(async () => {
    const [goals, events, morningDone, morningSteps] = await Promise.all([
      DB.get<Array<{ id: number; repeat: string; date: string }>>("daily_goals", []),
      DB.get<Array<{ date: string }>>("events", []),
      DB.get<Record<number, boolean>>(`morning_routine_done_${today}`, {}),
      DB.get<RoutineStep[]>("morning_routine", DEFAULT_MORNING),
    ]);

    const todayGoals = goals.filter((g) => g.repeat === "daily" || g.date === today);
    const doneKeys = todayGoals.map((g) => `goal_done_${g.id}_${today}`);
    const doneBatch = await DB.getMany<boolean>(doneKeys, false);
    const tasksDone = todayGoals.filter((g) => doneBatch[`goal_done_${g.id}_${today}`]).length;
    const todayEvents = events.filter((e) => e.date === today).length;
    const morningDoneCount = Object.values(morningDone).filter(Boolean).length;

    const completionRate = todayGoals.length > 0 ? tasksDone / todayGoals.length : 1;
    const morningRate = morningSteps.length > 0 ? morningDoneCount / morningSteps.length : 1;
    const overall = (completionRate + morningRate) / 2;

    setDetails({
      tasks: todayGoals.length,
      tasksDone,
      events: todayEvents,
      morningDone: morningDoneCount,
      morningTotal: morningSteps.length,
    });

    if (overall >= 0.8) setStatus("done");
    else if (overall >= 0.4) setStatus("partial");
    else setStatus("busy");
  }, [today]);

  useEffect(() => { analyze(); }, [analyze, refreshKey]);

  const hour = new Date().getHours();
  if (hour < 14) return null; // Only show after 2pm

  return (
    <Card
      className={
        status === "done"
          ? "border-[#4ade80]/40 bg-[#4ade80]/5"
          : status === "partial"
          ? "border-[#f59e0b]/30"
          : ""
      }
    >
      <CardTitle icon={CheckCircle2}>Bist du fertig für heute?</CardTitle>

      {status === "loading" && (
        <p className="text-[13px] text-[#4a5568]">Wird analysiert...</p>
      )}

      {status === "done" && (
        <div className="text-center py-3">
          <div className="text-[40px] mb-2">🎉</div>
          <p className="text-[18px] font-bold text-[#4ade80] mb-1">Du bist fertig für heute.</p>
          <p className="text-[13px] text-[#8892a4]">Ruh dich aus — du hast es dir verdient.</p>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: "Aufgaben", value: `${details.tasksDone}/${details.tasks}`, color: "#4ade80" },
              { label: "Events", value: details.events, color: "#60a5fa" },
              { label: "Morgenroutine", value: `${details.morningDone}/${details.morningTotal}`, color: "#f59e0b" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-black/20 rounded-xl p-2 text-center">
                <p className="text-[15px] font-bold" style={{ color }}>{value}</p>
                <p className="text-[10px] text-[#4a5568] mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {status === "partial" && (
        <div>
          <p className="text-[14px] text-[#f0f2f7] mb-2">Fast geschafft — du bist auf einem guten Weg.</p>
          <p className="text-[13px] text-[#8892a4]">
            {details.tasksDone}/{details.tasks} Aufgaben erledigt ·{" "}
            {details.morningDone}/{details.morningTotal} Morgenroutine
          </p>
          <p className="text-[12px] text-[#f59e0b] mt-2">
            Noch ein paar Schritte — dann kannst du abschalten.
          </p>
        </div>
      )}

      {status === "busy" && (
        <div>
          <p className="text-[14px] text-[#f0f2f7] mb-1">Heute war viel los.</p>
          <p className="text-[13px] text-[#8892a4]">
            {details.tasksDone}/{details.tasks} Aufgaben · {details.morningDone}/{details.morningTotal} Routine
          </p>
          <p className="text-[12px] text-[#8892a4] mt-2">
            Perfektionismus ist nicht das Ziel. Was geschafft wurde, zählt. 💙
          </p>
        </div>
      )}
    </Card>
  );
}

// ─── Main MindPage ────────────────────────────────────────────────────────────

interface Props {
  refreshKey: number;
}

type ActiveView = "overview" | "morning" | "evening";

export function MindPage({ refreshKey }: Props) {
  const hour = new Date().getHours();
  const [view, setView] = useState<ActiveView>("overview");

  const tabs: { id: ActiveView; label: string; emoji: string }[] = [
    { id: "overview", label: "Übersicht", emoji: "🧠" },
    { id: "morning", label: "Morgen", emoji: "🌅" },
    { id: "evening", label: "Abend", emoji: "🌙" },
  ];

  return (
    <div className="pt-2 pb-4">
      {/* Section tabs */}
      <div className="flex gap-2 mb-4 bg-[#161b27] border border-white/[0.08] rounded-[14px] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`flex-1 py-2 rounded-[10px] text-[13px] font-medium transition-all ${view === tab.id ? "bg-[#1e2535] text-white shadow-sm" : "text-[#4a5568] hover:text-[#8892a4]"}`}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {view === "overview" && (
        <>
          <DoneForTodaySection refreshKey={refreshKey} />
          <DailyFocusSection refreshKey={refreshKey} />
          <MoodSection refreshKey={refreshKey} />
          <BrainDumpSection refreshKey={refreshKey} />
        </>
      )}

      {view === "morning" && (
        <RoutineSection type="morning" refreshKey={refreshKey} />
      )}

      {view === "evening" && (
        <>
          <RoutineSection type="evening" refreshKey={refreshKey} />
          <Card className="border-[#7c5cfc]/20 bg-[#7c5cfc]/5">
            <CardTitle icon={Moon}>Abschluss-Reflexion</CardTitle>
            <EveningReflection refreshKey={refreshKey} />
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Evening Reflection ───────────────────────────────────────────────────────

function EveningReflection({ refreshKey }: { refreshKey: number }) {
  const today = DB.getToday();
  const [entry, setEntry] = useState({ win: "", tomorrow: "", feeling: "" });
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const data = await DB.get<typeof entry | null>(`reflection_${today}`, null);
    if (data) { setEntry(data); setSaved(true); }
  }, [today]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const save = async () => {
    await DB.set(`reflection_${today}`, entry);
    setSaved(true);
  };

  return (
    <div>
      {[
        { key: "win" as const, label: "Größter Erfolg heute", placeholder: "Was hat heute gut funktioniert?", emoji: "🏆" },
        { key: "tomorrow" as const, label: "Wichtigstes morgen", placeholder: "Was ist morgen am wichtigsten?", emoji: "📌" },
        { key: "feeling" as const, label: "Wie war der Tag?", placeholder: "Ein Satz genügt...", emoji: "💭" },
      ].map(({ key, label, placeholder, emoji }) => (
        <div key={key} className="mb-3">
          <label className="text-[12px] text-[#8892a4] mb-1 block">{emoji} {label}</label>
          <textarea
            value={entry[key]}
            onChange={(e) => { setEntry((v) => ({ ...v, [key]: e.target.value })); setSaved(false); }}
            placeholder={placeholder}
            rows={2}
            className="w-full bg-[#1e2535] border border-white/[0.12] rounded-xl px-3 py-2 text-[13px] text-[#f0f2f7] placeholder-[#4a5568] focus:outline-none focus:border-[#7c5cfc] transition-colors resize-none"
          />
        </div>
      ))}
      <button
        onClick={save}
        className={`w-full py-2.5 rounded-xl text-[14px] font-semibold transition-all ${saved ? "bg-[#4ade80]/20 text-[#4ade80]" : "bg-[#7c5cfc] text-white hover:bg-[#7c5cfc]/90"}`}
      >
        {saved ? "✓ Gute Nacht 🌙" : "Tag abschließen"}
      </button>
    </div>
  );
}
