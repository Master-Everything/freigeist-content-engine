

## Fix: Rewrite Switch Component

The `switch.tsx` file has severely corrupted Tailwind classes that were never properly fixed:

**Line 12 (Track):** `bg-muted-foreground/30:outline-none` — missing space, making both the background and focus classes invalid.

**Line 20 (Thumb):** `rofored-full bg-unded-full bg-forelg` — completely garbled text instead of `rounded-full bg-foreground`.

### Fix

Rewrite `src/components/ui/switch.tsx` from scratch with clean, correct classes:

- **Track:** `data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/30` with proper focus-visible classes
- **Thumb:** `rounded-full bg-foreground` — visible knob in both light and dark modes

This is a full file rewrite since multiple lines have accumulated corruption from failed partial edits.

