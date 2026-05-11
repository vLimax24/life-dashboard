"use client";
import { useState } from "react";
import { Modal, FormGroup, FormInput, FormSelect, SubmitButton, CancelButton } from "@/components/ui/Modal";
import { S, getToday } from "@/lib/storage";
import type { DailyGoal } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (msg: string) => void;
}

export function GoalModal({ open, onClose, onSaved }: Props) {
  const [text, setText] = useState("");
  const [repeat, setRepeat] = useState<"once" | "daily">("once");

  const save = () => {
    if (!text) return;
    const goals = S.get<DailyGoal[]>("daily_goals", []);
    goals.push({ id: Date.now(), text, repeat, date: getToday() });
    S.set("daily_goals", goals);
    setText("");
    onClose();
    onSaved("Ziel gespeichert!");
  };

  return (
    <Modal open={open} onClose={onClose} title="Tagesziel hinzufügen">
      <FormGroup label="Ziel">
        <FormInput placeholder="z.B. 30 Minuten Sport..." value={text} onChange={e => setText(e.target.value)} />
      </FormGroup>
      <FormGroup label="Wiederholung">
        <FormSelect value={repeat} onChange={e => setRepeat(e.target.value as "once" | "daily")}>
          <option value="once">Einmalig (heute)</option>
          <option value="daily">Täglich</option>
        </FormSelect>
      </FormGroup>
      <SubmitButton onClick={save}>Ziel speichern</SubmitButton>
      <CancelButton onClick={onClose} />
    </Modal>
  );
}
