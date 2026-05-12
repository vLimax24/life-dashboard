"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { AddButton } from "@/components/ui/AddButton";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { StreakGrid } from "@/components/ui/StreakGrid";
import { DB, getToday } from "@/lib/db";
import { getStreak } from "@/lib/streaks";
import type {
  Workout,
  FootballEntry,
  FootballGoal,
  FoodEntry,
} from "@/lib/types";
import { Dumbbell, TrendingUp, Goal, Apple, Info, Trash2 } from "lucide-react";

interface Props {
  onAddWorkout: () => void;
  onAddFootball: () => void;
  onAddFootballGoal: () => void;
  onAddFood: () => void;
  onToast: (msg: string) => void;
  refreshKey: number;
}

const NUTRITION_TIPS = [
  {
    color: "#2dd4bf",
    title: "🧠 Gehirnfood fürs Lernen",
    desc: "Nüsse, Beeren, Eier, Fisch und dunkle Schokolade verbessern Konzentration und Gedächtnis.",
  },
  {
    color: "#22c55e",
    title: "⚽ Pre-Game Nutrition",
    desc: "3-4h vor dem Spiel: kohlenhydratreiche Mahlzeit (Pasta, Reis). 1h vorher: leichter Snack mit Banane.",
  },
];

export function FitnessPage({
  onAddWorkout,
  onAddFootball,
  onAddFootballGoal,
  onAddFood,
  onToast,
  refreshKey,
}: Props) {
  const today = getToday();
  const [tab, setTab] = useState("training");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [fbEntries, setFbEntries] = useState<FootballEntry[]>([]);
  const [fbGoals, setFbGoals] = useState<FootballGoal[]>([]);
  const [foods, setFoods] = useState<FoodEntry[]>([]);
  const [workoutStreak, setWorkoutStreak] = useState(0);
  const [profileKcal, setProfileKcal] = useState(2500);
  const [profileProt, setProfileProt] = useState(150);

  const load = useCallback(async () => {
    const [w, fb, fbg, f, s, pk, pp] = await Promise.all([
      DB.get<Workout[]>("workouts_" + today, []),
      DB.get<FootballEntry[]>("football_entries", []),
      DB.get<FootballGoal[]>("football_goals", []),
      DB.get<FoodEntry[]>("food_" + today, []),
      getStreak("workout_"),
      DB.get<number>("profile_kcal", 2500),
      DB.get<number>("profile_protein", 150),
    ]);
    setWorkouts(w);
    setFbEntries(fb);
    setFbGoals(fbg);
    setFoods(f);
    setWorkoutStreak(s);
    setProfileKcal(pk);
    setProfileProt(pp);
  }, [today]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const deleteWorkout = async (id: number) => {
    const updated = workouts.filter((w) => w.id !== id);
    await DB.set("workouts_" + today, updated);
    if (!updated.length) await DB.set("workout_" + today, 0);
    setWorkouts(updated);
  };

  const deleteFood = async (id: number) => {
    const updated = foods.filter((f) => f.id !== id);
    await DB.set("food_" + today, updated);
    setFoods(updated);
  };

  const toggleFbGoal = async (id: number) => {
    const updated = fbGoals.map((g) =>
      g.id === id ? { ...g, done: !g.done } : g,
    );
    await DB.set("football_goals", updated);
    setFbGoals(updated);
  };

  const deleteFbGoal = async (id: number) => {
    const updated = fbGoals.filter((g) => g.id !== id);
    await DB.set("football_goals", updated);
    setFbGoals(updated);
  };

  const macros = {
    kcal: {
      val: foods.reduce((s, f) => s + f.kcal, 0),
      goal: profileKcal,
      color: "#fb923c",
    },
    prot: {
      val: foods.reduce((s, f) => s + f.prot, 0),
      goal: profileProt,
      color: "#4f8ef7",
    },
    carb: {
      val: foods.reduce((s, f) => s + f.carb, 0),
      goal: 300,
      color: "#fbbf24",
    },
    fat: {
      val: foods.reduce((s, f) => s + f.fat, 0),
      goal: 80,
      color: "#f472b6",
    },
  };
  const macroLabels: Record<string, string> = {
    kcal: "Kalorien",
    prot: "Protein",
    carb: "Kohlenhydrate",
    fat: "Fett",
  };

  const games = fbEntries.filter((e) => e.type === "Spiel");
  const trainings = fbEntries.filter((e) => e.type === "Training");

  return (
    <div>
      <div className="text-[20px] font-bold mb-3.5 mt-1">
        ⚽ Fitness & Sport
      </div>
      <Tabs
        tabs={[
          { id: "training", label: "Training" },
          { id: "fussball", label: "Fußball" },
          { id: "nutrition", label: "Ernährung" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "training" && (
        <>
          <Card>
            <CardTitle icon={Dumbbell}>Heutiges Training</CardTitle>
            {workouts.length === 0 ? (
              <EmptyState icon={Dumbbell} text="Noch kein Training heute" />
            ) : (
              workouts.map((w) => (
                <div
                  key={w.id}
                  className="flex items-start gap-3 p-2.5 bg-[#1e2535] rounded-lg mb-2"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e] shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{w.type}</div>
                    <div className="text-xs text-[#8892a4]">
                      {w.dur} Min{w.note ? ` · ${w.note}` : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteWorkout(w.id)}
                    className="text-[#8892a4] hover:text-[#f87171] transition-colors p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
            <AddButton onClick={onAddWorkout}>Training loggen</AddButton>
          </Card>
          <Card>
            <CardTitle icon={TrendingUp}>Trainingsstreak</CardTitle>
            <StreakGrid prefix="workout_" target={1} color="#4ade80" />
            <div className="flex justify-between mt-2">
              <span className="text-xs text-[#8892a4]">Aktueller Streak:</span>
              <span className="text-xs text-[#22c55e] font-mono">
                {workoutStreak} Tage
              </span>
            </div>
          </Card>
        </>
      )}

      {tab === "fussball" && (
        <>
          <Card>
            <CardTitle icon={Goal}>Meine Saison-Stats</CardTitle>
            {[
              { label: "Spiele", val: games.length },
              { label: "Tore", val: games.reduce((s, e) => s + e.goals, 0) },
              {
                label: "Assists",
                val: games.reduce((s, e) => s + e.assists, 0),
              },
              { label: "Training gesamt", val: trainings.length },
            ].map(({ label, val }) => (
              <div
                key={label}
                className="flex justify-between items-center py-2.5 border-b border-white/[0.08] last:border-none"
              >
                <span className="text-sm">{label}</span>
                <span className="font-mono text-sm text-[#4f8ef7]">{val}</span>
              </div>
            ))}
            {fbEntries
              .slice(-3)
              .reverse()
              .map((e) => (
                <div
                  key={e.id}
                  className="flex justify-between items-center py-2.5 border-b border-white/[0.08] last:border-none text-[13px]"
                >
                  <span className="text-[#8892a4]">
                    {e.date} · {e.type}
                  </span>
                  <span className="font-mono text-xs text-[#8892a4]">
                    {e.goals}T {e.assists}A{e.note ? ` · ${e.note}` : ""}
                  </span>
                </div>
              ))}
            <AddButton onClick={onAddFootball} className="mt-2.5">
              Spiel/Training eintragen
            </AddButton>
          </Card>
          <Card>
            <CardTitle icon={Goal}>Meine Ziele (Fußball)</CardTitle>
            {fbGoals.length === 0 ? (
              <EmptyState icon={Goal} text="Noch keine Ziele" />
            ) : (
              fbGoals.map((g) => (
                <div
                  key={g.id}
                  className="flex items-start gap-3 p-3 bg-[#1e2535] rounded-lg mb-2"
                >
                  <button
                    onClick={() => toggleFbGoal(g.id)}
                    className={`w-[22px] h-[22px] rounded-md border-[1.5px] flex items-center justify-center shrink-0 mt-px transition-all ${g.done ? "bg-[#22c55e] border-[#22c55e]" : "bg-transparent border-white/20"}`}
                  >
                    {g.done && <span className="text-white text-xs">✓</span>}
                  </button>
                  <div
                    className={`flex-1 text-sm ${g.done ? "line-through text-[#8892a4]" : ""}`}
                  >
                    {g.text}
                  </div>
                  <button
                    onClick={() => deleteFbGoal(g.id)}
                    className="text-[#8892a4] hover:text-[#f87171] transition-colors p-1 ml-auto"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
            <AddButton onClick={onAddFootballGoal}>Ziel hinzufügen</AddButton>
          </Card>
        </>
      )}

      {tab === "nutrition" && (
        <>
          <Card>
            <CardTitle icon={Apple}>Makros heute</CardTitle>
            <div className="mb-3">
              {Object.entries(macros).map(([key, { val, goal, color }]) => (
                <div key={key} className="flex items-center gap-2.5 mb-2">
                  <span className="text-[13px] w-[90px]">
                    {macroLabels[key]}
                  </span>
                  <div className="flex-1 h-2 bg-[#1e2535] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width:
                          Math.min(100, Math.round((val / goal) * 100)) + "%",
                        background: color,
                      }}
                    />
                  </div>
                  <span className="text-xs font-mono text-[#8892a4] w-[70px] text-right">
                    {val} / {goal}
                    {key === "kcal" ? "" : " g"}
                  </span>
                </div>
              ))}
            </div>
            {foods.length === 0 ? (
              <EmptyState icon={Apple} text="Noch keine Mahlzeiten" />
            ) : (
              foods.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-2.5 bg-[#1e2535] rounded-lg mb-1.5"
                >
                  <div>
                    <div className="text-sm font-medium">{f.name}</div>
                    <div className="text-xs text-[#8892a4] font-mono">
                      {f.kcal}kcal · P:{f.prot}g K:{f.carb}g F:{f.fat}g
                    </div>
                  </div>
                  <button
                    onClick={() => deleteFood(f.id)}
                    className="text-[#8892a4] hover:text-[#f87171] transition-colors p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
            <AddButton onClick={onAddFood}>Mahlzeit eintragen</AddButton>
          </Card>
          <Card>
            <CardTitle icon={Info}>Ernährungs-Tipps</CardTitle>
            {NUTRITION_TIPS.map((t, i) => (
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
    </div>
  );
}
