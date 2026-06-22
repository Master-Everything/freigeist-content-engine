import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CharCounter } from "@/components/ui/char-counter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectTo = (location.state as any)?.from || "/module/erfassung";

  useEffect(() => {
    if (!authLoading && user) navigate(redirectTo, { replace: true });
  }, [user, authLoading, navigate, redirectTo]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else navigate(redirectTo, { replace: true });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + redirectTo },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Registrierung erfolgreich. Bitte E-Mail bestätigen.");
  };

  const google = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + redirectTo,
    });
    if (result.error) {
      toast.error("Google-Anmeldung fehlgeschlagen");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Freigeist Kongress
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Anmeldung für Speaker und Team
          </p>
        </div>

        <Card>
          <Tabs defaultValue="signin">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Anmelden</TabsTrigger>
                <TabsTrigger value="signup">Registrieren</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={google}
                disabled={loading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Mit Google fortfahren
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">oder</span>
                </div>
              </div>

              <TabsContent value="signin" className="space-y-4 mt-0">
                <form onSubmit={signIn} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-email">E-Mail</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      required
                      maxLength={255}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <CharCounter current={email.length} max={255} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-password">Passwort</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      required
                      maxLength={72}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <CharCounter current={password.length} max={72} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Anmelden
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-0">
                <form onSubmit={signUp} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email">E-Mail</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      required
                      maxLength={255}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <CharCounter current={email.length} max={255} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password">Passwort</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      minLength={6}
                      maxLength={72}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Mindestens 6 Zeichen</p>
                    <CharCounter current={password.length} max={72} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Konto erstellen
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
