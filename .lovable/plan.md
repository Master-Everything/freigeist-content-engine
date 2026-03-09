

## Add Light/Dark Mode Toggle

Add a sun/moon toggle button to the dashboard header that switches between light and dark themes by toggling the `dark` class on the `<html>` element, persisting the choice in localStorage.

### Changes

1. **Create `src/hooks/use-theme.ts`** — Custom hook that reads/writes `localStorage("theme")` and toggles `document.documentElement.classList` between `dark` and light.

2. **Update `src/pages/Index.tsx`** — Add a ghost icon button (Sun/Moon from lucide-react) in the header row next to "Neuer Beitrag", using the theme hook.

3. **Add the same toggle to `EditPost.tsx` and `NewPost.tsx` headers** for consistency across all pages.

