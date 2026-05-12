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
import type { Workout } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (msg: string) => void;
}

export function WorkoutModal({ open, onClose, onSaved }: Props) {
  const [type, setType] = useState("Fußball Training");
  const [dur, setDur] = useState("");
  const [note, setNote] = useState("");

  const save = async () => {
    if (!dur) {
      onSaved("Bitte Dauer eingeben");
      return;
    }
    const today = DB.getToday();
    const workouts = await DB.get<Workout[]>("workouts_" + today, []);
    workouts.push({ id: Date.now(), type, dur: parseInt(dur), note });
    await DB.set("workouts_" + today, workouts);
    await DB.set("workout_" + today, 1);
    setDur("");
    setNote("");
    onClose();
    onSaved("💪 Training gespeichert!");
  };

  return (
    <Modal open={open} onClose={onClose} title="Training loggen">
      <FormGroup label="Art des Trainings">
        <FormSelect value={type} onChange={(e) => setType(e.target.value)}>
          {[
            "Fußball Training",
            "Fußball Spiel",
            "Krafttraining",
            "Laufen",
            "Radfahren",
            "Schwimmen",
            "Sonstiges",
          ].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </FormSelect>
      </FormGroup>
      <FormGroup label="Dauer (Minuten)">
        <FormInput
          type="number"
          placeholder="60"
          value={dur}
          onChange={(e) => setDur(e.target.value)}
        />
      </FormGroup>
      <FormGroup label="Notizen (optional)">
        <FormInput
          placeholder="z.B. 5km, 3 Sätze Bankdrücken..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </FormGroup>
      <SubmitButton onClick={save}>Training speichern 💪</SubmitButton>
      <CancelButton onClick={onClose} />
    </Modal>
  );
}
