import { ScanSearch } from "lucide-react";
import ModulePage from "./ModulePage";

export default function Module2VorabScan() {
  return (
    <ModulePage
      num={2}
      title="Vorab-Scan Interviewgast"
      icon={ScanSearch}
      description="Scannen des Interviewgastes auf kritische Punkte via AI. Bewertung, ob ein Interviewgast für ein Interview in Frage kommt oder eben nicht. Anschliessend Erstellen und Bereitstellen von Hinweisen für generelle Optimierungen, um die Qualität des Interviewgastes mit seinem Gastangebot / Gastthema zu erhöhen – bzw. um eine erneute Bewertung anzustossen (ggf. ist hierzu ein Account erforderlich – sprich, eine Sprecher-Datenbank oder Tabelle darin)."
    />
  );
}
