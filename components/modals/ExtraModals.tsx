"use client";
import { useState } from "react";
import {
  Modal,
  FormGroup,
  FormInput,
  FormSelect,
  SubmitButton,
  CancelButton,
} from "@/components/ui/Modal";
import * as DB from "@/lib/db";
import type {
  FootballEntry,
  FootballGoal,
  FoodEntry,
  LongGoal,
} from "@/lib/types";

// ---- Football Entry ----
interface FootballProps {
  open: boolean;
  onClose: () => void;
  onSaved: (msg: string) => void;
}
export function FootballModal({ open, onClose, onSaved }: FootballProps) {
  const [type, setType] = useState<"Spiel" | "Training">("Spiel");
  const [goals, setGoals] = useState("");
  const [assists, setAssists] = useState("");
  const [note, setNote] = useState("");

  const save = async () => {
    const today = DB.getToday();
    const entries = await DB.get<FootballEntry[]>("football_entries", []);
    entries.push({
      id: Date.now(),
      date: today,
      type,
      goals: parseInt(goals) || 0,
      assists: parseInt(assists) || 0,
      note,
    });
    await DB.set("football_entries", entries);
    await DB.set("workout_" + today, 1);
    setGoals("");
    setAssists("");
    setNote("");
    onClose();
    onSaved("⚽ Eintrag gespeichert!");
  };

  return (
    <Modal open={open} onClose={onClose} title="Fußball-Eintrag">
      <FormGroup label="Typ">
        <FormSelect
          value={type}
          onChange={(e) => setType(e.target.value as "Spiel" | "Training")}
        >
          <option value="Spiel">Spiel</option>
          <option value="Training">Training</option>
        </FormSelect>
      </FormGroup>
      <FormGroup label="Tore / Assists">
        <div className="flex gap-2">
          <FormInput
            type="number"
            placeholder="Tore"
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
          />
          <FormInput
            type="number"
            placeholder="Assists"
            value={assists}
            onChange={(e) => setAssists(e.target.value)}
          />
        </div>
      </FormGroup>
      <FormGroup label="Notiz">
        <FormInput
          placeholder="Ergebnis, Gegner..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </FormGroup>
      <SubmitButton onClick={save}>Speichern</SubmitButton>
      <CancelButton onClick={onClose} />
    </Modal>
  );
}

// ---- Football Goal ----
interface FbGoalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (msg: string) => void;
}
export function FootballGoalModal({ open, onClose, onSaved }: FbGoalProps) {
  const [text, setText] = useState("");
  const save = async () => {
    if (!text) return;
    const goals = await DB.get<FootballGoal[]>("football_goals", []);
    goals.push({ id: Date.now(), text, done: false });
    await DB.set("football_goals", goals);
    setText("");
    onClose();
    onSaved("🎯 Fußball-Ziel gespeichert!");
  };
  return (
    <Modal open={open} onClose={onClose} title="Fußball-Ziel">
      <FormGroup label="Ziel">
        <FormInput
          placeholder="z.B. 10 Tore diese Saison"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </FormGroup>
      <SubmitButton onClick={save}>Speichern</SubmitButton>
      <CancelButton onClick={onClose} />
    </Modal>
  );
}

// ---- Food ----
interface FoodProps {
  open: boolean;
  onClose: () => void;
  onSaved: (msg: string) => void;
}
export function FoodModal({ open, onClose, onSaved }: FoodProps) {
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [prot, setProt] = useState("");
  const [carb, setCarb] = useState("");
  const [fat, setFat] = useState("");

  const save = async () => {
    if (!name) return;
    const today = DB.getToday();
    const foods = await DB.get<FoodEntry[]>("food_" + today, []);
    foods.push({
      id: Date.now(),
      name,
      kcal: parseInt(kcal) || 0,
      prot: parseInt(prot) || 0,
      carb: parseInt(carb) || 0,
      fat: parseInt(fat) || 0,
    });
    await DB.set("food_" + today, foods);
    setName("");
    setKcal("");
    setProt("");
    setCarb("");
    setFat("");
    onClose();
    onSaved("🍎 Mahlzeit gespeichert!");
  };

  return (
    <Modal open={open} onClose={onClose} title="Mahlzeit eintragen">
      <FormGroup label="Name">
        <FormInput
          placeholder="z.B. Haferbrei mit Beeren"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </FormGroup>
      <FormGroup label="Kalorien (kcal)">
        <FormInput
          type="number"
          placeholder="400"
          value={kcal}
          onChange={(e) => setKcal(e.target.value)}
        />
      </FormGroup>
      <FormGroup label="Makros (g)">
        <div className="flex gap-2">
          <FormInput
            type="number"
            placeholder="Protein"
            value={prot}
            onChange={(e) => setProt(e.target.value)}
          />
          <FormInput
            type="number"
            placeholder="Carbs"
            value={carb}
            onChange={(e) => setCarb(e.target.value)}
          />
          <FormInput
            type="number"
            placeholder="Fett"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
          />
        </div>
      </FormGroup>
      <SubmitButton onClick={save}>Speichern</SubmitButton>
      <CancelButton onClick={onClose} />
    </Modal>
  );
}

// ---- Long Goal ----
interface LongGoalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (msg: string) => void;
}
export function LongGoalModal({ open, onClose, onSaved }: LongGoalProps) {
  const [text, setText] = useState("");
  const [cat, setCat] = useState("Sport");

  const save = async () => {
    if (!text) return;
    const goals = await DB.get<LongGoal[]>("long_goals", []);
    goals.push({ id: Date.now(), text, cat, done: false });
    await DB.set("long_goals", goals);
    setText("");
    onClose();
    onSaved("🏆 Langzeitziel gespeichert!");
  };

  return (
    <Modal open={open} onClose={onClose} title="Langzeitziel hinzufügen">
      <FormGroup label="Ziel">
        <FormInput
          placeholder="z.B. Abitur mit 1,5 abschließen"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </FormGroup>
      <FormGroup label="Kategorie">
        <FormSelect value={cat} onChange={(e) => setCat(e.target.value)}>
          {[
            "Sport",
            "Schule",
            "Gesundheit",
            "Persönlich",
            "Finanzen",
            "Sonstiges",
          ].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </FormSelect>
      </FormGroup>
      <SubmitButton onClick={save}>Speichern</SubmitButton>
      <CancelButton onClick={onClose} />
    </Modal>
  );
}
