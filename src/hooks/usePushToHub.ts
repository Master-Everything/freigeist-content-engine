import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function usePushToHub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post_id: string) => {
      const { data, error } = await supabase.functions.invoke("push-to-hub", {
        body: { post_id },
      });
      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as { ok: true; hub_post_id: string | null; hub_slug: string | null };
    },
    onSuccess: (data) => {
      toast({
        title: "An News-Plattform gesendet",
        description: data.hub_slug
          ? `Entwurf angelegt (Slug: ${data.hub_slug}).`
          : "Beitrag wurde an den Hub übertragen.",
      });
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["hub-posts"] });
    },
    onError: (e: Error) => {
      toast({
        title: "Push fehlgeschlagen",
        description: e.message,
        variant: "destructive",
      });
    },
  });
}
