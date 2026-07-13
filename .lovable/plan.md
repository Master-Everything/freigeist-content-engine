## Sidebar-Status vereinheitlichen

In `src/components/AppSidebar.tsx`:

**adminModules & speakerModules:**
- M1 Erfassung → `active`
- M2 Vorab-Scan → `active`
- M3 Profil & Sprechermappe → `active`
- M4 Interview-Leitfaden → `active`
- M5 Vorgespräch → `active`
- M6 Aufzeichnung / Live → `active`
- **M7 Interview-Beiträge → neuer Status `update`**
- M8 News-Plattform → `active`

**Neuer Status "update":**
- Erweitere den `Module`-Typ (`status: "active" | "in-progress" | "planned" | "update"`)
- Badge-Styling: blaue Akzentfarbe (z.B. `border-blue-500/40 text-blue-500`), Label: "Update"
- Ergänze die entsprechenden Zweige im Badge-`className` und Label-Ausdruck

Keine weiteren Änderungen (Routing, Guards, Inhalte bleiben unangetastet).
