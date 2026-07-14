import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserCheck } from "lucide-react";
import { toast } from "sonner";

export function AssignOwnerDialog({
  open,
  onOpenChange,
  speakerId,
  speakerName,
  defaultEmail,
  onAssigned,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  speakerId: string;
  speakerName: string;
  defaultEmail?: string | null;
  onAssigned: () => void;
}) {
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      toast.error("Bitte eine E-Mail eingeben.");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("assign-speaker-owner", {
        body: { speaker_id: speakerId, email: trimmed },
      });
      if (error) throw error;
      if ((data as any)?.error === "no_account") {
        toast.error(
          "Kein Speaker-Account mit dieser E-Mail. Bitte Speaker zuerst registrieren lassen."
        );
        return;
      }
      if ((data as any)?.error) {
        toast.error((data as any).error);
        return;
      }
      toast.success(`Owner zugewiesen: ${speakerName}`);
      onOpenChange(false);
      onAssigned();
    } catch (e: any) {
      toast.error(e?.message ?? "Fehler bei der Zuweisung");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Owner zuweisen</DialogTitle>
          <DialogDescription>
            Weise <span className="font-medium">{speakerName}</span> einem registrierten
            Speaker-Account zu. Die E-Mail muss exakt mit einem existierenden Account übereinstimmen.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label htmlFor="owner-email">Speaker-E-Mail</Label>
          <Input
            id="owner-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="speaker@example.com"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Der Speaker muss sich vorher auf der Anmelde-Seite registriert haben. Sonst schlägt die
            Zuweisung fehl.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Abbrechen
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <UserCheck className="mr-1.5 h-4 w-4" />
            )}
            Zuweisen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
