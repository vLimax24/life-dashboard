"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { AddButton } from "@/components/ui/AddButton";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormInput } from "@/components/ui/Modal";
import * as DB from "@/lib/db";
import type { ExamPlan } from "@/lib/types";
import { GraduationCap, Timer, Bot, Lightbulb, Trash2 } from "lucide-react";

interface Props {
  onAddExam: () => void;
  onToast: (msg: string) => void;
  refreshKey: number;
}

const FOCUS_TIPS = [
  {
    color: "#7c5cfc",
    title: "🔕 Handy weg & umgedreht",
    desc: "Lege dein Handy außer Sichtweite und stelle es stumm. Schon der Anblick des Handys kostet kognitive Kapazität.",
  },
  {
    color: "#2dd4bf",
    title: "🎧 Fokus-Musik oder Stille",
    desc: "Lofi, Naturgeräusche oder Stille helfen. Vermeide Musik mit Texten beim Lesen und Schreiben.",
  },
  {
    color: "#22c55e",
    title: "✍️ Aufschreiben statt ablenken",
    desc: "Kommt dir ein Gedanke? Schreib ihn auf einem Zettel auf, dann weg damit. Weiterarbeiten.",
  },
  {
    color: "#fb923c",
    title: "📐 Zwei-Minuten-Regel",
    desc: "Wenn der Anfang schwer ist: Sage dir 'Nur 2 Minuten'. Der Start ist das Schwierigste — danach läuft's.",
  },
];

