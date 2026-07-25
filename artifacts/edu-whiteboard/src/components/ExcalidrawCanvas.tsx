/**
 * Excalidraw canvas component — live editable whiteboard.
 *
 * Replaces the static SVG placeholder in the workspace. The teacher
 * can draw, edit, and erase elements directly. Scene elements from
 * the storyboard are rendered as initial Excalidraw elements.
 *
 * The canvas state can be exported to our storyboard element format
 * for rendering, and vice versa.
 */
import React, { useState, useCallback, useRef, useEffect } from "react";
import { Loader2, Maximize2, Minimize2, ChevronDown, ChevronUp } from "lucide-react";

// Dynamic import since Excalidraw is large
let ExcalidrawLib: any = null;

export interface SceneMeta {
  id?: string | number;
  order: number;
  title: string;
  narration?: string;
  durationSec?: number;
  elements: Array<{
    type: string;
    content: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
  }>;
}

interface ExcalidrawCanvasProps {
  scenes?: SceneMeta[];
  initialSceneIndex?: number;
  readOnly?: boolean;
  onSceneChange?: (sceneIndex: number, elements: ExcalidrawElement[]) => void;
  height?: string;
}

export interface ExcalidrawElement {
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  angle?: number;
  strokeColor?: string;
  backgroundColor?: string;
  fillStyle?: string;
  strokeWidth?: number;
  roughness?: number;
  opacity?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: number;
  points?: Array<[number, number]>;
}

/**
 * Convert storyboard scene elements to Excalidraw-compatible format.
 */
export function sceneElementsToExcalidraw(
  elements: Array<{ type: string; content: string; x: number; y: number; width?: number; height?: number }>,
): ExcalidrawElement[] {
  return elements.map((el) => {
    const base = {
      x: el.x,
      y: el.y,
      width: el.width ?? 200,
      height: el.height ?? 100,
      strokeColor: "#1a1a2e",
      strokeWidth: 2,
    };

    switch (el.type) {
      case "text":
        return { ...base, type: "text", text: el.content, fontSize: 28 };
      case "math":
        return { ...base, type: "text", text: el.content, fontSize: 24, fontFamily: 2 };
      case "icon":
      case "shape":
        if (el.content === "circle") return { ...base, type: "ellipse" };
        return { ...base, type: "rectangle" };
      case "table":
        return { ...base, type: "text", text: el.content.replace(/\|/g, "  "), fontSize: 16 };
      case "line":
        return { ...base, type: "line", points: [[0, 0], [el.width ?? 200, 0]] };
      default:
        return { ...base, type: "rectangle" };
    }
  });
}

/**
 * Convert Excalidraw elements back to storyboard scene elements.
 */
export function excalidrawToSceneElements(
  excElements: any[],
): Array<{ type: string; content: string; x: number; y: number; width?: number; height?: number }> {
  return excElements.map((el) => {
    const base = {
      x: Math.round(el.x ?? 0),
      y: Math.round(el.y ?? 0),
      width: Math.round(el.width ?? 100),
      height: Math.round(el.height ?? 100),
    };

    switch (el.type) {
      case "text":
        return { type: "text", content: el.text ?? "", ...base };
      case "ellipse":
        return { type: "shape", content: "circle", ...base };
      case "rectangle":
        return { type: "shape", content: "rectangle", ...base };
      case "line":
        return { type: "shape", content: "line", ...base };
      case "arrow":
        return { type: "shape", content: "arrow", ...base };
      default:
        return { type: "shape", content: el.type, ...base };
    }
  });
}

export default function ExcalidrawCanvas({
  scenes = [],
  initialSceneIndex = 0,
  readOnly = false,
  onSceneChange,
  height = "100%",
}: ExcalidrawCanvasProps) {
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [activeSceneIndex, setActiveSceneIndex] = useState(initialSceneIndex);
  const [sceneListOpen, setSceneListOpen] = useState(false);
  const [ExcalidrawComponent, setExcalidrawComponent] = useState<any>(null);
  const excRef = useRef<any>(null);

  // Clamp scene index
  const safeIndex = Math.min(activeSceneIndex, Math.max(0, scenes.length - 1));
  const activeScene = scenes[safeIndex];

  useEffect(() => {
    import("@excalidraw/excalidraw").then((mod) => {
      ExcalidrawLib = mod;
      setExcalidrawComponent(() => mod.Excalidraw);
      setLoading(false);
    });
  }, []);

  const handleSceneSelect = useCallback((idx: number) => {
    setActiveSceneIndex(idx);
    setSceneListOpen(false);
  }, []);

  const handleChange = useCallback(
    (elements: any[], _state: any) => {
      if (onSceneChange && elements.length > 0) {
        onSceneChange(safeIndex, excalidrawToSceneElements(elements));
      }
    },
    [onSceneChange, safeIndex],
  );

  if (loading) {
    return (
      <div
        className="flex items-center justify-center bg-card rounded-2xl border border-border"
        style={{ height }}
      >
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ExcalidrawComponent) return null;

  const excInitialData = {
    elements: activeScene ? sceneElementsToExcalidraw(activeScene.elements) : [],
    appState: { viewBackgroundColor: "#faf8f5" },
  };

  return (
    <div
      className={`relative bg-card rounded-2xl border border-border overflow-hidden ${
        fullscreen ? "fixed inset-0 z-50" : ""
      }`}
      style={{ height: fullscreen ? "100vh" : height }}
      data-testid="excalidraw-canvas"
    >
      {/* Scene selector bar */}
      {scenes.length > 1 && (
        <div className="absolute top-2 left-2 z-10">
          <button
            onClick={() => setSceneListOpen(!sceneListOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 rounded-md shadow-sm text-xs font-medium hover:bg-white transition-colors"
          >
            Scene {safeIndex + 1}: {activeScene?.title?.slice(0, 24) ?? "Untitled"}
            {sceneListOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {sceneListOpen && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-border max-h-48 overflow-y-auto">
              {scenes.map((scene, idx) => (
                <button
                  key={scene.id ?? idx}
                  onClick={() => handleSceneSelect(idx)}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors ${
                    idx === safeIndex ? "bg-muted font-medium" : ""
                  }`}
                >
                  <span className="text-muted-foreground">Scene {scene.order}: </span>
                  {scene.title?.slice(0, 28)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fullscreen toggle */}
      <button
        onClick={() => setFullscreen(!fullscreen)}
        className="absolute top-2 right-2 z-10 p-1.5 bg-white/80 rounded-md shadow-sm hover:bg-white transition-colors"
        data-testid="toggle-fullscreen"
      >
        {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>

      {/* Scene narration tooltip */}
      {activeScene?.narration && (
        <div className="absolute bottom-2 left-2 right-2 z-10 px-3 py-1.5 bg-white/90 rounded-md shadow-sm text-xs text-muted-foreground truncate">
          🎙️ {activeScene.narration.slice(0, 120)}{activeScene.narration.length > 120 ? "..." : ""}
        </div>
      )}

      <ExcalidrawComponent
        ref={excRef}
        initialData={excInitialData}
        onChange={handleChange}
        viewModeEnabled={readOnly}
        zenModeEnabled={false}
        gridModeEnabled={false}
        theme="light"
      />
    </div>
  );
}
