import { ClipboardList } from "lucide-react";
import ModulePage from "./ModulePage";

export default function Module1Erfassung() {
  return (
    <ModulePage
      num={1}
      title="Erfassung Interviewgast"
      icon={ClipboardList}
      description="Externe – oder interne durch ein Teammitglied – Erfassung eines potentiellen Interviewgastes durch einen hinterlegten Fragebogen (via Datenbank)."
    />
  );
}
