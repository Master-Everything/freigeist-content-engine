## Ziel

Ein einziges, geteiltes Post-Layout: Was du hier in der Engine-Vorschau siehst, ist exakt das, was der Hub anzeigt. Der Hub bleibt unangetastet — wir übernehmen seine Design-Sprache in die Engine.

## Grundprinzip

Hub-CSS (aus `src/index.css` des Hub-Projekts) verwendet semantische Klassen: `.article-body`, `aside.speaker-profile`, `figure.speaker-photo/.speaker-bio`, `a.freigeist-cta`, `.freigeist-accordion / .freigeist-accordion-item`, `.video-embed`, `.article-body figure`. Wir emittieren im Engine-Renderer **exakt dieses Markup ohne Inline-Styles** und importieren die passenden Regeln in `src/index.css`. Damit rendern Engine-Vorschau und Hub aus derselben Quelle identisch.

## Änderungen

### 1. Engine-Renderer `supabase/functions/push-to-hub/render-post.ts` → Hub-natives Markup

Der Renderer erzeugt statt Inline-Styles semantisches Markup mit Hub-Klassen:

- **Kein `<h1>` und kein `<style>`-Block mehr im Body** — Title/Subtitle rendert der Hub aus `posts.title` / `posts.subtitle`.
- **Speaker-Box** → `<aside class="speaker-profile"><figure class="speaker-photo"><img src alt/></figure><div class="speaker-bio"><h3>Name</h3><p>Bio</p></div></aside>`
- **CTA-Button** → `<p style="text-align:center"><a class="freigeist-cta" href target=_blank rel=noopener>✨ Label ✨</a></p>` (identisch zum Hub `addCtaButton`)
- **Affiliate-Hinweis** → als eigener zentrierter `<p>` mit kursivem Kleintext direkt unter dem CTA
- **Zusammenfassung** → `<div class="freigeist-accordion"><details class="freigeist-accordion-item"><summary>Lead</summary><div class="freigeist-accordion-body">…</div></details></div>`
- **Bilder** → `<figure><img/></figure>` (mit optionalem umschließenden `<a>`) statt inline gestylter `<div>`s
- **Videos** → `<div class="video-embed"><iframe/></div>`
- **Section-Titel** → schlichtes `<h2>` (Hub-CSS setzt border-top, Space Grotesk, Größe automatisch)
- **Markdown-Konverter** → nur noch `<h3>/<h4>/<p>/<ul>/<li>` ohne Inline-Styles, damit `.article-body` greift

### 2. Engine `src/index.css` → Hub-Style-Regeln importieren

Ein neuer Block mit den 1:1 aus dem Hub übernommenen Regeln für `.article-body` und die enthaltenen Klassen (Speaker-Box, CTA, Accordion, Video, Figure). Dabei nutzen wir die **bereits vorhandenen Engine-Tokens** (`--foreground`, `--muted`, `--border`, `--primary` usw.) — Dark-Mode funktioniert damit automatisch mit unserem eigenen Theme. Der Freigeist-Türkis-Gradient des CTA-Buttons bleibt als Fixwert (Marken-Farbe: `#2A809B → #3BB8A8`), da er auf beiden Seiten identisch sein soll.

Fonts (Space Grotesk + Inter) werden via `@fontsource` als Package installiert und in `src/main.tsx` importiert (kein CSS `@import`, kein `index.html`-Eingriff — laut Memory).

### 3. Engine `PostPreview.tsx` (und indirekt `ViewPost.tsx`) → gemeinsame Render-Basis

- Der bisherige Preview-Renderer wird abgelöst durch **denselben HTML-Generator**, der auch zum Hub gepusht wird. Dazu ziehe ich die Renderer-Logik in ein geteiltes Modul `src/lib/render-post-html.ts` und benutze es sowohl in der Engine-Vorschau als auch im Edge-Function-Push (dort als Deno-Kopie mit identischem Output — bleibt in Sync über einen kurzen Kommentar-Header + gleichnamige Test-Fixtures).
- `PostPreview.tsx` rendert das erzeugte HTML in einem `<article className="article-body">…</article>`-Wrapper via `dangerouslySetInnerHTML` — genau derselbe Wrapper, den der Hub um seine Post-Bodies legt.
- Das aus `blocks.excerpt` erzeugte Element bekommt die Hub-typische Erst-Absatz-Größe automatisch über `.article-body p:first-of-type`.

### 4. WordPress-Export entfernen

- `src/lib/export-html.ts`, `src/lib/markdown.ts` (falls nur dort verwendet), das Modul-7-„WP hochladen"-UI und die Edge Functions `wp-upload` + `wp-upload-ftp` werden entfernt.
- Sidebar-Verweise und `App.tsx`-Route zum WP-Modul werden bereinigt.
- Ich lasse die Speaker-Rolle des Moduls 7 (falls sichtbar) auf „Deaktiviert" bzw. entferne den Menüpunkt.

### 5. Hub bleibt unangetastet

Kein Deploy, kein Edit in `docs/hub-setup/*`, keine Änderung im [FREIGEIST Content-Hub](/projects/3b7054d6-c0c3-4272-9ffa-f782221a6fba). Das existierende `ingest-interview` im Hub akzeptiert unser neues HTML unverändert und der Hub stylt es über sein `.article-body`-CSS.

## Was ausdrücklich NICHT Teil dieser Runde ist

- Bild-Transfer-Problem (kommt als eigener Task, nachdem das Layout sitzt).
- Änderungen im Hub-Projekt.
- Neue Design-Tokens/Farben — wir bleiben bei unseren bestehenden.

## Ergebnis

- Post-Vorschau in der Engine sieht pixelgleich aus wie ein Hub-Draft (Light + Dark).
- „An News-Plattform senden" schickt exakt dieses HTML → im Hub identische Darstellung inklusive Gradient-Hover-Animation am CTA und semantisch korrekter Speaker-Box.
- Weniger Code: WP-Export ist raus, ein Renderer für alles.
