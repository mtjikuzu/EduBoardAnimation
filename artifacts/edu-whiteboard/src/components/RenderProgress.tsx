/**
 * RenderProgress — real-time render job status via SSE.
 *
 * Connects to the backend SSE endpoint and displays a progress bar
 * with status updates. Supports both dbJobId and queueJobId.
 *
 * Usage:
 *   <RenderProgress dbJobId={42} onComplete={() => ...} />
 */

import React, { useEffect, useState, useRef } from "react";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

interface ProgressState {
  status: "connected" | "rendering" | "completed" | "failed" | "idle";
  progress: number;
  error?: string;
}

interface RenderProgressProps {
  dbJobId?: number | string;
  queueJobId?: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
  compact?: boolean;
}

function formatProgress(p: number): number {
  return Math.min(100, Math.max(0, Math.round(p)));
}

export default function RenderProgress({
  dbJobId,
  queueJobId,
  onComplete,
  onError,
  compact = false,
}: RenderProgressProps) {
  const [state, setState] = useState<ProgressState>({
    status: "idle",
    progress: 0,
  });
  const eventSourceRef = useRef<EventSource | null>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    const jobParam = dbJobId ? `dbJobId=${dbJobId}` : queueJobId ? `jobId=${queueJobId}` : null;
    if (!jobParam) return;

    const url = `/api/renderer/progress?${jobParam}`;
    completedRef.current = false;

    const es = new EventSource(url);
    eventSourceRef.current = es;
    setState({ status: "connected", progress: 0 });

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ProgressState;

        // Skip heartbeat (empty data or connected status already handled)
        if (!data.status) return;

        setState({
          status: data.status,
          progress: formatProgress(data.progress ?? 0),
          error: data.error,
        });

        if (data.status === "completed" && !completedRef.current) {
          completedRef.current = true;
          es.close();
          onComplete?.();
        }

        if (data.status === "failed" && !completedRef.current) {
          completedRef.current = true;
          es.close();
          onError?.(data.error ?? "Render failed");
        }
      } catch {
        // Ignore parse errors (e.g. heartbeat comments)
      }
    };

    es.onerror = () => {
      // EventSource auto-reconnects; only report if we were connected
      if (es.readyState === EventSource.CLOSED && !completedRef.current) {
        setState((prev) => ({
          ...prev,
          status: "failed",
          error: "Connection lost",
        }));
        onError?.("Connection to render progress lost");
      }
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [dbJobId, queueJobId, onComplete, onError]);

  if (state.status === "idle") return null;

  // Compact mode — single line
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        {state.status === "connected" && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" /> Waiting...
          </span>
        )}
        {state.status === "rendering" && (
          <span className="flex items-center gap-1 text-blue-600">
            <Loader2 className="w-3 h-3 animate-spin" /> Rendering ({state.progress}%)
          </span>
        )}
        {state.status === "completed" && (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="w-3 h-3" /> Complete
          </span>
        )}
        {state.status === "failed" && (
          <span className="flex items-center gap-1 text-red-600">
            <XCircle className="w-3 h-3" /> Failed
          </span>
        )}
      </div>
    );
  }

  // Full mode — progress bar
  return (
    <div className="bg-card rounded-lg border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-2">
          {state.status === "connected" && (
            <>
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Queued</span>
            </>
          )}
          {state.status === "rendering" && (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Rendering video...</span>
            </>
          )}
          {state.status === "completed" && (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-green-600">Complete</span>
            </>
          )}
          {state.status === "failed" && (
            <>
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-red-600">Failed</span>
            </>
          )}
        </span>
        {state.status === "rendering" && (
          <span className="text-xs text-muted-foreground">{state.progress}%</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            state.status === "failed"
              ? "bg-red-500"
              : state.status === "completed"
                ? "bg-green-500"
                : "bg-blue-500"
          }`}
          style={{ width: `${state.progress ?? 0}%` }}
        />
      </div>

      {state.error && (
        <p className="text-xs text-red-600 mt-1">{state.error}</p>
      )}
    </div>
  );
}
