import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Loader2, CheckCircle, Mail } from 'lucide-react';

export default function WaitlistPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/invites/join-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim(), reason: reason.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to join waitlist');
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="h-14 px-4 bg-card border-b border-border flex items-center gap-4">
        <button onClick={() => setLocation('/')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="font-serif font-bold text-lg">Join the Beta</h1>
      </header>

      <main className="max-w-lg mx-auto p-8">
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          {done ? (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="font-serif text-xl font-bold mb-2">You're on the list!</h2>
              <p className="text-sm text-muted-foreground mb-4">
                We'll notify you at <strong>{email}</strong> when your invite is ready.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Mail className="w-3 h-3" /> Expect an email within 1-2 weeks
              </div>
            </div>
          ) : (
            <>
              <h2 className="font-serif text-xl font-bold mb-2">Request an Invite</h2>
              <p className="text-sm text-muted-foreground mb-6">
                EduWhiteboard is currently in invite-only beta. Leave your email to join the waitlist.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:border-secondary"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:border-secondary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">What would you use EduWhiteboard for?</label>
                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    rows={3}
                    placeholder="e.g. Creating accounting lessons for my Grade 10 class..."
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:border-secondary resize-y"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting || !email.trim()}
                  className="bg-primary hover:opacity-90 text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Submitting...' : 'Join Waitlist'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
