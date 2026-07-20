import { Newspaper, ExternalLink, Send, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePushToHub } from "@/hooks/usePushToHub";

export default function Module8NewsPlattform() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["hub-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id, guest_name, interview_title, hub_post_id, hub_slug, hub_pushed_at, hub_last_error")
        .not("hub_post_id", "is", null)
        .order("hub_pushed_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const pushToHub = usePushToHub();

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-3">
          <Newspaper className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Modul 8 — News-Plattform</h1>
          <p className="text-sm text-muted-foreground">
            Übertragene Interview-Beiträge im Freigeist Content-Hub (Kategorie „Interview")
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Übertragene Beiträge</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !posts?.length ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Noch keine Beiträge an die News-Plattform gesendet. Nutze im Editor den Button „An News-Plattform senden".
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titel</TableHead>
                  <TableHead>Gast</TableHead>
                  <TableHead>Zuletzt gesendet</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.interview_title}</TableCell>
                    <TableCell>{p.guest_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.hub_pushed_at ? new Date(p.hub_pushed_at).toLocaleString("de-DE") : "—"}
                    </TableCell>
                    <TableCell>
                      {p.hub_last_error ? (
                        <span className="text-xs text-destructive">Fehler</span>
                      ) : (
                        <span className="text-xs text-green-600 dark:text-green-400">OK</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        {p.hub_slug && (
                          <Button variant="ghost" size="sm" asChild>
                            <a
                              href={hubPostUrl(p.hub_slug)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="gap-1"
                            >
                              <ExternalLink className="h-3 w-3" /> Hub
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => pushToHub.mutate(p.id)}
                          disabled={pushToHub.isPending}
                        >
                          {pushToHub.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Send className="h-3 w-3" />
                          )}
                          Neu pushen
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
