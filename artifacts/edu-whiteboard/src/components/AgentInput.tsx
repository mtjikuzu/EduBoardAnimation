/**
 * AgentInput — "Ask AI Agent" input for conversational scene revision.
 *
 * Renders a text input in the workspace sidebar. When the user types an
 * edit instruction and hits send, it calls the /agent/revision endpoint
 * to update the storyboard scenes.
 */

import React, { useState, useRef } from "react";
import { Send, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { reviseStoryboard, type ReviseStoryboardResult } from "@/lib/api";

interface AgentInputProps {
  storyboardId: number;
  onRevised: (result: ReviseStoryboardResult) => void;
}

export default function AgentInput({ storyboardId, onRevised }: AgentInputProps) {
  const [edit, setEdit] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastExplanation, setLastExplanation] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!edit.trim() || loading) return;

    setLoading(true);
    setError(null);
    setLastExplanation(null);

    try {
      const result = await reviseStoryboard(storyboardId, edit.trim());
      setLastExplanation(result.explanation);
      onRevised(result);
      setEdit("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.replace(/^Error:\s*/, "")
          : "Revision failed",
      );
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="p-4 border-t border-border">
      {lastExplanation && (
        <div className="mb-2 p-2 bg-secondary/10 rounded-lg text-xs text-muted-foreground flex items-start gap-1.5">
          <Sparkles className="w-3 h-3 shrink-0 mt-0.5 text-secondary" />
          {lastExplanation}
        </div>
      )}

      {error && (
        <div className="mb-2 p-2 bg-destructive/10 rounded-lg text-xs text-destructive flex items-start gap-1.5">
          <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={edit}
          onChange={(e) => setEdit(e.target.value)}
          placeholder="Ask AI agent..."
          disabled={loading}
          className="w-full pl-4 pr-10 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-secondary transition-colors placeholder:text-muted-foreground text-foreground shadow-sm disabled:opacity-50"
          data-testid="input-ask-ai"
        />
        <button
          type="submit"
          disabled={!edit.trim() || loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-secondary hover:bg-muted rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          data-testid="button-send-ai"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}
