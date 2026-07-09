## Problem
`post-images` (und `speaker-avatars`) sind als **private** Buckets angelegt. Der Upload klappt, aber `getPublicUrl()` liefert eine URL, auf die ohne Signed Token niemand zugreifen kann → Bild bleibt in Preview (und später im Hub) leer/broken.

## Lösung: Buckets öffentlich schalten
Da die Bilder ohnehin öffentlich im Content-Hub eingebettet werden, brauchen wir public read.

1. `post-images` via `supabase--storage_update_bucket` auf `public=true` setzen.
2. `speaker-avatars` via `supabase--storage_update_bucket` auf `public=true` setzen (Speaker-Foto wird ebenfalls im Post gerendert).
3. Kein Code-Change nötig — `getPublicUrl()` liefert dann eine funktionierende URL.

## Risiko
Workspace könnte public Buckets blocken (`cloud_block_public_buckets`). Falls der Toolcall fehlschlägt, fallback: Signed URLs mit langer Lebensdauer + Hinweis an dich, die Policy in Settings → Privacy & Security freizuschalten.

## Kein Hub-Change
Der Hub bleibt unangetastet — er lädt einfach die public URLs.