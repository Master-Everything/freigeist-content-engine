

## UI Refactor: Split-Pane Editor Layout

### Current State
The EditPost page is a single-column layout (max-w-4xl) with stacked block cards. The preview is a separate route (`/preview/:id`). There's no side-by-side editing experience.

### Plan

**Merge the editor and preview into a single split-pane layout** using the already-installed `react-resizable-panels` library. Left panel = block editor (scrollable), right panel = live preview (scrollable, visually distinct background). Remove the separate `/preview/:id` route navigation requirement — the preview is always visible.

### Changes

| File | What |
|---|---|
| `src/pages/EditPost.tsx` | Major refactor: wrap content in `ResizablePanelGroup` with two `ResizablePanel`s. Left panel contains the existing block cards in a scrollable area. Right panel renders the preview inline (reuse preview markup from PreviewPost). Toolbar moves to a sticky top bar spanning full width. |
| `src/pages/PreviewPost.tsx` | Extract the preview rendering into a reusable `PostPreview` component so both the standalone preview route and the inline editor panel can share it. |
| `src/components/PostPreview.tsx` | New file — extracted preview component accepting `post` and `blocks` as props. Contains all the preview markup (title, excerpt, video, accordion, guest profile, sections, etc.). |

### Layout Structure

```text
┌─────────────────────────────────────────────────┐
│  ← Dashboard    [Save] [Export] [Delete]        │  sticky toolbar
├──────────────────────┬──────────────────────────┤
│                      │                          │
│   Block Editor       │   Live Preview           │
│   (white/card bg)    │   (muted bg, article)    │
│                      │                          │
│   ┌──────────────┐   │   Title                  │
│   │ Excerpt      │   │   Excerpt text           │
│   └──────────────┘   │   [Video embed]          │
│   ┌──────────────┐   │   Summary accordion      │
│   │ Main Video   │   │   Guest profile          │
│   └──────────────┘   │   Section 1...           │
│   ┌──────────────┐   │                          │
│   │ Summary Box  │   │                          │
│   └──────────────┘   │                          │
│   ...                │                          │
│                      │                          │
│  (scrollable)        │  (scrollable)            │
└──────────────────────┴──────────────────────────┘
```

### Key Decisions
- Default split: 50/50 with a draggable resize handle
- Right panel has a slightly different background (`bg-muted/30`) to visually separate it
- Preview updates live as the user types (no save required — it reads from `blocks` state)
- On mobile (< 768px), stack vertically with a tab toggle between Editor/Preview instead of side-by-side
- Keep the standalone `/preview/:id` route working (uses the same `PostPreview` component)
- Remove the "Vorschau" button from the toolbar since preview is always visible (keep on mobile as tab)

### Files Unchanged
- `NewPost.tsx` — stays single-column (it's a source input form, not a block editor)
- `Index.tsx` — dashboard stays as-is
- No database changes needed

