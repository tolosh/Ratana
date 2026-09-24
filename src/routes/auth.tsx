import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to Rātana Scribe" },
      { name: "description", content: "Sign in or create a Rātana Scribe account for clinicians and practices." },
      { property: "og:title", content: "Sign in to Rātana Scribe" },
      { property: "og:description", content: "Clinical scribe for clinicians and practices. Review and sign every note." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const inputClass = "h-11 w-full rounded-control border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "signup") setMode("signup");
    const linkErr = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("error_code") ?? new URLSearchParams(window.location.search).get("error_code");
    if (linkErr) setError(linkErr === "otp_expired" ? "That confirmation link has expired or was already used. If your email is confirmed, sign in below; otherwise create the account again to get a new link." : "That link could not be used. Please sign in or request a new link.");
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/app" }); });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => { if (event === "SIGNED_IN" && session) navigate({ to: "/app" }); });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setMessage(null);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message === "Invalid login credentials" ? "Email or password is incorrect." : error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth` } });
      if (error) setError(error.message);
      else if (!data.session) setMessage(`Confirmation sent to ${email}. Open the link to continue.`);
    }
    setBusy(false);
  }

  async function google() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/auth` });
    if (result.error) setError("Google sign-in did not complete.");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center gap-2.5" aria-label="Rātana home">
          <svg className="size-7 text-primary" viewBox="0 0 40 40" aria-hidden="true" fill="none"><path d="M6 35V17.5C6 9.9 12.3 4 20 4s14 5.9 14 13.5V35" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /><circle cx="20" cy="21" r="3.6" fill="currentColor" /></svg>
          <span className="font-display text-xl font-semibold text-night">Rātana Scribe</span>
        </Link>
        <section className="rounded-panel border border-border bg-card p-6">
          <h1 className="font-display text-3xl font-semibold">{mode === "signin" ? "Sign in" : "Create your account"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? "Clinicians, practice staff and health-service users." : "Individual clinicians start free. Practices can add seats later."}
          </p>
          <Button type="button" variant="outline" className="mt-5 w-full" onClick={google}>Continue with Google</Button>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-medium">Email
              <input className={`${inputClass} mt-1`} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="block text-sm font-medium">Password
              <input className={`${inputClass} mt-1`} type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={10} required value={password} onChange={(e) => setPassword(e.target.value)} />
              {mode === "signup" && <span className="mt-1 block text-xs text-muted-foreground">At least 10 characters.</span>}
            </label>
            {error && <p role="alert" className="rounded-control border border-destructive px-3 py-2 text-sm text-destructive">{error}</p>}
            {message && <p role="status" className="rounded-control border border-border bg-muted px-3 py-2 text-sm">{message}</p>}
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Please wait" : mode === "signin" ? "Sign in" : "Create account"}</Button>
          </form>
          <p className="mt-5 text-sm text-muted-foreground">
            {mode === "signin" ? "New to Rātana Scribe? " : "Already have an account? "}
            <button type="button" className="font-medium text-primary underline-offset-4 hover:underline" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setMessage(null); }}>
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </section>
        <p className="mt-4 text-xs text-muted-foreground">Confirm your email address to start recording.</p>
      </div>
    </main>
  );
}
