"use client";
import { useState, useCallback } from "react";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { HomePage } from "@/components/pages/HomePage";
import { CalendarPage } from "@/components/pages/CalendarPage";
import { LearnPage } from "@/components/pages/LearnPage";
import { FitnessPage } from "@/components/pages/FitnessPage";
import { ProfilePage } from "@/components/pages/ProfilePage";
import { EventModal } from "@/components/modals/EventModal";
import { GoalModal } from "@/components/modals/GoalModal";
import { ExamModal } from "@/components/modals/ExamModal";
import { WorkoutModal } from "@/components/modals/WorkoutModal";
import {
  FootballModal,
  FootballGoalModal,
  FoodModal,
  LongGoalModal,
} from "@/components/modals/ExtraModals";
import type { NavPage } from "@/lib/types";

const NAV_ITEMS: { id: NavPage; icon: string; label: string }[] = [
  { id: "home", icon: "fa-house", label: "Home" },
  { id: "cal", icon: "fa-calendar-days", label: "Kalender" },
  { id: "learn", icon: "fa-brain", label: "Lernen" },
  { id: "fit", icon: "fa-dumbbell", label: "Fitness" },
  { id: "profile", icon: "fa-user", label: "Profil" },
];

export default function Dashboard() {
  const [page, setPage] = useState<NavPage>("home");
  const [refreshKey, setRefreshKey] = useState(0);
  const { message, toast } = useToast();

  // Modal open states
  const [modals, setModals] = useState({
    event: false,
    goal: false,
    exam: false,
    workout: false,
    football: false,
    footballGoal: false,
    food: false,
    longGoal: false,
  });
  const [eventDate, setEventDate] = useState<string | undefined>();

  const openModal = (name: keyof typeof modals, date?: string) => {
    if (name === "event" && date) setEventDate(date);
    setModals((m) => ({ ...m, [name]: true }));
  };
  const closeModal = (name: keyof typeof modals) =>
    setModals((m) => ({ ...m, [name]: false }));

  const saved = useCallback(
    (msg: string) => {
      toast(msg);
      setRefreshKey((k) => k + 1);
    },
    [toast],
  );

  const now = new Date();
  const days = [
    "Sonntag",
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag",
  ];
  const months = [
    "Jan",
    "Feb",
    "Mär",
    "Apr",
    "Mai",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Okt",
    "Nov",
    "Dez",
  ];
  const dateLabel = `${days[now.getDay()]}, ${now.getDate()}. ${months[now.getMonth()]}`;

  return (
    <div className="flex flex-col h-dvh max-w-[430px] mx-auto relative">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-[18px] pt-3 pb-3 bg-[#0f1117] border-b border-white/[0.08] shrink-0 z-10">
        <span className="text-[17px] font-bold bg-gradient-to-r from-[#4f8ef7] to-[#7c5cfc] bg-clip-text text-transparent tracking-[-0.3px]">
          ⚡ Life Dashboard
        </span>
        <span className="text-[12px] text-[#8892a4] font-mono bg-[#1e2535] px-2.5 py-1 rounded-full">
          {dateLabel}
        </span>
      </div>

      {/* Scroll Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-20 scroll-smooth">
        <div className="animate-fade-up pt-1">
          {page === "home" && (
            <HomePage
              onAddEvent={() => openModal("event")}
              onAddGoal={() => openModal("goal")}
              refreshKey={refreshKey}
            />
          )}
          {page === "cal" && (
            <CalendarPage
              onAddEvent={(date) => openModal("event", date)}
              refreshKey={refreshKey}
            />
          )}
          {page === "learn" && (
            <LearnPage
              onAddExam={() => openModal("exam")}
              onToast={toast}
              refreshKey={refreshKey}
            />
          )}
          {page === "fit" && (
            <FitnessPage
              onAddWorkout={() => openModal("workout")}
              onAddFootball={() => openModal("football")}
              onAddFootballGoal={() => openModal("footballGoal")}
              onAddFood={() => openModal("food")}
              onToast={toast}
              refreshKey={refreshKey}
            />
          )}
          {page === "profile" && (
            <ProfilePage
              onAddLongGoal={() => openModal("longGoal")}
              onToast={toast}
              refreshKey={refreshKey}
            />
          )}
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="flex bg-[#161b27] border-t border-white/[0.08] pb-1.5 shrink-0 z-10">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 pt-4 pb-1.5 cursor-pointer text-[11px] font-medium border-none bg-transparent transition-colors ${page === item.id ? "text-[#4f8ef7]" : "text-[#8892a4]"}`}
          >
            <i
              className={`fa-solid ${item.icon} text-[20px] transition-transform ${page === item.id ? "-translate-y-px" : ""}`}
            />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Toast */}
      <Toast message={message} />

      {/* Modals */}
      <EventModal
        open={modals.event}
        onClose={() => closeModal("event")}
        onSaved={saved}
        initialDate={eventDate}
      />
      <GoalModal
        open={modals.goal}
        onClose={() => closeModal("goal")}
        onSaved={saved}
      />
      <ExamModal
        open={modals.exam}
        onClose={() => closeModal("exam")}
        onSaved={saved}
      />
      <WorkoutModal
        open={modals.workout}
        onClose={() => closeModal("workout")}
        onSaved={saved}
      />
      <FootballModal
        open={modals.football}
        onClose={() => closeModal("football")}
        onSaved={saved}
      />
      <FootballGoalModal
        open={modals.footballGoal}
        onClose={() => closeModal("footballGoal")}
        onSaved={saved}
      />
      <FoodModal
        open={modals.food}
        onClose={() => closeModal("food")}
        onSaved={saved}
      />
      <LongGoalModal
        open={modals.longGoal}
        onClose={() => closeModal("longGoal")}
        onSaved={saved}
      />
    </div>
  );
}
