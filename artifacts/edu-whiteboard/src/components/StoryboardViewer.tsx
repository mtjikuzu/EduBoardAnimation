import React from "react";
import { Clock, AlertTriangle, CheckCircle, FileText } from "lucide-react";
import type { Scene, SafetyFlag } from "../lib/api";

interface StoryboardViewerProps {
  scenes: Scene[];
  safetyFlags?: SafetyFlag[];
  modelUsed?: string;
  status: string;
}

function SafetyBadge({ flag }: { flag: SafetyFlag }) {
  const colors = {
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    warning:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    block: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors[flag.severity]}`}
    >
      <AlertTriangle className="w-3 h-3" />
      {flag.message}
    </span>
  );
}

export default function StoryboardViewer({
  scenes,
  safetyFlags = [],
  modelUsed,
  status,
}: StoryboardViewerProps) {
  const totalDuration = scenes.reduce(
    (sum, s) => sum + s.durationSec,
    0,
  );

  return (
    <div className="flex flex-col gap-4" data-testid="storyboard-viewer">
      {/* Status header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status === "validated" ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <FileText className="w-5 h-5 text-muted-foreground" />
          )}
          <span className="text-sm font-medium text-foreground capitalize">
            {status}
          </span>
          <span className="text-xs text-muted-foreground">
            ~{Math.round(totalDuration / 60)} min
          </span>
        </div>
        {modelUsed && (
          <span className="text-xs text-muted-foreground">{modelUsed}</span>
        )}
      </div>

      {/* Safety flags */}
      {safetyFlags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {safetyFlags.map((flag, i) => (
            <SafetyBadge key={i} flag={flag} />
          ))}
        </div>
      )}

      {/* Scene cards */}
      <div className="flex flex-col gap-3" data-testid="scene-list">
        {scenes.map((scene) => (
          <div
            key={scene.id}
            className="bg-card border border-border rounded-lg p-4"
            data-testid={`scene-${scene.id}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-secondary-foreground text-xs font-bold">
                  {scene.order}
                </span>
                <h4 className="font-medium text-sm text-card-foreground">
                  {scene.title}
                </h4>
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {scene.durationSec}s
              </span>
            </div>

            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {scene.narration}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {scene.elements.map((el, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground"
                >
                  {el.type}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
