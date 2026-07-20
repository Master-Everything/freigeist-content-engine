## Kleiner Cleanup in `src/pages/MyPosts.tsx`

Der zweite Import `import { supabase as sb } from "@/integrations/supabase/client"` ist redundant – der bereits oben vorhandene `supabase`-Import funktioniert auch in `resolveCoverUrl()` außerhalb der Komponente.

### Änderungen
- Zweiten Import (`supabase as sb`) entfernen.
- In `resolveCoverUrl()` `sb.storage...` durch `supabase.storage...` ersetzen.

Keine Verhaltensänderung, reines Aufräumen.