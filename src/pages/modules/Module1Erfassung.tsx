import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, LogIn, UserPlus, Loader2 } from "lucide-react";
import SpeakerForm from "./erfassung/SpeakerForm";
import AdminErfassungOverview from "./erfassung/AdminErfassungOverview";

export default function Module1Erfassung() {
  const { user, role, loading: authLoading } = useAuth();
  const [speaker, setSpeaker] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Admin lädt die Übersicht separat — kein eigenes Speaker-Fetch nötig.
    if (!user || role === "admin") {
      setLoading(false);
      return;
    }
    supabase
      .from("speakers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setSpeaker(data);
        setLoading(false);
      });
  }, [user, role]);

  if (authLoading || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="mb-8 flex items-start gap-4">
          <div className="rounded-lg border bg-card p-3">
            <ClipboardList className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground tabular-nums">Modul 1</div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Erfassung Interviewgast
            </h1>
          </div>
        </div>

        <Card>
          <CardContent className="space-y-5 py-10">
            <h2 className="font-display text-xl font-semibold">
              Melden Sie sich an, um Ihr Interview anzustoßen
            </h2>
            <p className="text-muted-foreground">
              Als Speaker des Freigeist Kongresses füllen Sie einmalig Ihr Profil aus.
              Mit dem Absenden wird Ihre Interview-Anfrage an das Freigeist-Team gestartet.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild>
                <Link to="/auth">
                  <UserPlus className="mr-1.5 h-4 w-4" />
                  Registrieren
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/auth">
                  <LogIn className="mr-1.5 h-4 w-4" />
                  Einloggen
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (role === "admin") {
    return <AdminErfassungOverview />;
  }

  return <SpeakerForm existing={speaker} userId={user.id} userEmail={user.email ?? ""} />;
}
