import React, { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, Loader2, Coins } from "lucide-react";
import { approveRender, getCreditBalance } from "../lib/api";
import type { ApproveRenderResult } from "../lib/api";

interface ApproveRenderProps {
  storyboardId: number;
  sceneCount: number;
  elementCount: number;
  estimatedCost: number;
  onApproved: (result: ApproveRenderResult) => void;
  onClose: () => void;
}

export default function ApproveRenderDialog({
  storyboardId,
  sceneCount,
  elementCount,
  estimatedCost,
  onApproved,
  onClose,
}: ApproveRenderProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApproveRenderResult | null>(null);

  useEffect(() => {
    getCreditBalance()
      .then((b) => setBalance(b.available))
      .catch(() => setBalance(0));
  }, []);

  const handleApprove = async () => {
    setApproving(true);
    setError(null);
    try {
      const res = await approveRender(storyboardId);
      setResult(res);
      onApproved(res);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to approve render",
      );
    } finally {
      setApproving(false);
    }
  };

  const hasEnough = balance !== null && balance >= estimatedCost;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      data-testid="approve-render-dialog"
    >
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          {result ? (
            /* Success state */
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-serif text-lg font-bold text-card-foreground mb-2">
                Render Approved
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {result.holdDescription}
              </p>
              <div className="bg-muted rounded-lg p-3 mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Cost</span>
                  <span className="font-medium">{result.estimatedCost} credits</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available after</span>
                  <span className="font-medium">{result.availableAfterHold} credits</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            /* Approval form */
            <>
              <div className="flex items-center gap-2 mb-4">
                <Coins className="w-5 h-5 text-secondary" />
                <h3 className="font-serif text-lg font-bold text-card-foreground">
                  Approve Render
                </h3>
              </div>

              <div className="bg-muted rounded-lg p-3 mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Scenes</span>
                  <span>{sceneCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Elements</span>
                  <span>{elementCount}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between text-sm font-medium">
                  <span>Estimated cost</span>
                  <span className="text-secondary">{estimatedCost} credits</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available balance</span>
                  <span className={hasEnough ? "text-green-500" : "text-destructive"}>
                    {balance ?? "..."} credits
                  </span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={approving || !hasEnough}
                  className="bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-confirm-render"
                >
                  {approving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  {approving
                    ? "Approving..."
                    : hasEnough
                      ? `Approve (${estimatedCost} credits)`
                      : "Insufficient credits"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
