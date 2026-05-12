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
import type { Event } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (msg: string) => void;
  initialDate?: string;
}

export function EventModal({ open, onClose, onSaved, initialDate }: Props) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(initialDate || DB.getToday());
  const [type, setType] = useState<Event["type"]>("other");
  const [subject, setSubject] = useState("");

  const save = async () => {
    if (!title || !date) {
      onSaved("Bitte Titel und Datum ausfüllen");
      return;
    }
    const events = await DB.get<Event[]>("events", []);
    events.push({ id: Date.now(), title, date, type, subject });
    events.sort((a, b) => a.date.localeCompare(b.date));
    await DB.set("events", events);
    setTitle("");
    setSubject("");
    onClose();
    onSaved("✅ Termin gespeichert!");
  };

  return (
    <Modal open={open} onClose={onClose} title="Termin hinzufügen">
      <FormGroup label="Bezeichnung">
        <FormInput
          placeholder="z.B. Mathe-Klausur"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </FormGroup>
      <FormGroup label="Datum">
        <FormInput
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </FormGroup>
      <FormGroup label="Typ">
        <FormSelect
          value={type}
          onChange={(e) => setType(e.target.value as Event["type"])}
        >
          <option value="exam">Klausur</option>
          <option value="test">Test</option>
          <option value="vortrag">Vortrag</option>
          <option value="sport">Sport/Spiel</option>
          <option value="other">Sonstiges</option>
        </FormSelect>
      </FormGroup>
      <FormGroup label="Fach (optional)">
        <FormInput
          placeholder="z.B. Mathematik"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </FormGroup>
      <SubmitButton onClick={save}>Termin speichern</SubmitButton>
      <CancelButton onClick={onClose} />
    </Modal>
  );
}
