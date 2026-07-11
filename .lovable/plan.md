## Problem

Das Profil zum Interview existiert in der DB und wird auch geladen (Network-Request liefert die Zeile), aber `ProfilEditor` zeigt nur den "Profil generieren"-Button.

## Ursache

In `src/components/profil/ProfilEditor.tsx`:

```ts
const [profile, setProfile] = useState<SpeakerProfile | null>(initial);
```

`useState(initial)` nimmt den Wert **nur beim ersten Mount**. `Module3Profil` mountet den Editor sofort mit `initial=null` (State ist beim ersten Render noch nicht geladen), fetcht dann die Zeile und aktualisiert seinen eigenen `profile`-State — aber der Editor synchronisiert seinen internen State nie mit dem geänderten `initial`-Prop. Ergebnis: der Editor bleibt bei `null` und rendert den "Profil generieren"-Zweig.

## Fix

`src/pages/modules/Module3Profil.tsx`: Editor erst rendern, wenn das initiale Laden fertig ist. Dadurch bekommt der Editor den geladenen Wert direkt als `initial` beim Mount, kein State-Sync nötig.

```ts
{loading ? (
  <Spinner …/>
) : role === "admin" && postId && speakerId ? (
  <ProfilEditor
    key={profile?.id ?? "new"}   // Remount, falls sich Post wechselt
    postId={postId}
    speakerId={speakerId}
    initial={profile}
    onChanged={setProfile}
  />
) : ( … )}
```

Der `key` sichert zusätzlich ab, dass beim Wechsel des Interviews (URL-Param ändert sich) der Editor neu gemountet wird und den neuen Datensatz übernimmt.

## Verifikation

- Seite `/module/profil?post_id=…&speaker_id=…` neu laden → Editor zeigt Kurzbio, Langbio, Themen, Kernaussagen etc. vorbefüllt.
- Wechsel zu einem Interview ohne Profil → nur "Profil generieren" sichtbar.
- Nach Klick auf "Neu generieren" oder "Speichern" bleibt der Editor stabil (setProfile aus onChanged).
