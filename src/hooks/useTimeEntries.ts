import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TimeEntryStatus = "geschätzt" | "bestätigt";

export interface TimeEntry {
  id: string;
  entry_date: string;
  block: string;
  task: string;
  hours: number;
  note: string | null;
  status: TimeEntryStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimeEntryInput {
  entry_date: string;
  block: string;
  task: string;
  hours: number;
  note?: string | null;
  status?: TimeEntryStatus;
}

export function useTimeEntries() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["time_entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .order("entry_date", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => ({ ...r, hours: Number(r.hours) })) as TimeEntry[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["time_entries"] });

  const create = useMutation({
    mutationFn: async (input: TimeEntryInput) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("time_entries").insert({
        ...input,
        status: input.status ?? "geschätzt",
        created_by: user.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<TimeEntry> & { id: string }) => {
      const { error } = await supabase.from("time_entries").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("time_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    entries: query.data ?? [],
    isLoading: query.isLoading,
    create: create.mutate,
    update: update.mutate,
    remove: remove.mutate,
  };
}
