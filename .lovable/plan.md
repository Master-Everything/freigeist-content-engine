

## Fix: Switch Component — Broken CSS Classes

### Problem
The switch file has corrupted Tailwind classes from a bad edit:
- Track: `bg-muted-foreground/30-foreground/30` (duplicated suffix, invalid class — renders nothing)
- Thumb: `rofored-full` instead of `rounded-full` (thumb not rounded, may not render properly)
- Thumb: `bg-background` still unchanged (invisible against dark backgrounds)

### Fix
**`src/components/ui/switch.tsx`** — rewrite both class strings:

1. Track (line 12): Fix to `data-[state=unchecked]:bg-muted-foreground/30`
2. Thumb (line 20): Fix `rofored-full` → `rounded-full`, change `bg-background` → `bg-foreground`

