import React, { useState, useEffect } from "react";
import { Save, X, ChevronUp, ChevronDown, GripVertical, Plus, Trash2 } from "lucide-react";
import type { Scene, SceneElement } from "../lib/api";

interface SceneEditorProps {
  scene: Scene;
  onSave: (updatedScene: Scene) => void;
  onClose: () => void;
  totalScenes: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

function ElementEditor({
  element,
  index,
  onChange,
  onRemove,
}: {
  element: SceneElement;
  index: number;
  onChange: (el: SceneElement) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-start gap-2 bg-muted rounded p-2" data-testid={`element-${index}`}>
      <select
        value={element.type}
        onChange={(e) => onChange({ ...element, type: e.target.value })}
        className="px-2 py-1 bg-background border border-border rounded text-xs focus:outline-none"
      >
        {["text", "icon", "math", "table", "shape", "handPointer"].map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <input
        type="text"
        value={element.content}
        onChange={(e) => onChange({ ...element, content: e.target.value })}
        className="flex-1 px-2 py-1 bg-background border border-border rounded text-xs focus:outline-none"
        placeholder="Content..."
        data-testid={`element-content-${index}`}
      />
      <button
        onClick={onRemove}
        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
        data-testid={`element-remove-${index}`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function SceneEditor({
  scene,
  onSave,
  onClose,
  totalScenes,
  onMoveUp,
  onMoveDown,
}: SceneEditorProps) {
  const [title, setTitle] = useState(scene.title);
  const [narration, setNarration] = useState(scene.narration);
  const [durationSec, setDurationSec] = useState(scene.durationSec);
  const [elements, setElements] = useState<SceneElement[]>(scene.elements);

  // Reset when scene changes
  useEffect(() => {
    setTitle(scene.title);
    setNarration(scene.narration);
    setDurationSec(scene.durationSec);
    setElements(scene.elements);
  }, [scene]);

  const handleElementChange = (index: number, el: SceneElement) => {
    const next = [...elements];
    next[index] = el;
    setElements(next);
  };

  const handleRemoveElement = (index: number) => {
    setElements(elements.filter((_, i) => i !== index));
  };

  const handleAddElement = () => {
    setElements([
      ...elements,
      { type: "text", content: "" },
    ]);
  };

  const handleSave = () => {
    onSave({
      ...scene,
      title,
      narration,
      durationSec,
      elements,
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm" data-testid="scene-editor">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm text-card-foreground">
            Scene {scene.order}
          </h3>
          <div className="flex gap-1">
            {onMoveUp && totalScenes > 1 && (
              <button
                onClick={onMoveUp}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                data-testid="scene-move-up"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
            )}
            {onMoveDown && totalScenes > 1 && (
              <button
                onClick={onMoveDown}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                data-testid="scene-move-down"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="bg-primary hover:opacity-90 text-primary-foreground px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors"
            data-testid="scene-save"
          >
            <Save className="w-3 h-3" />
            Save
          </button>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            data-testid="scene-close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {/* Title */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm focus:outline-none focus:border-secondary"
            data-testid="scene-title-input"
          />
        </div>

        {/* Duration */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Duration (seconds)</label>
          <input
            type="number"
            value={durationSec}
            onChange={(e) => setDurationSec(Number(e.target.value))}
            min={10}
            max={600}
            className="w-24 px-2 py-1.5 bg-background border border-border rounded text-sm focus:outline-none focus:border-secondary"
            data-testid="scene-duration-input"
          />
        </div>

        {/* Narration */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Narration</label>
          <textarea
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            rows={4}
            className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm focus:outline-none focus:border-secondary resize-y"
            data-testid="scene-narration-input"
          />
        </div>

        {/* Elements */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Elements</label>
            <button
              onClick={handleAddElement}
              className="text-xs text-secondary hover:underline flex items-center gap-1"
              data-testid="element-add"
            >
              <Plus className="w-3 h-3" />
              Add element
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {elements.map((el, i) => (
              <ElementEditor
                key={i}
                element={el}
                index={i}
                onChange={(updated) => handleElementChange(i, updated)}
                onRemove={() => handleRemoveElement(i)}
              />
            ))}
            {elements.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No elements yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
