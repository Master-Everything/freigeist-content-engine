Kommentar-Nit in `src/pages/modules/erfassung/SpeakerForm.tsx` (Zeilen 226–228) aktualisieren, damit die Begründung zum aktuellen Stand passt.

**Änderung**

Alten Kommentar:
> Dank Migration ist first_name jetzt nullable — kein Sonderfall nötig.

ersetzen durch eine Formulierung, die den aktuellen Rollentausch widerspiegelt — Vorname/Nachname sind Zod-Pflicht, `email` ist optional und dank Migration nullable in der DB.

Keine Logikänderung, kein weiteres File betroffen.