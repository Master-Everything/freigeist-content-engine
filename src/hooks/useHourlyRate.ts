import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const KEY = "hourly_rate";

export function useHourlyRate() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["app_settings", KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", KEY)
        .maybeSingle();
      if (error) throw error;
      const raw = data?.value;
      const num = typeof raw === "number" ? raw : Number(raw ?? 40);
      return Number.isFinite(num) ? num : 40;
    },
  });

  const mutation = useMutation({
    mutationFn: async (rate: number) => {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: KEY, value: rate as unknown as any }, { onConflict: "key" });
      if (error) throw error;
      return rate;
    },
    onSuccess: (rate) => {
      qc.setQueryData(["app_settings", KEY], rate);
    },
  });

  return {
    rate: query.data ?? 40,
    isLoading: query.isLoading,
    setRate: mutation.mutate,
    isSaving: mutation.isPending,
  };
}
