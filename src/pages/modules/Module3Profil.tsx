import { UserCheck } from "lucide-react";
import ModulePage from "./ModulePage";

export default function Module3Profil() {
  return (
    <ModulePage
      num={3}
      title="Profil Interviewgast"
      icon={UserCheck}
      description="Erstellen eines Profils des Interviewgastes auf Basis der Erfassung seiner Bewerber-Daten und seines Vorab-Scan. Auf Basis des Profils werden die Daten für seine Sprechermappe generiert und an Zoho zur Unterschrift übergeben und ein Link zur Sprechermappe eingebunden. Erst wenn Zoho die Unterschrift zurückmeldet, werden die nachfolgenden Module freigegeben."
    />
  );
}
