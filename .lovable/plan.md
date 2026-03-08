

## Freigeist Content Engine V1

A modern dashboard-style app for producing standardized interview posts for Freigeist Kongress. Supabase-backed with real AI generation via Lovable AI.

### Pages & Flow

**1. Dashboard**
- Modern card-based list of all posts with status badges (Draft / In Progress / Exported)
- Search/filter by status
- "Create New Post" button → navigates to source input

**2. Source Input Screen**
- Clean form with fields: Guest name, Interview title, YouTube URL, Newsletter text, Telegram text, Guest website URL, Guest profile text, PrettyLink shortcodes
- Required fields marked; optional fields clearly labeled
- "Analyze Content" button → sends data to AI and navigates to block editor

**3. AI Generation (behind the scenes)**
- Edge function calls Lovable AI (Gemini) with the source data and a tailored prompt
- Generates: headline, excerpt, summary box (title, lead, bullets), guest bio, 3 content sections
- Results populate the block editor automatically

**4. Block Editor**
- Each content piece is an editable block with inline editing
- **Required blocks** (always visible): Headline, Excerpt, Main Video (YouTube embed), Summary Box, Guest Profile, Content Sections 1–3
- **Optional blocks** (toggle on/off): Additional Video, PrettyLink Block, Resources Block
- Optional blocks can be reordered via drag handles
- "Preview" button → shows rendered post preview
- "Export HTML" button → generates clean semantic HTML and copies to clipboard
- Auto-saves to Supabase as user edits

**5. Preview Screen**
- Read-only rendered view of the post content (headline through last content block)
- No theme chrome, sidebar, or comment section
- Back to editor button

### Database (Supabase)
- `posts` table: id, status, guest_name, interview_title, youtube_url, newsletter_text, telegram_text, guest_website, guest_profile_text, prettylink_shortcodes, blocks (JSON), created_at, updated_at

### Backend
- Edge function `generate-content`: accepts source data, calls Lovable AI with a structured prompt, returns generated blocks

### Design
- Modern SaaS dashboard style with dark/light mode support
- Clean typography, card-based layouts, status badges with color coding
- Responsive but desktop-primary

