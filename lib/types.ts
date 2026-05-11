export interface Event {
  id: number;
  title: string;
  date: string;
  type: "exam" | "test" | "vortrag" | "sport" | "other";
  subject?: string;
}

export interface DailyGoal {
  id: number;
  text: string;
  repeat: "once" | "daily";
  date: string;
}

export interface ExamPlan {
  id: number;
  subject: string;
  date: string;
  type: "klausur" | "test";
  topic: string;
  createdAt: string;
  plan: PrepStep[];
}

export interface PrepStep {
  date: string;
  dayNum: number;
  title: string;
  desc: string;
  done: boolean;
}

export interface Workout {
  id: number;
  type: string;
  dur: number;
  note: string;
}

export interface FootballEntry {
  id: number;
  date: string;
  type: "Spiel" | "Training";
  goals: number;
  assists: number;
  note: string;
}

export interface FootballGoal {
  id: number;
  text: string;
  done: boolean;
}

export interface FoodEntry {
  id: number;
  name: string;
  kcal: number;
  prot: number;
  carb: number;
  fat: number;
}

export interface LongGoal {
  id: number;
  text: string;
  cat: string;
  done: boolean;
}

export type NavPage = "home" | "cal" | "learn" | "fit" | "profile";
