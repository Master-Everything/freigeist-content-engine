## Ziel
Doppeltes „Powered by Martina Hautau"-Badge vermeiden: Badge nur aus der Sidebar entfernen. In `Wissensbasis.tsx` existiert es bereits oben rechts neben der H1 — dort keine Änderung.

## Umsetzung

**`src/components/AppSidebar.tsx`**
- Den kompletten `{!collapsed && ( <SidebarMenuItem> …Powered by Martina Hautau… </SidebarMenuItem> )}`-Block im `SidebarFooter` (Zeilen ~240–252) entfernen.
- Datei danach kurz auf weitere `Sparkles`-Vorkommen prüfen; ist keins mehr vorhanden, `Sparkles` aus dem `lucide-react`-Import entfernen.

## Nicht Teil des Plans
- `src/pages/admin/Wissensbasis.tsx` bleibt unverändert (Badge ist dort bereits korrekt platziert).
