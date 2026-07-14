## Lasche mit Sheet verbinden

Die fixierte Lasche wird so umgebaut, dass sie sich beim Öffnen des Sheets mitverschiebt und bündig an der linken Kante des herausgezogenen Panels „andockt". Ein weiterer Klick auf die Lasche schließt das Sheet wieder ein.

### Änderungen in `src/components/context/ContextSheet.tsx`

1. **Sichtbarkeit im geöffneten Zustand**
   - Der `SheetTrigger` ist standardmäßig weiterhin `fixed right-0 top-1/2 -translate-y-1/2`.
   - `z-index` auf `z-[60]` erhöhen, damit die Lasche über dem portal-gerenderten `SheetContent` (`z-50`) liegt.
   - Beim Öffnen mit dynamischer Positionierung an die Sheet-Kante schieben:
     - Desktop (`sm:`): `right-[36rem]` (entspricht `sm:max-w-xl` des Sheets).
     - Mobil: Sheet ist `w-full`, Lasche darf hinter dem Sheet verschwinden — der Nutzer schließt dort über das X.
   - Klasse zusammengesetzt via `cn(...)`:
     ```tsx
     cn(
       "fixed top-1/2 -translate-y-1/2 z-[60] transition-[right] duration-300 ease-out",
       "flex items-center gap-2 py-4 pl-2 pr-1.5",
       "rounded-l-lg rounded-r-none bg-primary text-primary-foreground shadow-lg",
       "[writing-mode:vertical-rl] rotate-180 text-sm font-medium tracking-wide",
       open ? "right-0 sm:right-[36rem]" : "right-0 hover:pr-2.5"
     )
     ```

2. **Klick schließt das Sheet**
   - `SheetTrigger` von Radix togglet standardmäßig — bei `modal={false}` und `open` state greift das bereits. Zusätzlich `onClick={() => setOpen((o) => !o)}` explizit setzen, damit das Toggle-Verhalten deterministisch bleibt.

3. **Optische Verbindung**
   - `rounded-l-lg rounded-r-none` bleibt — im geöffneten Zustand sitzt die Lasche direkt links an der Sheet-Kante und wirkt wie ein Griff.
   - Kein extra Trennstrich; Schatten (`shadow-lg`) genügt.

4. **SheetContent**
   - Bleibt unverändert (`sm:max-w-xl`, non-modal, `onInteractOutside`/`onPointerDownOutside` verhindert).

### Out of Scope

- Keine Änderungen an den Modul-Seiten (M4/M5/M6).
- Keine Änderung an Datenladen, Tabs oder Rollenlogik.
