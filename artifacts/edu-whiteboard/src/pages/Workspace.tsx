import React, { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useGetLesson, getGetLessonQueryKey } from '@workspace/api-client-react';
import { ArrowLeft, ChevronDown, CheckCircle2, Circle, Send, Loader2, ChevronUp, Plus, FileText } from 'lucide-react';
import BriefInput from '@/components/BriefInput';
import StoryboardViewer from '@/components/StoryboardViewer';
import { generateStoryboard, getStoryboardsByLesson } from '@/lib/api';
import type { StoryboardResult, Scene, SafetyFlag } from '@/lib/api';

const Logo = () => (
  <div className="flex items-center gap-2">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 5L8 11M16 13L8 19" stroke="currentColor" className="text-secondary-foreground" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);

export default function Workspace() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const id = parseInt(params.id || '0', 10);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [storyboard, setStoryboard] = useState<StoryboardResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: lesson, isLoading, isError } = useGetLesson(id, {
    query: {
      enabled: !!id,
      queryKey: getGetLessonQueryKey(id)
    }
  });

  const handleGenerate = async (brief: string) => {
    setError(null);
    setIsGenerating(true);
    try {
      const result = await generateStoryboard(id, brief);
      setStoryboard(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate storyboard');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isError || (!isLoading && !lesson)) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <h2 className="font-serif text-2xl font-bold mb-4">Lesson not found</h2>
        <button 
          onClick={() => setLocation('/')}
          className="text-primary hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  const scenes = storyboard?.scenes ?? [];

  return (
    <div className="w-screen h-screen bg-background font-sans text-foreground flex flex-col overflow-hidden">
      {/* Top Header */}
      <header className="h-14 px-4 bg-card border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            data-testid="link-dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <div className="w-px h-4 bg-border"></div>
          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="h-6 w-48 bg-muted animate-pulse rounded"></div>
            ) : (
              <>
                <span className="font-serif font-bold text-lg uppercase tracking-wide text-foreground" data-testid="text-lesson-title">
                  {lesson?.title}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground" data-testid="badge-lesson-grade">
                  Grade: {lesson?.grade}
                </span>
                <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" data-testid="select-lesson-language">
                  {lesson?.language} <ChevronDown className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </div>
        {scenes.length > 0 && (
          <button 
            onClick={() => setLocation(`/lessons/${id}/export`)}
            className="bg-primary hover:opacity-90 text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm" 
            data-testid="button-export"
          >
            Export
          </button>
        )}
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL - Brief / Storyboard */}
        <div className="w-[35%] min-w-[320px] border-r border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="font-serif text-lg font-bold text-foreground">
              {storyboard ? 'Storyboard' : 'Lesson Brief'}
            </h2>
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                {error}
              </div>
            )}

            {!storyboard ? (
              <BriefInput
                lessonId={id}
                lessonTitle={lesson?.title ?? 'Untitled'}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />
            ) : (
              <StoryboardViewer
                scenes={scenes}
                safetyFlags={(storyboard as StoryboardResult).safetyFlags}
                modelUsed={(storyboard as StoryboardResult).modelUsed}
                status={(storyboard as StoryboardResult).status}
              />
            )}
          </div>

          {storyboard && (
            <div className="p-4 border-t border-border">
              <button
                onClick={() => setStoryboard(null)}
                className="w-full bg-secondary hover:opacity-90 text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-opacity"
                data-testid="button-new-brief"
              >
                <Plus className="w-4 h-4" />
                New Brief
              </button>
            </div>
          )}
        </div>

        {/* CENTER PANEL - Canvas Preview */}
        <div className="flex-1 flex flex-col bg-background">
          <div className="flex justify-center p-4">
            <div className="flex p-1 bg-muted rounded-lg">
              <button
                className={`px-4 py-1.5 rounded-md text-sm font-medium shadow-sm transition-colors ${
                  isDrawing ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setIsDrawing(true)}
              >
                Canvas
              </button>
              <button
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  !isDrawing ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setIsDrawing(false)}
              >
                Preview
              </button>
            </div>
          </div>
          
          <div className="flex-1 px-8 pb-8 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {isDrawing ? 'Excalidraw' : 'Scene Preview'}
              </span>
            </div>
            {scenes.length > 0 && !isDrawing ? (
              <div className="flex-1 bg-card rounded-2xl shadow-sm border border-border overflow-auto p-6">
                <div className="space-y-4">
                  {scenes.map((scene) => (
                    <div key={scene.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Scene {scene.order}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {scene.durationSec}s
                        </span>
                      </div>
                      <p className="text-sm text-foreground font-medium mb-1">{scene.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-3">{scene.narration}</p>
                      {scene.elements.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {scene.elements.map((el, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground">
                              {el.type}: {el.content.slice(0, 30)}{el.content.length > 30 ? '...' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 bg-card rounded-2xl shadow-sm border border-border overflow-hidden flex items-center justify-center relative p-8">
                <svg viewBox="0 0 400 300" className="w-full h-full max-w-lg opacity-40" style={{ strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                  <path d="M50 250 L350 250 L340 100 L60 100 Z" fill="none" stroke="currentColor" strokeWidth="3" className="text-foreground"/>
                  <path d="M40 100 L360 100 L380 140 L20 140 Z" fill="none" stroke="currentColor" strokeWidth="3" className="text-secondary"/>
                  <path d="M60 140 L60 160 M120 140 L120 160 M180 140 L180 160 M240 140 L240 160 M300 140 L300 160 M340 140 L340 160" stroke="currentColor" strokeWidth="3" className="text-secondary"/>
                  <path d="M160 250 L160 170 L240 170 L240 250" fill="none" stroke="currentColor" strokeWidth="3" className="text-foreground"/>
                  <circle cx="230" cy="210" r="3" fill="currentColor" className="text-foreground"/>
                  <rect x="70" y="170" width="70" height="60" fill="none" stroke="currentColor" strokeWidth="3" className="text-foreground"/>
                  <rect x="260" y="170" width="70" height="60" fill="none" stroke="currentColor" strokeWidth="3" className="text-foreground"/>
                  <path d="M105 170 L105 230 M70 200 L140 200" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-foreground"/>
                  <path d="M295 170 L295 230 M260 200 L330 200" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-foreground"/>
                  <text x="200" y="80" textAnchor="middle" className="font-serif font-bold text-2xl fill-current text-foreground">SCENE PREVIEW</text>
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL - Scene timeline / agent controls */}
        <div className="w-[22%] min-w-[220px] border-l border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="font-serif font-bold text-lg text-foreground">Scenes</h3>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {scenes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Generate a storyboard to see scenes here</p>
              </div>
            ) : (
              scenes.map((scene) => (
                <div
                  key={scene.id}
                  className="border-2 border-transparent rounded-xl overflow-hidden hover:border-border transition-colors group"
                  data-testid={`sidebar-scene-${scene.id}`}
                >
                  <div className="bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
                    Scene {scene.order}
                  </div>
                  <div className="h-20 bg-secondary/5 flex items-center justify-center p-3">
                    <div className="text-xs text-muted-foreground text-center">
                      <p className="font-medium text-foreground truncate">{scene.title}</p>
                      <p className="mt-1">{scene.durationSec}s</p>
                      <p className="text-[10px] mt-0.5">{scene.elements.length} elements</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {scenes.length > 0 && (
            <div className="p-4 border-t border-border">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Ask AI agent..." 
                  className="w-full pl-4 pr-10 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-secondary transition-colors placeholder:text-muted-foreground text-foreground shadow-sm"
                  data-testid="input-ask-ai"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-secondary hover:bg-muted rounded-lg transition-colors" data-testid="button-send-ai">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
