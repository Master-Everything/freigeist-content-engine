

## Apply Modern Dark Theme

The app currently uses a light theme by default (`:root` has light values). The dark theme exists in `.dark` class but isn't active.

### Changes

1. **Force dark mode by default** in `index.html` — add `class="dark"` to the `<html>` tag.

2. **Refine dark color tokens** in `src/index.css` — update the `.dark` block with a richer, more modern dark palette:
   - Deeper background (near-black with slight blue tint)
   - Slightly elevated card surfaces
   - Vibrant purple primary accent
   - Refined muted/border tones for contrast
   - Subtle adjustments to warning/success/accent colors for dark backgrounds

No structural or component changes needed — the existing Tailwind theme variables will cascade automatically.

