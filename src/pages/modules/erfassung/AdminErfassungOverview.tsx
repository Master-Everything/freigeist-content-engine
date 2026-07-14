import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ClipboardList,
  Plus,
  ChevronDown,
  ChevronRight,
  Search,
  UserCheck,
  ExternalLink,
  Loader2,
  Users,
  FileText,
} from "lucide-react";
import { AssignOwnerDialog } from "./AssignOwnerDialog";

type Speaker = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  user_id: string | null;
  created_by: string | null;
};

type Post = {
  id: string;
  speaker_id: string | null;
  interview_title: string;
  status: string;
  created_by: string | null;
  updated_at: string;
};

type ProfileStatus = {
  speaker_id: string;
  status: string;
};

const STORAGE_KEY = "m1.overview.openSpeakers";

function ownerBadge(speaker: Speaker, ownerEmailById: Record<string, string | undefined>) {
  if (!speaker.user_id) {
    return (
      <Badge variant="outline" className="border-dashed text-muted-foreground">
        Kein Owner
      </Badge>
    );
  }
  const email = ownerEmailById[speaker.user_id];
  return (
    <Badge variant="secondary" className="max-w-[220px] truncate">
      👤 {email ?? "Speaker zugewiesen"}
    </Badge>
  );
}

function statusChip(status: string, kind: "profile" | "post") {
  const map: Record<string, string> = {
    // Profile
    entwurf: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
    kuratiert: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    freigegeben: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    // Post
    erfassung: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
    scan_pending: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    scan_done: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
    in_bearbeitung: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    profil_review: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    profil: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    leitfaden: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
    vorgespraech: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    aufzeichnung: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300",
    in_progress: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    exported: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  };
  const cls = map[status] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {status}
    </span>
  );
}

