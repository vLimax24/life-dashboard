"use client";
import { ReactNode, useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-[100] flex items-end justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#161b27] rounded-t-[20px] px-[18px] pt-5 pb-8 w-full max-w-[430px] max-h-[85dvh] overflow-y-auto animate-slide-up">
        <div className="w-9 h-1 bg-white/20 rounded-full mx-auto mb-4" />
        <h2 className="text-[18px] font-bold mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}

interface FormGroupProps {
  label: string;
  children: ReactNode;
}

export function FormGroup({ label, children }: FormGroupProps) {
  return (
    <div className="mb-3.5">
      <label className="block text-[13px] text-[#8892a4] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export function FormInput({ className = "", ...props }: InputProps) {
  return (
    <input
      {...props}
      className={`w-full bg-[#1e2535] border border-white/[0.14] rounded-lg text-[#f0f2f7] px-3 py-2.5 text-sm font-[Outfit] focus:outline-none focus:border-[#4f8ef7] ${className}`}
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}
export function FormSelect({ className = "", children, ...props }: SelectProps) {
  return (
    <select
      {...props}
      className={`w-full bg-[#1e2535] border border-white/[0.14] rounded-lg text-[#f0f2f7] px-3 py-2.5 text-sm appearance-none focus:outline-none focus:border-[#4f8ef7] ${className}`}
    >
      {children}
    </select>
  );
}

interface SubmitBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}
export function SubmitButton({ children, className = "", ...props }: SubmitBtnProps) {
  return (
    <button
      {...props}
      className={`w-full py-3.5 bg-gradient-to-r from-[#4f8ef7] to-[#7c5cfc] border-none rounded-lg text-white text-[15px] font-bold cursor-pointer mt-1 active:scale-[0.98] transition-transform ${className}`}
    >
      {children}
    </button>
  );
}

export function CancelButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-3 mt-2 bg-transparent border border-white/[0.14] rounded-lg text-[#8892a4] text-sm font-semibold"
    >
      Abbrechen
    </button>
  );
}
