import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Counts = { rules: number; banned: number; prompts: number } | null;

export function useKnowledgeCounts() {
  const [counts, setCounts] = useState<Counts>(null);
  useEffect(() => {
    (async () => {
      const [r, b, p] = await Promise.all([
        supabase.from("knowledge_compliance_rules").select("*", { count: "exact", head: true }),
        supabase.from("knowledge_banned_words").select("*", { count: "exact", head: true }),
        supabase.from("knowledge_prompts").select("*", { count: "exact", head: true }),
      ]);
      setCounts({ rules: r.count ?? 0, banned: b.count ?? 0, prompts: p.count ?? 0 });
    })();
  }, []);
  return counts;
}
