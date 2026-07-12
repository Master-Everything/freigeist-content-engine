# Vermerk „Powered by Martina Hautau" in der Wissensbasis

Kleiner, dezenter Credit-Badge auf der Seite `src/pages/admin/Wissensbasis.tsx` — sichtbar, aber ohne die read-only Tabellen zu stören.

## Umsetzung

**Ort:** Direkt im Header-Block der Seite (neben Titel „Wissensbasis" + Beschreibungs-Absatz), rechtsbündig auf Desktop, darunter auf Mobile.

**Design:** State-of-the-art „Powered by"-Pill im Stil des restlichen Dark-UI:

- Kleiner runder Pill mit Border + subtilem Gradient-Hintergrund (Primary `#2A809B` → transparent).
- Sparkles-Icon (`lucide-react` → `Sparkles`) links, Text „Powered by **Martina Hautau**" rechts.
- Hover: sanfter Glow (Box-Shadow in Primary), kein Link (rein informativ) — falls du willst, mach ich's optional klickbar auf eine URL.
- Nutzt ausschließlich semantische Tokens (`border-border`, `text-muted-foreground`, `text-primary`, `bg-primary/10`) — kein Hardcoding, funktioniert in Light & Dark.

**Layout-Anpassung:** Header-Div wird zu `flex items-start justify-between gap-4 flex-wrap`, damit der Badge sauber neben dem Titel sitzt.

## Technische Details

- Datei: `src/pages/admin/Wissensbasis.tsx` (nur diese eine)
- Neuer Import: `Sparkles` aus `lucide-react`
- Kein neuer State, keine Query, keine Migration
- Badge als kleines Inline-Element im JSX (kein separates Komponent-File nötig)

## Offene Frage (kannst du auch nachträglich sagen)

Soll der Badge nur auf der Wissensbasis erscheinen (wie oben), oder projektweit z. B. im Sidebar-Footer? Default meines Plans: **nur Wissensbasis**, weil du „in der Wissensbasis" geschrieben hast.  
ANTWORT: Lass es uns auch gerne dezent nah dem Eintrag "Wissensbasis" einbauen (Admin only)