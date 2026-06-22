import { ScanSearch } from "lucide-react";
import ModulePage from "../ModulePage";

export default function VorabScanEingereicht() {
  return (
    <ModulePage
      num={2}
      title="Eingereichte Interviews (gescannt)"
      icon={ScanSearch}
      description="Sobald deine eingereichten Interviews gescannt wurden, erscheinen sie hier mit den Bewertungs- und Optimierungshinweisen. Die Analyse basiert auf deinen aktuellen Profildaten und den von dir eingereichten Interviews."
    />
  );
}
