import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Danke() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="rounded-full bg-primary/10 p-4">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold">Vielen Dank!</h1>
          <p className="text-muted-foreground max-w-md">
            Ihre Anmeldung wurde erfolgreich übermittelt. Das Freigeist-Team prüft Ihre Angaben
            und meldet sich in Kürze bei Ihnen zur Abstimmung des Interviews.
          </p>
          <div className="mt-4 flex gap-3">
            <Button asChild>
              <Link to="/">Zum Dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/module/erfassung">Profil ansehen</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
