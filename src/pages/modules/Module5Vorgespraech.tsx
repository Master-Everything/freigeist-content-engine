import { MessagesSquare } from "lucide-react";
import ModulePage from "./ModulePage";

export default function Module5Vorgespraech() {
  return (
    <ModulePage
      num={5}
      title="Vorgespräch Interview"
      icon={MessagesSquare}
      description="Kennenlernen von Interviewgast und Interviewer. Klären der offenen Fragestellungen. Das Interview wird transkribiert und die Inhalte der Datenbank hinzugefügt."
    />
  );
}
