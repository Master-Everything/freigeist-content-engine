

## Fix: Switch Component Invisible in Dark Mode

### Problem

The Switch component uses `bg-input` for its unchecked state track and `bg-background` for the thumb. In dark mode:
- `--input: 230 20% 12%` (very dark)
- `--background: 230 25% 5%` (also very dark)

Both are nearly black, making the switch invisible against dark card backgrounds.

### Solution

Update `src/components/ui/switch.tsx`:
- Change unchecked track from `bg-input` to `bg-muted-foreground/30` — provides visible contrast in both light and dark modes
- Change thumb from `bg-background` to `bg-foreground` — ensures the knob is always visible against the track

This is the only Switch usage in the project (the optional block toggles in `EditPost.tsx`), so the fix covers all occurrences.

### Changes

**`src/components/ui/switch.tsx`** — Two class changes:
1. Track: `data-[state=unchecked]:bg-input` → `data-[state=unchecked]:bg-muted-foreground/30`
2. Thumb: `bg-background` → `bg-foreground`

