## Tech Stack Seite aktualisieren

`src/pages/TechStack.tsx` listet nur 4 von 13 Edge Functions und ein paar Punkte sind veraltet. Nur Datenpflege in der `SECTIONS`-Konstante, keine Logik-Änderung.

### Änderungen in `SECTIONS`

**Edge Functions in this project** — komplett ersetzen durch alle 13:
- `assign-speaker-owner` — Speaker per E-Mail einem User zuordnen
- `generate-content` — Block-Generierung via Lovable AI Gateway (mit Kontext-Injektion: Compliance, Verbotene Wörter, Profil, Leitfaden)
- `generate-interview-guide` — AI-Leitfaden für Modul 4
- `generate-speaker-profile` — AI-Profil für Modul 3
- `interview-guide-decision` — Freigabe/Änderungswunsch Leitfaden
- `interview-scan` — Vorab-Scan Interview-Text (Gemini)
- `prioritize-interview-guide` — Fragen-Priorisierung Leitfaden
- `push-to-hub` — Push in Freigeist Content-Hub
- `recording-decision` — Freigabe Aufzeichnung (Modul 6)
- `speaker-profile-decision` — Freigabe/Änderungswunsch Profil
- `vorab-scan` — Sprecher-Vorab-Scan
- `vorgespraech-decision` — Freigabe Vorgespräch (Modul 5)
- `youtube-transcript` — YouTube-Transkript-Abruf

**Utilities** — ergänzen:
- `src/lib/post-status.ts` — Zentrale Status-Definition und Rollen-Locking
- `src/lib/field-labels.ts` — DB-Feldkeys → deutsche Labels
- `src/lib/simple-markdown.tsx` — Markdown-Renderer für redaktionelle Hinweise
- `src/lib/relative-time.ts` — Zeitformatierung
- `src/lib/validation/interview-schema.ts` + `speaker-schema.ts` — Zod-Schemas

**Routing & State** — ergänzen: `sonner` (Toasts, wird tatsächlich genutzt).

**Backend (Lovable Cloud)** — Auth-Zeile präzisieren: „Email/Passwort + Rollen (`admin`/`speaker`) via separater `user_roles`-Tabelle und `has_role`-Security-Definer".

**Neu: Sektion „Kernkonzepte"** hinzufügen:
- **Rollenmodell** — Hybrid Admin/Speaker, `ProtectedRoute` mit `requiredRole`
- **ContextSheet** — Non-modales Slide-in für Profil/Interview/Scans/Fragen in M4–M7
- **AI-Kontext-Injektion** — Compliance-Regeln, Verbotene Wörter, freigegebene Profile und finale Leitfäden werden in `generate-content` gemergt
- **Storage-Ownership** — `can_write_post`-Helper (Admin/Ersteller/Speaker) für `post-images`

Keine Sektion entfernen. Reine Text-/Array-Änderungen in `SECTIONS`.
