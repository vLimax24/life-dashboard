"use client";
import { useState, useCallback } from "react";

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);

  const toast = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2200);
  }, []);

  return { message, toast };
}
