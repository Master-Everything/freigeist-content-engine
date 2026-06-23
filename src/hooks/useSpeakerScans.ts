import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SpeakerScan = {
  id: string;
  speaker_id: string;
  status: "pending" | "running" | "done" | "error";
  verdict: "green" | "yellow" | "red" | null;
  score: number | null;
  summary: string | null;
  findings: any[];
  model_used: string | null;
  prompt_version_used: number | null;
  duration_ms: number | null;
  error_text: string | null;
  created_at: string;
};

export function useSpeakerScans(speakerId: string | null) {
  const [scans, setScans] = useState<SpeakerScan[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!speakerId) {
      setScans([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("speaker_scans")
      .select("*")
      .eq("speaker_id", speakerId)
      .order("created_at", { ascending: false });
    setScans((data ?? []) as SpeakerScan[]);
    setLoading(false);
  }, [speakerId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { scans, loading, refresh };
}
