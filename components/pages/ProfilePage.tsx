"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { AddButton } from "@/components/ui/AddButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormInput } from "@/components/ui/Modal";
import * as DB from "@/lib/db";
import { computeStreak } from "@/lib/streaks";
import type { LongGoal } from "@/lib/types";
import { User, BarChart2, Trophy, Trash2 } from "lucide-react";

interface Props {
  onAddLongGoal: () => void;
  onToast: (msg: string) => void;
  refreshKey: number;
}

export function ProfilePage({ onAddLongGoal, onToast, refreshKey }: Props) {
  const [name, setName] = useState("");
  const [klass, setKlass] = useState("11. Klasse");
  const [kcal, setKcal] = useState("2500");
  const [protein, setProtein] = useState("150");
  const [longGoals, setLongGoals] = useState<LongGoal[]>([]);
  const [stats, setStats] = useState({
    trainStreak: 0,
    waterStreak: 0,
    studyDays: 0,
    events: 0,
  });

  const load = useCallback(async () => {
    const scalarKeys = [
      "profile_name", "profile_class", "profile_kcal",
      "profile_protein", "long_goals", "events",
    ];
    const [scalars, workoutMap, waterMap, studyMap] = await Promise.all([
      DB.getMany<unknown>(scalarKeys, null),
      DB.getByPrefix<number>("workout_"),
      DB.getByPrefix<number>("water_"),
      DB.getByPrefix<number>("study_"),
    ]);

    setName((scalars["profile_name"] as string) ?? "");
    setKlass((scalars["profile_class"] as string) ?? "11. Klasse");
    setKcal(String((scalars["profile_kcal"] as number) ?? 2500));
    setProtein(String((scalars["profile_protein"] as number) ?? 150));
    setLongGoals((scalars["long_goals"] as LongGoal[]) ?? []);

    const evs = (scalars["events"] as unknown[]) ?? [];

    // Count study days in last 30 days from the already-fetched map
    let studyDays = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = "study_" + d.toISOString().split("T")[0];
      if (studyMap[key]) studyDays++;
    }

    setStats({
      trainStreak: computeStreak(workoutMap, "workout_", 1),
      waterStreak: computeStreak(waterMap, "water_", 8),
      studyDays,
      events: evs.length,
    });
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const save = async () => {
    await Promise.all([
      DB.set("profile_name", name),
      DB.set("profile_class", klass),
      DB.set("profile_kcal", parseInt(kcal) || 2500),
      DB.set("profile_protein", parseInt(protein) || 150),
    ]);
    onToast("✅ Profil gespeichert!");
  };

  const toggleLongGoal = async (id: number) => {
    const updated = longGoals.map((g) =>
      g.id === id ? { ...g, done: !g.done } : g,
    );
    await DB.set("long_goals", updated);
    setLongGoals(updated);
  };

  const deleteLongGoal = async (id: number) => {
    const updated = longGoals.filter((g) => g.id !== id);
    await DB.set("long_goals", updated);
    setLongGoals(updated);
  };

  const resetAll = async () => {};

  return (
    <div>
      <div className="text-[20px] font-bold mb-3.5 mt-1">👤 Mein Profil</div>

      <Card>
        <CardTitle icon={User}>Einstellungen</CardTitle>
        {[
          {
            label: "Dein Name",
            val: name,
            set: setName,
            placeholder: "Name eingeben...",
          },
          {
            label: "Klasse / Jahrgang",
            val: klass,
            set: setKlass,
            placeholder: "z.B. 11. Klasse",
          },
        ].map((f) => (
          <div key={f.label} className="mb-3.5">
            <label className="block text-xs text-[#8892a4] mb-1.5">
              {f.label}
            </label>
            <FormInput
              placeholder={f.placeholder}
              value={f.val}
              onChange={(e) => f.set(e.target.value)}
            />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2.5 mb-3.5">
          <div>
            <label className="block text-xs text-[#8892a4] mb-1.5">
              Kalorienziel (kcal)
            </label>
            <FormInput
              type="number"
              placeholder="2500"
              value={kcal}
              onChange={(e) => setKcal(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-[#8892a4] mb-1.5">
              Protein-Ziel (g/Tag)
            </label>
            <FormInput
              type="number"
              placeholder="150"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={save}
          className="w-full py-3 bg-gradient-to-r from-[#4f8ef7] to-[#7c5cfc] text-white text-sm font-bold rounded-lg cursor-pointer"
        >
          Speichern
        </button>
      </Card>

      <Card>
        <CardTitle icon={BarChart2}>Gesamtübersicht</CardTitle>
        {[
          { label: "Trainings-Streak", val: stats.trainStreak + " Tage 🔥" },
          { label: "Wasser-Streak", val: stats.waterStreak + " Tage 💧" },
          { label: "Gelernte Tage (30T)", val: stats.studyDays + " / 30" },
          { label: "Eingetragene Termine", val: stats.events },
        ].map(({ label, val }) => (
          <div
            key={label}
            className="flex justify-between items-center py-2.5 border-b border-white/[0.08] last:border-none"
          >
            <span className="text-sm">{label}</span>
            <span className="font-mono text-sm text-[#4f8ef7]">{val}</span>
          </div>
        ))}
      </Card>

      <Card>
        <CardTitle icon={Trophy}>Meine Langzeitziele</CardTitle>
        {longGoals.length === 0 ? (
          <EmptyState icon={Trophy} text="Noch keine Langzeitziele" />
        ) : (
          longGoals.map((g) => (
            <div
              key={g.id}
              className="flex items-start gap-3 p-3 bg-[#1e2535] rounded-lg mb-2"
            >
              <button
                onClick={() => toggleLongGoal(g.id)}
                className={`w-[22px] h-[22px] rounded-md border-[1.5px] flex items-center justify-center shrink-0 mt-px transition-all ${g.done ? "bg-[#22c55e] border-[#22c55e]" : "bg-transparent border-white/20"}`}
              >
                {g.done && <span className="text-white text-xs">✓</span>}
              </button>
              <div className="flex-1">
                <div
                  className={`text-sm ${g.done ? "line-through text-[#8892a4]" : ""}`}
                >
                  {g.text}
                </div>
                <div className="text-[11px] text-[#8892a4] mt-0.5">{g.cat}</div>
              </div>
              <button
                onClick={() => deleteLongGoal(g.id)}
                className="text-[#8892a4] hover:text-[#f87171] transition-colors p-1 ml-auto"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
        <AddButton onClick={onAddLongGoal}>Langzeitziel hinzufügen</AddButton>
      </Card>

      <Card>
        <div className="text-xs text-[#8892a4] text-center leading-relaxed">
          Alle Daten werden lokal auf deinem Gerät gespeichert (IndexedDB).
          <br />
          <button
            onClick={resetAll}
            className="text-[#f87171] text-xs mt-1.5 bg-none border-none cursor-pointer"
          >
            🗑 Alle Daten zurücksetzen
          </button>
        </div>
      </Card>
    </div>
  );
}
