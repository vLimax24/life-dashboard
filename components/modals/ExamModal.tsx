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
import { DB, getToday } from "@/lib/db";
import { generatePrepPlan } from "@/lib/examPlanner";
import type { ExamPlan, Event } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (msg: string) => void;
}

export function ExamModal({ open, onClose, onSaved }: Props) {
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState(getToday());
  const [type, setType] = useState<"klausur" | "test">("klausur");
  const [topic, setTopic] = useState("");

  const save = async () => {
    if (!subject || !date) {
      onSaved("Bitte Fach und Datum ausfüllen");
      return;
    }
    const plan = generatePrepPlan(date, type, topic);
    const exams = await DB.get<ExamPlan[]>("exam_plans", []);
    exams.push({
      id: Date.now(),
      subject,
      date,
      type,
      topic,
      createdAt: getToday(),
      plan,
    });
    await DB.set("exam_plans", exams);
    const events = await DB.get<Event[]>("events", []);
    events.push({
      id: Date.now() + 1,
      title: subject + (type === "klausur" ? " Klausur" : " Test"),
      date,
      type: type === "klausur" ? "exam" : "test",
      subject,
    });
    events.sort((a, b) => a.date.localeCompare(b.date));
    await DB.set("events", events);
    setSubject("");
    setTopic("");
    onClose();
    onSaved(`✨ Lernplan für ${subject} erstellt!`);
  };

  return (
    <Modal open={open} onClose={onClose} title="Lernplan erstellen">
      <FormGroup label="Fach">
        <FormInput
          placeholder="z.B. Mathematik"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </FormGroup>
      <FormGroup label="Prüfungsdatum">
        <FormInput
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </FormGroup>
      <FormGroup label="Typ">
        <FormSelect
          value={type}
          onChange={(e) => setType(e.target.value as "klausur" | "test")}
        >
          <option value="klausur">Klausur (7 Tage Vorbereitung)</option>
          <option value="test">Test (3-4 Tage Vorbereitung)</option>
        </FormSelect>
      </FormGroup>
      <FormGroup label="Thema / Stoff">
        <FormInput
          placeholder="z.B. Differentialrechnung, Kapitel 3-5"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
      </FormGroup>
      <SubmitButton onClick={save}>Lernplan generieren ✨</SubmitButton>
      <CancelButton onClick={onClose} />
    </Modal>
  );
}