export function LearnPage({ onAddExam, onToast, refreshKey }: Props) {
  const today = DB.getToday();
  const [tab, setTab] = useState("plan");
  const [exams, setExams] = useState<ExamPlan[]>([]);
  const [timerMins, setTimerMins] = useState(25);
  const [timerSecs, setTimerSecs] = useState(0);
  const [running, setRunning] = useState(false);
  const [preset, setPreset] = useState(25);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [kiSubject, setKiSubject] = useState("");
  const [kiTopic, setKiTopic] = useState("");
  const [kiInput, setKiInput] = useState("");
  const [kiMessages, setKiMessages] = useState<
    { role: string; content: string }[]
  >([]);
  const [prepDone, setPrepDone] = useState<Record<string, boolean>>({});
  const chatRef = useRef<HTMLDivElement>(null);

  const loadExams = useCallback(async () => {
    const all = await DB.get<ExamPlan[]>("exam_plans", []);
    const filtered = all.filter((e) => e.date >= today);
    setExams(filtered);
    setSessions(await DB.get<number>("timer_sessions_" + today, 0));

    // Load prep done state for all steps
    const doneMap: Record<string, boolean> = {};
    for (const exam of filtered) {
      for (const p of exam.plan) {
        const key = "prep_done_" + exam.id + "_" + p.date;
        doneMap[key] = await DB.get<boolean>(key, false);
      }
    }
    setPrepDone(doneMap);
  }, [today]);

  useEffect(() => {
    loadExams();
  }, [loadExams, refreshKey]);
  useEffect(() => {
    if (chatRef.current)
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [kiMessages]);

  const setTimerPreset = (mins: number) => {
    if (running) stopTimer();
    setPreset(mins);
    setTimerMins(mins);
    setTimerSecs(0);
  };

  const stopTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
  };

  const startTimer = () => {
    setRunning(true);
    intervalRef.current = setInterval(async () => {
      setTimerMins((m) => {
        setTimerSecs((prevS) => {
          if (prevS === 0) {
            if (m === 0) {
              stopTimer();
              (async () => {
                const cnt =
                  (await DB.get<number>("timer_sessions_" + today, 0)) + 1;
                await DB.set("timer_sessions_" + today, cnt);
                await DB.set("study_" + today, 1);
                setSessions(cnt);
                onToast("🎉 Session abgeschlossen! +1 Streak");
              })();
              return 0;
            }
            return 59;
          }
          return prevS - 1;
        });
        return m;
      });
      setTimerSecs((prevS) => {
        if (prevS === 0) {
          setTimerMins((m) => (m > 0 ? m - 1 : m));
        }
        return prevS;
      });
    }, 1000);
  };

  const resetTimer = () => {
    stopTimer();
    setTimerMins(preset);
    setTimerSecs(0);
  };

  const togglePrepDone = async (examId: number, date: string) => {
    const key = "prep_done_" + examId + "_" + date;
    const was = await DB.get<boolean>(key, false);
    await DB.set(key, !was);
    if (!was) {
      await DB.set("study_" + date, 1);
      onToast("✅ Super! Lerntag abgehakt!");
    }
    setPrepDone((prev) => ({ ...prev, [key]: !was }));
  };

  const deleteExam = async (id: number) => {
    if (!confirm("Lernplan löschen?")) return;
    const all = await DB.get<ExamPlan[]>("exam_plans", []);
    await DB.set(
      "exam_plans",
      all.filter((e) => e.id !== id),
    );
    loadExams();
    onToast("Lernplan gelöscht");
  };

  const sendKI = async () => {
    const msg = kiInput.trim();
    if (!msg) return;
    setKiInput("");
    const history = [...kiMessages, { role: "user", content: msg }];
    setKiMessages([...history, { role: "ai", content: "Denke nach..." }]);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `Du bist ein Lern-Coach für einen Gymnasiasten der 11. Klasse in Sachsen. Fach: "${kiSubject || "allgemein"}", Thema: "${kiTopic || "unbekannt"}". Teste Wissen, korrigiere Fehler, erkläre klar und kurz. Antworte immer auf Deutsch.`,
          messages: history.slice(-10).map((m) => ({
            role: m.role === "ai" ? "assistant" : "user",
            content: m.content,
          })),
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Fehler bei der Antwort.";
      setKiMessages([...history, { role: "ai", content: reply }]);
      await DB.set("study_" + today, 1);
    } catch {
      setKiMessages([
        ...history,
        { role: "ai", content: "Verbindungsfehler. Versuche es erneut." },
      ]);
    }
  };

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div>
      <div className="text-[20px] font-bold mb-3.5 mt-1">🧠 Lernen & Fokus</div>
      <Tabs
        tabs={[
          { id: "plan", label: "Lernplan" },
          { id: "timer", label: "Fokus" },
          { id: "ki", label: "KI-Session" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "plan" && (
        <Card>
          <CardTitle icon={GraduationCap}>Prüfungen & Tests</CardTitle>
          {exams.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              text="Keine Prüfungen eingetragen"
            />
          ) : (
            exams.map((exam) => {
              const d = new Date(exam.date + "T12:00:00");
              const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
              return (
                <div key={exam.id} className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-[15px] font-semibold">
                        {exam.subject}
                      </div>
                      <div className="text-xs text-[#8892a4]">
                        {exam.type === "klausur" ? "Klausur" : "Test"} ·{" "}
                        {d.toLocaleDateString("de-DE")} · noch {diff}d
                      </div>
                    </div>
                    <button
                      onClick={() => deleteExam(exam.id)}
                      className="text-[#8892a4] hover:text-[#f87171] transition-colors p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {exam.plan.map((p) => {
                    const key = "prep_done_" + exam.id + "_" + p.date;
                    const isDone = prepDone[key] ?? false;
                    const isToday = p.date === today;
                    const isPast = p.date < today;
                    return (
                      <div
                        key={p.date}
                        className="flex gap-3 p-3 bg-[#1e2535] rounded-lg mb-2 items-start"
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold font-mono shrink-0 ${isToday ? "bg-[#4f8ef7] text-white" : isDone && isPast ? "bg-[#22c55e]/20 text-[#22c55e]" : "bg-[#0f1117] text-[#8892a4] border border-white/20"}`}
                        >
                          {p.dayNum}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold">{p.title}</div>
                          <div className="text-xs text-[#8892a4] mt-0.5">
                            {p.date} · {p.desc}
                          </div>
                        </div>
                        <button
                          onClick={() => togglePrepDone(exam.id, p.date)}
                          className={`w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center shrink-0 mt-0.5 transition-all ${isDone ? "bg-[#22c55e] border-[#22c55e]" : "bg-transparent border-white/20"}`}
                        >
                          {isDone && (
                            <span className="text-white text-[10px]">✓</span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
          <AddButton onClick={onAddExam}>Klausur / Test eintragen</AddButton>
        </Card>
      )}

      {tab === "timer" && (
        <>
          <Card>
            <CardTitle icon={Timer}>Pomodoro-Timer</CardTitle>
            <div className="flex gap-2 mb-3.5 flex-wrap">
              {[25, 45, 90, 5].map((m) => (
                <button
                  key={m}
                  onClick={() => setTimerPreset(m)}
                  className={`px-3.5 py-1.5 rounded-full text-[13px] cursor-pointer transition-all border ${preset === m ? "bg-blue-500/20 border-[#4f8ef7] text-[#4f8ef7]" : "bg-[#1e2535] border-white/20 text-[#f0f2f7]"}`}
                >
                  {m === 5 ? "5 Pause" : `${m} Min`}
                </button>
              ))}
            </div>
            <div className="text-center text-[56px] font-bold font-mono tracking-[-2px] bg-gradient-to-r from-[#4f8ef7] to-[#7c5cfc] bg-clip-text text-transparent my-2.5">
              {pad(timerMins)}:{pad(timerSecs)}
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={running ? stopTimer : startTimer}
                className="flex-1 py-3 rounded-lg bg-[#4f8ef7] text-white text-sm font-semibold border-none cursor-pointer"
              >
                {running ? "⏸ Pause" : "▶ Start"}
              </button>
              <button
                onClick={resetTimer}
                className="flex-1 py-3 rounded-lg bg-[#1e2535] border border-white/20 text-sm font-semibold cursor-pointer"
              >
                ↺ Reset
              </button>
            </div>
            <div className="text-xs text-[#8892a4] text-center mt-2.5">
              Sessions heute: <span className="font-mono">{sessions}</span>
            </div>
          </Card>
          <Card>
            <CardTitle icon={Lightbulb}>Anti-Ablenkung Tipps</CardTitle>
            {FOCUS_TIPS.map((t, i) => (
              <div
                key={i}
                className="bg-[#1e2535] rounded-lg p-3 mb-2 border-l-[3px]"
                style={{ borderLeftColor: t.color }}
              >
                <div className="text-[13px] font-semibold mb-1">{t.title}</div>
                <div className="text-xs text-[#8892a4] leading-relaxed">
                  {t.desc}
                </div>
              </div>
            ))}
          </Card>
        </>
      )}

      {tab === "ki" && (
        <Card>
          <CardTitle icon={Bot}>KI-Lernpartner</CardTitle>
          <div className="text-xs text-[#8892a4] mb-3">
            Ab Tag 4 deines Lernplans: Besprich Fragen und Anwendungsaufgaben
            hier direkt mit der KI.
          </div>
          <div className="mb-2.5">
            <label className="block text-xs text-[#8892a4] mb-1.5">
              Prüfungsfach
            </label>
            <FormInput
              placeholder="z.B. Mathematik Analysis..."
              value={kiSubject}
              onChange={(e) => setKiSubject(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-[#8892a4] mb-1.5">
              Thema / Lernziel
            </label>
            <FormInput
              placeholder="z.B. Ableitungsregeln, Integrale..."
              value={kiTopic}
              onChange={(e) => setKiTopic(e.target.value)}
            />
          </div>
          <div
            ref={chatRef}
            className="bg-[#1e2535] rounded-lg p-3 min-h-[120px] max-h-[200px] overflow-y-auto mb-2.5 text-[13px] leading-relaxed"
          >
            {kiMessages.length === 0 ? (
              <div className="text-[#8892a4]">
                Gib Fach und Thema ein, dann fang an zu fragen.
              </div>
            ) : (
              kiMessages.map((m, i) => (
                <div
                  key={i}
                  className={`mb-2 ${m.role === "user" ? "text-[#f0f2f7]" : "text-[#93c5fd]"}`}
                >
                  <span className="font-semibold text-[#8892a4]">
                    {m.role === "user" ? "Du: " : "KI: "}
                  </span>
                  {m.content}
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={kiInput}
              onChange={(e) => setKiInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendKI()}
              placeholder="Deine Frage oder Antwort..."
              className="flex-1 bg-[#1e2535] border border-white/20 rounded-lg text-[#f0f2f7] px-3 py-2.5 text-sm focus:outline-none focus:border-[#4f8ef7]"
            />
            <button
              onClick={sendKI}
              className="px-3.5 bg-[#4f8ef7] border-none rounded-lg text-white text-base cursor-pointer"
            >
              ✈
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
