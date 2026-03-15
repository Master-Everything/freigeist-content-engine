import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type UploadMethod = "rest" | "ftp";

export function ScreenshotSettings() {
  const [method, setMethod] = useState<UploadMethod>(
    () => (localStorage.getItem("wp_upload_method") as UploadMethod) || "rest"
  );
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  function handleMethodChange(useFtp: boolean) {
    const m = useFtp ? "ftp" : "rest";
    setMethod(m);
    localStorage.setItem("wp_upload_method", m);
    setTestResult(null);
  }

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const fnName = method === "ftp" ? "wp-upload-ftp" : "wp-upload";
      const { data, error } = await supabase.functions.invoke(fnName, {
        body: { testConnection: true },
      });
      if (error) throw error;
      setTestResult({ success: data.success, message: data.message });
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || "Connection failed" });
    }
    setTesting(false);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Upload-Einstellungen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Upload-Methode</CardTitle>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">REST API</Label>
                  <Switch checked={method === "ftp"} onCheckedChange={handleMethodChange} />
                  <Label className="text-xs text-muted-foreground">FTP</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                {method === "rest"
                  ? "Uploads via WordPress REST API mit Basic Auth. Benötigt WP_USERNAME und WP_APP_PASSWORD."
                  : "Uploads via FTP. Benötigt FTP_HOST, FTP_PORT, FTP_USERNAME, FTP_PASSWORD."}
              </p>
              <Badge variant="outline" className="text-[10px]">
                {method === "rest" ? "Empfohlen" : "Fallback"}
              </Badge>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={testConnection} disabled={testing} className="gap-2">
              {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Verbindung testen
            </Button>
            {testResult && (
              <div className="flex items-center gap-1.5">
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <span className="text-xs text-muted-foreground">{testResult.message}</span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground">
            Zugangsdaten werden sicher in Lovable Cloud Secrets gespeichert und sind nie im Frontend sichtbar.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function getUploadMethod(): UploadMethod {
  return (localStorage.getItem("wp_upload_method") as UploadMethod) || "rest";
}
