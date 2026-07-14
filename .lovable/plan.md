## Kontext-Lasche statt Header-Button

Der bisherige „Kontext"-Button im Header von M4/M5/M6 wird durch eine **fixierte Lasche am rechten Bildschirmrand** ersetzt, die den Sheet öffnet.

### 1. `ContextSheet.tsx` — Trigger umbauen

- Der bisherige `SheetTrigger` mit `Button variant="ghost"` wird ersetzt durch eine **vertikale Lasche**, `position: fixed; right: 0; top: 50%`, per `-translate-y-1/2` zentriert.
- Styling: schmaler Pill (`rounded-l-lg`, `rounded-r-none`), Primärfarbe, Schatten, Hover-Effekt (leichtes Herausschieben nach links via `hover:pr-4` / `translate-x`).
- Inhalt: `BookOpen`-Icon + Label „Kontext" mit `writing-mode: vertical-rl` (vertikal von unten nach oben lesbar), oder alternativ nur Icon + horizontales Label unterhalb – **Variante vertikal** wird gewählt, damit die Lasche schlank bleibt.
- `z-index: 40`, damit sie über normalem Content, aber unter Dialog/Sheet-Overlays liegt.

### 2. Sheet „sichtbar bleiben" — Overlay entfernen

Das Standard-`SheetContent` von shadcn rendert ein dunkles Overlay und schließt bei Klick daneben. Damit der Nutzer parallel im Modul weiterarbeiten kann:

- Eigenes `SheetContent` mit `modal={false}` am `Sheet`-Root, sodass Interaktion mit dem Rest der Seite möglich bleibt.
- Overlay per CSS ausblenden (`[&>[data-radix-dialog-overlay]]:hidden`) bzw. eine leichte Variante des `SheetContent` verwenden ohne Overlay-Element.
- Sheet bleibt geöffnet, bis der Nutzer explizit über das `X` oder erneut die Lasche schließt.
- Breite bleibt `sm:max-w-xl`, weiterhin scrollbar.

### 3. Header-Aufräumen in M4/M5/M6

- `<ContextSheet postId={postId} />` bleibt eingebunden — wird aber aus dem Header-Actions-Bereich entfernt, da die Komponente sich selbst am rechten Rand fixiert rendert.
- Empfohlener Ort: einmal am Ende des Return-JSX jedes Moduls (nach dem Haupt-Content), damit die Fixed-Positionierung sauber greift.
- Betroffen:
  - `src/pages/modules/Module4Leitfaden.tsx`
  - `src/pages/modules/Module5Vorgespraech.tsx`
  - `src/pages/modules/Module6Aufzeichnung.tsx`

### 4. Technische Details

```tsx
<Sheet open={open} onOpenChange={setOpen} modal={false}>
  <SheetTrigger asChild>
    <button
      className="fixed right-0 top-1/2 -translate-y-1/2 z-40
                 flex items-center gap-2 py-4 px-2
                 rounded-l-lg rounded-r-none
                 bg-primary text-primary-foreground shadow-lg
                 hover:pr-3 transition-all
                 [writing-mode:vertical-rl] rotate-180">
      <BookOpen className="h-4 w-4" />
      Kontext
    </button>
  </SheetTrigger>
  <SheetContent
    className="w-full sm:max-w-xl overflow-y-auto"
    onInteractOutside={(e) => e.preventDefault()}>
    …
  </SheetContent>
</Sheet>
```

### Out of Scope

- Kein Umbau der Tab-Inhalte (Profil/Interview) — nur Trigger + Öffnungsverhalten.
- Keine Änderung an Datenladelogik oder Rollenlogik.
