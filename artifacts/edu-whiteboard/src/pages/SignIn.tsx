import React, { useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useAuth } from "../components/AuthProvider";

const Logo = () => (
  <div className="flex items-center gap-2">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 5L8 11M16 13L8 19" stroke="currentColor" className="text-secondary" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <span className="font-serif text-foreground text-2xl font-bold">EduWhiteboard</span>
  </div>
);

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { signIn, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    try {
      await signIn(email.trim(), name.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    }
  };

  return (
    <div className="w-screen h-screen bg-background font-sans text-foreground flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Logo />
          <p className="text-muted-foreground mt-2 text-sm">
            Create educational whiteboard videos
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
          <h2 className="font-serif text-xl font-bold mb-6 text-card-foreground">
            Sign in
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-card-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
                autoFocus
                required
                data-testid="input-email"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-medium text-card-foreground">
                Display Name <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
                data-testid="input-name"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="mt-2 bg-primary hover:opacity-90 text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              data-testid="button-signin"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? "Signing in..." : "Continue"}
            </button>
          </form>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          By continuing, you agree to the Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
