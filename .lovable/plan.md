

## Apply Modern Dark Theme

Force the app into dark mode by adding the `dark` class to the HTML root. The dark CSS variables are already defined in `index.css`, so this is a simple change:

1. **Set dark class on `<html>`** in `index.html` — add `class="dark"` to the `<html>` tag
2. **Set dark background on body** in `index.html` — add `style="background-color: hsl(225, 25%, 8%)"` to prevent flash of white

That's it — all components already use CSS variables that have dark mode values defined.

