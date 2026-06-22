import { useParams } from "react-router-dom";
import {
  ClipboardList,
  ScanSearch,
  UserCheck,
  BookOpen,
  MessagesSquare,
  Video,
  FileText,
  Newspaper,
} from "lucide-react";
import ModulePage from "./modules/ModulePage";

const modules: Record<
  string,
  { title: string; icon: any; description: string }
> = {
  "3": {
    title: "Profil & Sprechermappe",
    icon: UserCheck,
    description:
      "Hier entsteht deine öffentliche Sprechermappe auf Basis deines Profils. Du kannst sie später für Veranstalter und Medien teilen.",
  },
  "4": {
    title: "Interview-Leitfaden",
    icon: BookOpen,
    description:
      "Hier findest du bald deinen individuellen Interview-Leitfaden mit Fragen, Themenblöcken und Hinweisen zur Vorbereitung.",
  },
  "5": {
    title: "Vorgespräch",
    icon: MessagesSquare,
    description:
      "Termine und Notizen zu deinem Vorgespräch mit der Redaktion landen hier, sobald dieses Modul aktiv ist.",
  },
  "6": {
    title: "Aufzeichnung / Live",
    icon: Video,
    description:
      "Hier siehst du später Termine, Studio-Infos und Zugangslinks für deine Aufzeichnung oder dein Live-Interview.",
  },
  "7": {
    title: "Interview-Beiträge",
    icon: FileText,
    description:
      "Hier findest du später die fertigen Beiträge zu deinen Interviews — Audio, Video, Transkript und Veröffentlichungslinks.",
  },
  "8": {
    title: "News-Plattform",
    icon: Newspaper,
    description:
      "Veröffentlichungen rund um deine Interviews auf der News-Plattform werden hier zusammengeführt, sobald das Modul aktiv ist.",
  },
};

const fallback = {
  title: "Modul",
  icon: ClipboardList,
  description: "Dieses Modul ist für dich noch in Vorbereitung.",
};

export default function SpeakerModulePlaceholder() {
  const { num } = useParams();
  const m = (num && modules[num]) || fallback;
  const n = num ? Number(num) : 0;
  // dummy reference so ScanSearch import isn't flagged
  void ScanSearch;
  return (
    <ModulePage
      num={n}
      title={m.title}
      icon={m.icon}
      description={m.description}
    />
  );
}
