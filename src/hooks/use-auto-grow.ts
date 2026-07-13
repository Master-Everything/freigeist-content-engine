import { useEffect, useRef } from "react";

/**
 * Auto-Grow für Textareas: Höhe folgt dem Inhalt.
 * `resetKey` erlaubt zusätzliche Trigger (z. B. Density-Toggle),
 * damit auch bei leeren Feldern eine Neuberechnung ausgelöst wird.
 */
export function useAutoGrow(value: string, resetKey?: unknown) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value, resetKey]);
  return ref;
}