export default function AdminErfassungOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<ProfileStatus[]>([]);
  const [ownerEmailById, setOwnerEmailById] = useState<Record<string, string | undefined>>({});
  const [q, setQ] = useState("");
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [assignFor, setAssignFor] = useState<Speaker | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(openMap));
    } catch {
      /* ignore */
    }
  }, [openMap]);

  async function load() {
    setLoading(true);
    const [sRes, pRes, prRes] = await Promise.all([
      supabase
        .from("speakers")
        .select("id, first_name, last_name, email, avatar_url, user_id, created_by")
        .order("created_at", { ascending: false }),
      supabase
        .from("posts")
        .select("id, speaker_id, interview_title, status, created_by, updated_at")
        .order("updated_at", { ascending: false }),
      supabase
        .from("speaker_profiles")
        .select("speaker_id, status"),
    ]);
    if (sRes.data) setSpeakers(sRes.data as Speaker[]);
    if (pRes.data) setPosts(pRes.data as Post[]);
    if (prRes.data) setProfiles(prRes.data as ProfileStatus[]);

    // Owner-E-Mails werden über die speakers.email approximiert (Speaker verwaltet die Kontakt-E-Mail).
    // Präzisere Auth-E-Mail via Edge Function ist im Rahmen dieses Moduls nicht nötig — Chip zeigt "Speaker zugewiesen".
    const emails: Record<string, string | undefined> = {};
    (sRes.data ?? []).forEach((s: any) => {
      if (s.user_id) emails[s.user_id] = s.email;
    });
    setOwnerEmailById(emails);
    setLoading(false);
  }

  useEffect(() => {
    if (user) load();
     
  }, [user]);

  const postsBySpeaker = useMemo(() => {
    const m: Record<string, Post[]> = {};
    posts.forEach((p) => {
      if (!p.speaker_id) return;
      (m[p.speaker_id] ??= []).push(p);
    });
    return m;
  }, [posts]);

  const profileBySpeaker = useMemo(() => {
    const m: Record<string, string> = {};
    profiles.forEach((p) => {
      // wenn mehrere: nimm den ersten (i.d.R. 1:1)
      if (!m[p.speaker_id]) m[p.speaker_id] = p.status;
    });
    return m;
  }, [profiles]);

  const filtered = useMemo(() => {
    if (!q.trim()) return speakers;
    const needle = q.trim().toLowerCase();
    return speakers.filter((s) => {
      const nameHit =
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(needle) ||
        (s.email ?? "").toLowerCase().includes(needle);
      if (nameHit) return true;
      const titles = postsBySpeaker[s.id] ?? [];
      return titles.some((p) => (p.interview_title ?? "").toLowerCase().includes(needle));
    });
  }, [speakers, q, postsBySpeaker]);

  const toggle = (id: string) =>
    setOpenMap((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="rounded-lg border bg-card p-3">
            <ClipboardList className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground tabular-nums">Modul 1</div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Erfassung · Speaker &amp; Interviews
            </h1>
            <p className="mt-1 text-muted-foreground">
              Komplette Datenbank-Übersicht. Neue Speaker und Interviews auch im Auftrag anlegen.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/module/interview/neu">
              <FileText className="mr-1.5 h-4 w-4" />
              Neues Interview
            </Link>
          </Button>
          <Button asChild>
            <Link to="/module/erfassung/neu">
              <Plus className="mr-1.5 h-4 w-4" />
              Neuer Speaker
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Suche: Name, E-Mail oder Interview-Titel"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span className="tabular-nums">{speakers.length} Speaker</span>
          <span>·</span>
          <FileText className="h-3.5 w-3.5" />
          <span className="tabular-nums">{posts.length} Interviews</span>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="rounded-full border bg-muted/40 p-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="font-medium">Noch keine Speaker erfasst</div>
            <p className="max-w-sm text-sm text-muted-foreground">
              Lege den ersten Speaker an — im Anschluss kannst du beliebig viele Interviews
              hinzufügen.
            </p>
            <Button asChild className="mt-2">
              <Link to="/module/erfassung/neu">
                <Plus className="mr-1.5 h-4 w-4" />
                Ersten Speaker anlegen
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => {
            const list = postsBySpeaker[s.id] ?? [];
            const profStatus = profileBySpeaker[s.id];
            const open = !!openMap[s.id];
            return (
              <Card key={s.id} className="overflow-hidden">
                <Collapsible open={open} onOpenChange={() => toggle(s.id)}>
                  <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-3 rounded-md p-1 hover:bg-accent/40"
                        aria-label="Interviews anzeigen"
                      >
                        {open ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        {s.avatar_url ? (
                          <img
                            src={
                              s.avatar_url.startsWith("http")
                                ? s.avatar_url
                                : supabase.storage
                                    .from("speaker-avatars")
                                    .getPublicUrl(s.avatar_url).data.publicUrl
                            }
                            alt=""
                            className="h-9 w-9 rounded-full border object-cover"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full border bg-muted" />
                        )}
                        <div className="text-left">
                          <div className="font-medium leading-tight">
                            {s.first_name} {s.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground">{s.email}</div>
                        </div>
                      </button>
                    </CollapsibleTrigger>

                    <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                      {profStatus ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          Profil: {statusChip(profStatus, "profile")}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Kein Profil-Entwurf</span>
                      )}
                      {ownerBadge(s, ownerEmailById)}
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {list.length} Interview{list.length === 1 ? "" : "s"}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/module/erfassung/bearbeiten/${s.id}`)}
                        >
                          Profil öffnen
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate(`/module/interview/neu?speaker_id=${s.id}`)
                          }
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          Interview
                        </Button>
                        {!s.user_id && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setAssignFor(s)}
                          >
                            <UserCheck className="mr-1 h-3.5 w-3.5" />
                            Owner zuweisen
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <CollapsibleContent>
                    <div className="border-t bg-muted/20 px-4 py-3">
                      {list.length === 0 ? (
                        <div className="flex items-center justify-between gap-2 py-2 text-sm text-muted-foreground">
                          <span>Noch keine Interviews zu diesem Speaker.</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate(`/module/interview/neu?speaker_id=${s.id}`)
                            }
                          >
                            <Plus className="mr-1 h-3.5 w-3.5" />
                            Erstes Interview anlegen
                          </Button>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {list.map((p) => (
                            <div
                              key={p.id}
                              className="flex flex-wrap items-center gap-3 py-2 text-sm"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="truncate font-medium">
                                  {p.interview_title || "(ohne Titel)"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  aktualisiert{" "}
                                  {new Date(p.updated_at).toLocaleString("de-DE", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  })}
                                </div>
                              </div>
                              {statusChip(p.status, "post")}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  navigate(`/module/interview/edit/${p.id}`)
                                }
                              >
                                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                                Öffnen
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}

      {assignFor && (
        <AssignOwnerDialog
          open={!!assignFor}
          onOpenChange={(o) => !o && setAssignFor(null)}
          speakerId={assignFor.id}
          speakerName={`${assignFor.first_name} ${assignFor.last_name}`}
          defaultEmail={assignFor.email}
          onAssigned={load}
        />
      )}
    </div>
  );
}
