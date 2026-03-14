

## Guest-Profil redesign nach Screenshot-Referenz

### Ziel
Das Gast-Profil soll dem Referenz-Screenshot entsprechen: große Überschrift darüber, zweispaltige Darstellung mit großem Foto links und Text rechts (Name als große Überschrift, darunter Bio-Text).

### Änderungen

**`src/components/PostPreview.tsx`** (Zeilen 73-87):
- Über dem Profil-Block eine große, zentrierte Überschrift: "Entdecke mehr über {guest_name} und seine inspirierenden Projekte" (teal/primary farbig, fett, kursiv, serif)
- Zwei-Spalten-Layout: Bild links (ca. 40% Breite, eckig/leicht gerundet), Text rechts
- Gast-Name als großer h2 Heading
- Bio-Text als normaler Fließtext, justified
- Avatar-Komponente ersetzen durch normales `<img>` für größere Darstellung
- Hintergrund: leicht grau (bg-muted/30 oder ähnlich)

**`src/lib/export-html.ts`** (Zeilen 58-69):
- Gleiche Struktur im HTML-Export: Überschrift + zweispaltiges Layout mit inline Styles

