## Bugfix: speaker_id im Kontext-Link zu Modul 3 mitgeben

**Datei:** `src/components/context/ContextSheet.tsx`

**Änderung:** Eine Zeile — der "Zu Modul 3 (Profil)"-Link übergibt zusätzlich `speaker_id` aus dem bereits geladenen `post`-Objekt.

```tsx
<Link
  to={`/module/profil?post_id=${postId}&speaker_id=${post?.speaker_id ?? ""}`}
  onClick={() => setOpen(false)}
>
```

**Warum:** `Module3Profil` rendert den `ProfilEditor` für Admins nur bei `isAdmin && postId && speakerId`. Ohne `speaker_id` landet der Admin auf dem Fallback-Text statt im Editor.

**Scope:** Nur diese eine Zeile. Kein weiterer Refactor.