

## Export Screen — Convert Summary to `<details>/<summary>` Accordion

The export functionality already exists and covers most requirements (headline, excerpt, video, guest profile, sections, PrettyLink shortcodes, resources). One gap: the summary box uses a plain `<div>` instead of a native HTML `<details>/<summary>` accordion, which is what WordPress supports natively.

### Change

**`src/lib/export-html.ts`** — Replace the summary box `<div>` markup (lines 31-43) with a `<details>/<summary>` element:

```html
<details class="summary-box" open>
  <summary><h2>Title</h2></summary>
  <p>Lead text</p>
  <ul><li>...</li></ul>
</details>
```

Everything else already meets the spec:
- Starts with headline ✓
- Ends before feedback (no feedback section exists) ✓
- PrettyLink shortcodes preserved raw ✓
- Images, videos, headings, paragraphs, lists all included ✓

Single file, ~12 lines changed.

