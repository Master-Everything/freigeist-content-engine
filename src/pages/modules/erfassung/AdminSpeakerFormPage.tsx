import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import SpeakerForm from "./SpeakerForm";

export default function AdminSpeakerFormPage({ mode }: { mode: "create" | "edit" }) {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(mode === "edit");
  const [existing, setExisting] = useState<any | null>(null);

  useEffect(() => {
    if (mode !== "edit" || !id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("speakers").select("*").eq("id", id).maybeSingle();
      if (!cancelled) {
        setExisting(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, mode]);

  if (!user) return null;
  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto max-w-5xl px-6 pt-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/module/erfassung")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Zurück zur Übersicht
        </Button>
      </div>
      <SpeakerForm
        existing={existing}
        userId={user.id}
        userEmail={existing?.email ?? ""}
        mode="admin"
        initialSpeakerId={mode === "edit" ? id ?? null : null}
        onCreated={(newId) =>
          navigate(`/module/erfassung/bearbeiten/${newId}`, { replace: true })
        }
      />
    </div>
  );
}
