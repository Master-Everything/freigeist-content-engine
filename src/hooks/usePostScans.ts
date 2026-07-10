import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PostScan = {
  id: string;
  post_id: string;
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

export function usePostScans(postId: string | null) {
  const [scans, setScans] = useState<PostScan[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!postId) {
      setScans([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("post_scans")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });
    setScans((data ?? []) as PostScan[]);
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { scans, loading, refresh };
}

/** Lädt die neuesten Scans (Admin-Übersicht). */
export function useAllPostScans() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("post_scans")
      .select("*, posts(id, interview_title, speaker_id, status, speakers(first_name, last_name))")
      .order("created_at", { ascending: false })
      .limit(500);
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { rows, loading, refresh };
}
