

## Blauton #2A809B für Überschriften und Buttons

Alle bisherigen Blautöne (#6EC1E4 für Buttons, #14b8a6 für die "Entdecke mehr über..."-Überschrift) werden einheitlich auf **#2A809B** umgestellt.

### Änderungen

**`src/components/PostPreview.tsx`**:
- Zeile 76: `text-primary` → `text-[#2A809B]` (Überschrift "Entdecke mehr über...")
- Zeile 123: `bg-[#6EC1E4]` → `bg-[#2A809B]` (Guest Website CTA)
- Zeile 173: `bg-[#6EC1E4]` → `bg-[#2A809B]` (Affiliate CTA)

**`src/lib/export-html.ts`**:
- Zeile 67: `color:#14b8a6` → `color:#2A809B` (Überschrift)
- Zeile 94: `background:#6EC1E4` → `background:#2A809B` (Guest Website CTA)
- Zeile 125: `background:#6EC1E4` → `background:#2A809B` (Affiliate CTA)

