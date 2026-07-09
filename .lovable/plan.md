## Ziel
Speaker-Foto in der Speaker-Box kommt ausschließlich aus Modul 1 (SpeakerAvatarField). Die Bild-Slots **Oben / Mitte / Unten** bleiben erhalten — sowohl im Editor als auch im Renderer und Push.

## Was zu tun ist

### 1. Fix „Bild landet unter der Speaker-Box statt drin"
Ursache: Aktueller Post hat `guest_image_url` noch mit alter WordPress-URL. Beim Upload via „Oberes Bild"-Slot wird korrekterweise `top_image_url` befüllt → erscheint als eigenes `<figure>` nach der Speaker-Box (so gewollt).

**Lösung:** Kein Code-Fix nötig — du lädst das Speaker-Foto einmal über das Feld **„Profilbild (aus Speaker-Profil)"** im Editor hoch (oder in Modul 1). Damit landet es in der Speaker-Box.

### 2. Klarere UI im Editor (`src/pages/EditPost.tsx`)
- `SpeakerAvatarField`-Label von „Profilbild (aus Speaker-Profil)" → **„Speaker-Foto (Speaker-Box, aus Modul 1)"** damit unmissverständlich ist, welches Feld die Box füllt.
- Labels der Slots präzisieren:
  - „Oberes Bild (nach Gast-Profil)" → **„Bild oben (im Artikel, nach Speaker-Box)"**
  - „Mittleres Bild" → **„Bild Mitte (nach Sektion 3)"**
  - „Unteres Bild" → **„Bild unten (vor Ressourcen)"**
- Kurzer Hinweis-Text über dem oberen Slot: „Diese Bilder erscheinen zusätzlich im Artikelfluss — nicht in der Speaker-Box."

### 3. Renderer / Push
- **Keine Änderungen.** Top/Mid/End werden weiterhin als eigene `<figure>`-Elemente nach Speaker-Box / Sektion 3 / vor Ressourcen gerendert (aktueller Stand ist korrekt und Hub-konform).
- `collectImages()` in `push-to-hub/index.ts` bleibt unverändert (schickt alle vier Bild-URLs an den Hub).

### 4. Alt-Daten
Ich fasse die DB **nicht** automatisch an. Der aktuelle Post-Datensatz behält seine alte `guest_image_url` bis du einmal in Modul 1 (oder über das Editor-Feld) ein neues Speaker-Foto hochlädst — dann wird er via `SpeakerAvatarField` beim nächsten Öffnen synchronisiert.

## Nicht Teil des Plans
- Löschen/Entfernen der top/mid/end-Bild-Slots.
- DB-Schema-Änderungen.
- Hub-seitige Anpassungen.
