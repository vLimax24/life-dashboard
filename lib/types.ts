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

export type NavPage = "home" | "cal" | "learn" | "fit" | "mind" | "profile";

// Brain Dump
export interface BrainItem {
  id: number;
  text: string;
  tag?: string;
  createdAt: string;
  done: boolean;
  archived: boolean;
  convertedTo?: "task" | "event" | "goal";
}

// Routine step
export interface RoutineStep {
  id: number;
  text: string;
  category: "health" | "hygiene" | "planning" | "mindset" | "other";
  estimatedMin: number;
  hasTimer: boolean;
}

// Daily focus
export interface DailyFocus {
  school: string;
  health: string;
  personal: string;
  date: string;
}

// Mood entry
export interface MoodEntry {
  date: string;
  energy: number;
  stress: number;
  focus: number;
  mood: number;
}
