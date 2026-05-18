import { Video } from "lucide-react";
import ModulePage from "./ModulePage";

export default function Module6Aufzeichnung() {
  return (
    <ModulePage
      num={6}
      title="Interview-Aufzeichnung oder Live-Sendung"
      icon={Video}
      description="Eine begleitende „Sendeplanung“ für den / die Interviewer mit dem finalen Fragenkatalog und sonstigen benötigten Informationen."
    />
  );
}
