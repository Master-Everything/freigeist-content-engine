import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ComplianceRule = {
  code: string;
  industry: string;
  question_text: string;
  risk_response_text: string | null;
  legal_basis: string | null;
  severity: string;
  active: boolean;
};
type BannedWord = {
  term: string;
  category: string;
  severity: string;
  replacement_suggestion: string | null;
  active: boolean;
};
type Prompt = {
  key: string;
  title: string;
  model: string;
  version: number;
  active: boolean;
  system_prompt: string;
};
type EmailTemplate = {
  key: string;
  subject: string;
  body_markdown: string;
  active: boolean;
};
type Tip = {
  topic: string;
  industry: string | null;
  trigger_text: string;
  tip_text: string;
  source: string | null;
};

function SeverityBadge({ s }: { s: string }) {
  const color =
    s === "critical"
      ? "bg-destructive/15 text-destructive border-destructive/30"
      : s === "high"
      ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
      : s === "warn"
      ? "bg-yellow-500/15 text-yellow-600 border-yellow-500/30"
      : "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={color}>
      {s}
    </Badge>
  );
}

function useSearch<T>(rows: T[], pick: (r: T) => string, q: string) {
  return useMemo(() => {
    if (!q.trim()) return rows;
    const needle = q.toLowerCase();
    return rows.filter((r) => pick(r).toLowerCase().includes(needle));
  }, [rows, pick, q]);
}

export default function Wissensbasis() {
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [banned, setBanned] = useState<BannedWord[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [mails, setMails] = useState<EmailTemplate[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);

  const [qRules, setQRules] = useState("");
  const [qBanned, setQBanned] = useState("");
  const [qTips, setQTips] = useState("");

  useEffect(() => {
    (async () => {
      const [r1, r2, r3, r4, r5] = await Promise.all([
        supabase.from("knowledge_compliance_rules").select("*").order("code"),
        supabase.from("knowledge_banned_words").select("*").order("category").order("term"),
        supabase.from("knowledge_prompts").select("*").order("key"),
        supabase.from("knowledge_email_templates").select("*").order("key"),
        supabase.from("knowledge_moderation_tips").select("*").order("source").order("topic"),
      ]);
      setRules((r1.data ?? []) as ComplianceRule[]);
      setBanned((r2.data ?? []) as BannedWord[]);
      setPrompts((r3.data ?? []) as Prompt[]);
      setMails((r4.data ?? []) as EmailTemplate[]);
      setTips((r5.data ?? []) as Tip[]);
      setLoading(false);
    })();
  }, []);

  const filteredRules = useSearch(
    rules,
    (r) => `${r.code} ${r.industry} ${r.question_text} ${r.legal_basis ?? ""}`,
    qRules,
  );
  const filteredBanned = useSearch(
    banned,
    (b) => `${b.term} ${b.category}`,
    qBanned,
  );
  const filteredTips = useSearch(
    tips,
    (t) => `${t.topic} ${t.industry ?? ""} ${t.trigger_text} ${t.tip_text}`,
    qTips,
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Wissensbasis</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Read-only Übersicht der geseedeten GEM-Daten (Compliance-Regeln, BannedWords,
            Master-Prompts, E-Mail-Vorlagen, Moderations-Tipps). Änderungen aktuell nur per
            Migration.
          </p>
        </div>
        <div
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-gradient-to-r from-primary/10 to-transparent px-3 py-1 text-xs text-muted-foreground shadow-[0_0_0_0_transparent] transition-shadow hover:shadow-[0_0_16px_-2px_hsl(var(--primary)/0.5)]"
          title="Powered by Martina Hautau"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>
            Powered by <span className="font-medium text-foreground">Martina Hautau</span>
          </span>
        </div>
      </div>

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">Regeln · {rules.length}</TabsTrigger>
          <TabsTrigger value="banned">BannedWords · {banned.length}</TabsTrigger>
          <TabsTrigger value="prompts">Prompts · {prompts.length}</TabsTrigger>
          <TabsTrigger value="mails">E-Mails · {mails.length}</TabsTrigger>
          <TabsTrigger value="tips">Moderation · {tips.length}</TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-base">Compliance-Regeln (Phase B)</CardTitle>
              <Input
                placeholder="Suche Code, Branche, Frage…"
                value={qRules}
                onChange={(e) => setQRules(e.target.value)}
                className="max-w-sm"
              />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Code</TableHead>
                    <TableHead className="w-28">Branche</TableHead>
                    <TableHead>Frage</TableHead>
                    <TableHead>Risiko-Antwort</TableHead>
                    <TableHead className="w-40">Rechtsgrundlage</TableHead>
                    <TableHead className="w-20">Severity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRules.map((r) => (
                    <TableRow key={r.code}>
                      <TableCell className="font-mono text-xs">{r.code}</TableCell>
                      <TableCell className="text-xs capitalize">{r.industry}</TableCell>
                      <TableCell className="text-sm">{r.question_text}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.risk_response_text}
                      </TableCell>
                      <TableCell className="text-xs">{r.legal_basis}</TableCell>
                      <TableCell>
                        <SeverityBadge s={r.severity} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banned">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-base">BannedWords / Marketing-Floskeln</CardTitle>
              <Input
                placeholder="Suche Begriff oder Kategorie…"
                value={qBanned}
                onChange={(e) => setQBanned(e.target.value)}
                className="max-w-sm"
              />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Begriff</TableHead>
                    <TableHead className="w-48">Kategorie</TableHead>
                    <TableHead className="w-24">Severity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBanned.map((b) => (
                    <TableRow key={b.term}>
                      <TableCell className="text-sm">{b.term}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {b.category}
                      </TableCell>
                      <TableCell>
                        <SeverityBadge s={b.severity} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts">
          <div className="space-y-4">
            {prompts.map((p) => (
              <Card key={p.key}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">{p.key}</span>
                    <span>{p.title}</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      v{p.version} · {p.model}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs whitespace-pre-wrap bg-muted/30 p-3 rounded-md max-h-96 overflow-auto">
                    {p.system_prompt}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="mails">
          <div className="space-y-4">
            {mails.map((m) => (
              <Card key={m.key}>
                <CardHeader>
                  <CardTitle className="text-base">
                    <span className="font-mono text-xs text-muted-foreground mr-3">{m.key}</span>
                    {m.subject}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs whitespace-pre-wrap bg-muted/30 p-3 rounded-md">
                    {m.body_markdown}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tips">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-base">Moderations-Tipps & Eskalation</CardTitle>
              <Input
                placeholder="Suche Thema oder Auslöser…"
                value={qTips}
                onChange={(e) => setQTips(e.target.value)}
                className="max-w-sm"
              />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-56">Thema</TableHead>
                    <TableHead className="w-24">Branche</TableHead>
                    <TableHead>Auslöser</TableHead>
                    <TableHead>Tipp</TableHead>
                    <TableHead className="w-40">Quelle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTips.map((t, i) => (
                    <TableRow key={`${t.topic}-${i}`}>
                      <TableCell className="text-sm">{t.topic}</TableCell>
                      <TableCell className="text-xs capitalize text-muted-foreground">
                        {t.industry}
                      </TableCell>
                      <TableCell className="text-xs">{t.trigger_text}</TableCell>
                      <TableCell className="text-xs">{t.tip_text}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t.source}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {loading && <div className="text-xs text-muted-foreground">Lade…</div>}
    </div>
  );
}
