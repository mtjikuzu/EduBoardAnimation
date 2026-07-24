import React, { useState } from "react";
import { Clock, AlertTriangle, CheckCircle, FileText, Edit3 } from "lucide-react";
import type { Scene, SafetyFlag } from "../lib/api";
import SceneEditor from "./SceneEditor";
import { updateStoryboardScenes, reorderStoryboardScenes } from "../lib/api";

interface StoryboardViewerProps {
  storyboardId: number;
  scenes: Scene[];
  safetyFlags?: SafetyFlag[];
  modelUsed?: string;
  status: string;
  onScenesUpdated: (scenes: Scene[]) => void;
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
  storyboardId,
  scenes: initialScenes,
  safetyFlags = [],
  modelUsed,
  status,
  onScenesUpdated,
}: StoryboardViewerProps) {
  const [editingSceneId, setEditingSceneId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const totalDuration = initialScenes.reduce(
    (sum, s) => sum + s.durationSec,
    0,
  );

  const handleSceneSave = async (updatedScene: Scene) => {
    setSaving(true);
    try {
      const updatedScenes = initialScenes.map((s) =>
        s.id === updatedScene.id ? updatedScene : s,
      );
      await updateStoryboardScenes(storyboardId, updatedScenes, [updatedScene.id]);
      onScenesUpdated(updatedScenes);
      setEditingSceneId(null);
    } catch (err) {
      console.error("Failed to save scene", err);
    } finally {
      setSaving(false);
    }
  };

  const handleMoveUp = async (sceneId: number) => {
    const idx = initialScenes.findIndex((s) => s.id === sceneId);
    if (idx <= 0) return;
    const reordered = [...initialScenes];
    [reordered[idx - 1], reordered[idx]] = [reordered[idx], reordered[idx - 1]];
    const withUpdatedOrder = reordered.map((s, i) => ({ ...s, order: i + 1 }));
    try {
      await reorderStoryboardScenes(storyboardId, withUpdatedOrder.map((s) => s.id));
      onScenesUpdated(withUpdatedOrder);
    } catch (err) {
      console.error("Failed to reorder", err);
    }
  };

  const handleMoveDown = async (sceneId: number) => {
    const idx = initialScenes.findIndex((s) => s.id === sceneId);
    if (idx < 0 || idx >= initialScenes.length - 1) return;
    const reordered = [...initialScenes];
    [reordered[idx], reordered[idx + 1]] = [reordered[idx + 1], reordered[idx]];
    const withUpdatedOrder = reordered.map((s, i) => ({ ...s, order: i + 1 }));
    try {
      await reorderStoryboardScenes(storyboardId, withUpdatedOrder.map((s) => s.id));
      onScenesUpdated(withUpdatedOrder);
    } catch (err) {
      console.error("Failed to reorder", err);
    }
  };

  const editingScene = editingSceneId
    ? initialScenes.find((s) => s.id === editingSceneId)
    : null;

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

      {/* Editing indicator */}
      {editingScene && (
        <div className="text-xs text-secondary font-medium mb-1">
          Editing Scene {editingScene.order}
        </div>
      )}

      {/* Editor or Scene cards */}
      {editingScene ? (
        <SceneEditor
          scene={editingScene}
          onClose={() => setEditingSceneId(null)}
          onSave={handleSceneSave}
          totalScenes={initialScenes.length}
          onMoveUp={() => handleMoveUp(editingScene.id)}
          onMoveDown={() => handleMoveDown(editingScene.id)}
        />
      ) : (
        <div className="flex flex-col gap-3" data-testid="scene-list">
          {initialScenes.map((scene) => (
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
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {scene.durationSec}s
                  </span>
                  <button
                    onClick={() => setEditingSceneId(scene.id)}
                    className="p-1 text-muted-foreground hover:text-secondary transition-colors"
                    title="Edit scene"
                    data-testid={`edit-scene-${scene.id}`}
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
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
      )}
    </div>
  );
}
