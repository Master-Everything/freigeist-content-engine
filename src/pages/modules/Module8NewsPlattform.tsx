import { Newspaper } from "lucide-react";
import ModulePage from "./ModulePage";

export default function Module8NewsPlattform() {
  return (
    <ModulePage
      num={8}
      title="News-Plattform"
      icon={Newspaper}
      description="Der finale Blog-Beitrag des Interviews wird an die News-Plattform übergeben, wo die Schlussredaktion erfolgt. Die News-Plattform existiert als eigenes Lovable-Projekt mit eigener Datenbank."
    />
  );
}
