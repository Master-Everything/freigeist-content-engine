# posts.status — Workflow-Fluss

Zentraler Zustand für einen Interview-Beitrag. Die DB-Whitelist (`posts_status_check`) ist bindend.

## Kette

```text
erfassung
  → scan_pending → scan_done
  → redaktion_angefragt → in_bearbeitung
  → profil → profil_review
  → leitfaden → leitfaden_final
  → vorgespraech → vorgespraech_done
  → aufzeichnung → aufzeichnung_done
  → hub_pushed
```

Reihenfolge = Quelle der Wahrheit in `src/lib/post-status.ts` (`POST_STATUS_ORDER`). Neue Client-Schreibpfade nutzen `advanceStatus(current, next)`, damit der Status nie versehentlich zurückgesetzt wird. Serverseitig (Edge Functions) gilt derselbe Grundsatz: nur nach vorne schreiben, nie zurück.

## Modul → Status

| Modul | Liest | Schreibt | Über |
| --- | --- | --- | --- |
| M1 Erfassung | — | `erfassung` (initial) | `SpeakerForm` / `InterviewForm` |
| M2 Vorab-Scan | `erfassung`, `scan_done` | `scan_pending`, `scan_done` | Edge `vorab-scan` |
| M3 Profil | `scan_done`, `redaktion_angefragt`, `in_bearbeitung`, `profil`, `profil_review` | `redaktion_angefragt`, `in_bearbeitung`, `profil`, `profil_review` | Edge `speaker-profile-decision` |
| M4 Leitfaden | `profil_review`, `leitfaden` | `leitfaden`, `leitfaden_final` | Edge `interview-guide-decision` |
| M5 Vorgespräch | `leitfaden_final`, `vorgespraech` | `vorgespraech`, `vorgespraech_done` | `Module5Vorgespraech` |
| M6 Aufzeichnung | `vorgespraech_done`, `aufzeichnung` | `aufzeichnung`, `aufzeichnung_done` | Edge `recording-decision` (`Module6Aufzeichnung`) |
| M7 Beitrag | alle vorherigen | — | `EditPost` (Bearbeitung, kein Statuswechsel) |
| M8 Hub-Push | `aufzeichnung_done` | `hub_pushed` | Edge `push-to-hub` |

## Sperre für Speaker

`InterviewEdit.LOCKED_FOR_SPEAKER` sperrt die Bearbeitung der `posts`-Stammdaten (Titel, Thema, Produkt, Marktdauer, bisherige Interviews, kritische Stimmen, `selected_affiliate_indices`) ab dem Zeitpunkt, ab dem die Redaktion involviert ist:

```
scan_pending, scan_done, redaktion_angefragt, in_bearbeitung,
profil, profil_review, leitfaden, leitfaden_final,
vorgespraech, vorgespraech_done, aufzeichnung, aufzeichnung_done, hub_pushed
```

`speakers`-Stammdaten (E-Mail, Telefon, Website, Social-Links, Bio, `top_affiliate_products` inkl. Affiliate-Links) bleiben in `SpeakerForm.tsx` **unabhängig** von `posts.status` jederzeit editierbar.

## Aufräum-Migration (Historie)

- `in_progress`, `vorab_scan`, `draft`, `exported` → aus Constraint entfernt.
- Bestandsdaten mit `in_progress` (2 Rows) auf `erfassung` zurückgesetzt.
- `hub_pushed` als finaler Status neu aufgenommen (M7/M8-Push).
