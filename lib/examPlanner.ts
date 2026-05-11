import type { PrepStep } from "./types";

export function generatePrepPlan(examDate: string, type: "klausur" | "test", topic: string): PrepStep[] {
  const days = type === "klausur" ? 7 : 3;
  const examD = new Date(examDate + "T12:00:00");
  const plan: PrepStep[] = [];

  for (let i = days; i >= 0; i--) {
    const d = new Date(examD);
    d.setDate(d.getDate() - i);
    const dayNum = days - i + 1;
    let title: string, desc: string;

    if (i === days) {
      title = "Überblick verschaffen";
      desc = "Gesamten Stoff sichten, Lücken identifizieren";
    } else if (dayNum <= 3) {
      title = "Karteikarten erstellen";
      desc = `Alle wichtigen Begriffe, Formeln und Konzepte aus "${topic || "dem Stoff"}" auf Karteikarten schreiben`;
    } else if (dayNum <= (type === "klausur" ? 5 : 3)) {
      title = "Aktives Wiederholen";
      desc = "Karteikarten üben, Lernpartner fragen, Zusammenfassung schreiben";
    } else if (i > 0) {
      title = "KI-Gespräch + Übungsaufgaben";
      desc = 'Nutze den KI-Lernpartner (Tab "KI-Session") für Fragen und Anwendungsaufgaben';
    } else {
      title = "🎯 Prüfungstag!";
      desc = "Kurze Wiederholung, früh schlafen, gesundes Frühstück. Du schaffst das!";
    }

    plan.push({
      date: d.toISOString().split("T")[0],
      dayNum,
      title,
      desc,
      done: false,
    });
  }
  return plan;
}
