import React from 'react';
import { useLocation, useParams } from 'wouter';
import { useGetLesson, getGetLessonQueryKey } from '@workspace/api-client-react';
import { ArrowLeft, ChevronDown, CheckCircle2, Circle, Send, Loader2 } from 'lucide-react';

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

  const { data: lesson, isLoading, isError } = useGetLesson(id, {
    query: {
      enabled: !!id,
      queryKey: getGetLessonQueryKey(id)
    }
  });

  const steps = [
    { id: 1, label: 'Lesson plan created', status: 'done' },
    { id: 2, label: 'Lesson plan created', status: 'done' },
    { id: 3, label: 'Generating narration', status: 'done' },
    { id: 4, label: 'Generating narration', status: 'done' },
    { id: 5, label: 'Generating narration', status: 'done' },
    { id: 6, label: 'Generating illustrations', status: 'in-progress' },
    { id: 7, label: 'Lesson plan created', status: 'pending' },
    { id: 8, label: 'Generating narration', status: 'pending' },
  ];

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
        <button className="bg-primary hover:opacity-90 text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm" data-testid="button-export">
          Export
        </button>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL - AI AGENT (28%) */}
        <div className="w-[28%] min-w-[300px] border-r border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border">
            <button className="bg-secondary hover:opacity-90 text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium w-full flex items-center justify-center gap-2 transition-opacity" data-testid="button-ai-agent">
              <Logo /> AI AGENT
            </button>
          </div>
          
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {steps.map((step) => (
              <div key={step.id} className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  {step.status === 'done' && <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />}
                  {step.status === 'in-progress' && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-secondary">
                      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2"/>
                      <path d="M10 1V10H19" stroke="currentColor" strokeWidth="2" fill="currentColor"/>
                    </svg>
                  )}
                  {step.status === 'pending' && <Circle className="w-5 h-5 text-muted-foreground" />}
                </div>
                <span className={`text-sm ${step.status === 'pending' ? 'text-muted-foreground' : 'text-foreground'} ${step.status === 'in-progress' ? 'font-medium' : ''}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-border bg-card">
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
        </div>

        {/* CENTER PANEL - CANVAS (50%) */}
        <div className="w-[50%] flex flex-col bg-background">
          <div className="flex justify-center p-4">
            <div className="flex p-1 bg-muted rounded-lg">
              <button className="px-4 py-1.5 rounded-md bg-card text-foreground text-sm font-medium shadow-sm transition-colors">Canvas</button>
              <button className="px-4 py-1.5 rounded-md text-muted-foreground text-sm font-medium hover:text-foreground transition-colors">Storyboard</button>
              <button className="px-4 py-1.5 rounded-md text-muted-foreground text-sm font-medium hover:text-foreground transition-colors">Preview</button>
            </div>
          </div>
          
          <div className="flex-1 px-8 pb-8 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Excalidraw</span>
            </div>
            <div className="flex-1 bg-card rounded-2xl shadow-sm border border-border overflow-hidden flex items-center justify-center relative p-8">
              
              {/* Hand-drawn sketch SVG */}
              <svg viewBox="0 0 400 300" className="w-full h-full max-w-lg opacity-80" style={{ strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                {/* Building base */}
                <path d="M50 250 L350 250 L340 100 L60 100 Z" fill="none" stroke="currentColor" strokeWidth="3" className="text-foreground"/>
                {/* Awning */}
                <path d="M40 100 L360 100 L380 140 L20 140 Z" fill="none" stroke="currentColor" strokeWidth="3" className="text-secondary"/>
                <path d="M60 140 L60 160 M120 140 L120 160 M180 140 L180 160 M240 140 L240 160 M300 140 L300 160 M340 140 L340 160" stroke="currentColor" strokeWidth="3" className="text-secondary"/>
                {/* Door */}
                <path d="M160 250 L160 170 L240 170 L240 250" fill="none" stroke="currentColor" strokeWidth="3" className="text-foreground"/>
                <circle cx="230" cy="210" r="3" fill="currentColor" className="text-foreground"/>
                {/* Windows */}
                <rect x="70" y="170" width="70" height="60" fill="none" stroke="currentColor" strokeWidth="3" className="text-foreground"/>
                <rect x="260" y="170" width="70" height="60" fill="none" stroke="currentColor" strokeWidth="3" className="text-foreground"/>
                {/* Window panes */}
                <path d="M105 170 L105 230 M70 200 L140 200" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-foreground"/>
                <path d="M295 170 L295 230 M260 200 L330 200" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-foreground"/>
                {/* Sign text */}
                <text x="200" y="80" textAnchor="middle" className="font-serif font-bold text-2xl fill-current text-foreground">GROCERY SHOP</text>
                <path d="M100 85 L300 85" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-foreground"/>
              </svg>
              
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - SCENE CARDS (22%) */}
        <div className="w-[22%] min-w-[240px] border-l border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="font-serif font-bold text-lg text-foreground">Scenes</h3>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-4">
            
            {/* Scene 1 */}
            <div className="border-2 border-transparent rounded-xl overflow-hidden cursor-pointer hover:border-border transition-colors group">
              <div className="bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground opacity-90 transition-opacity group-hover:opacity-100">Scene 1</div>
              <div className="h-24 bg-secondary/10 flex items-center justify-center p-4">
                <svg viewBox="0 0 100 100" className="w-full h-full opacity-50 transition-opacity group-hover:opacity-70" stroke="currentColor" strokeWidth="4" fill="none">
                  <g className="text-secondary">
                    <rect x="20" y="40" width="60" height="40" />
                    <path d="M10 40 L90 40 L50 10 Z" />
                  </g>
                </svg>
              </div>
            </div>

            {/* Scene 2 */}
            <div className="border-2 border-transparent rounded-xl overflow-hidden cursor-pointer hover:border-border transition-colors group">
              <div className="bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground opacity-90 transition-opacity group-hover:opacity-100">Scene 2</div>
              <div className="h-24 bg-secondary/10 flex items-center justify-center p-4">
                <svg viewBox="0 0 100 100" className="w-full h-full opacity-50 transition-opacity group-hover:opacity-70" stroke="currentColor" strokeWidth="4" fill="none">
                  <g className="text-secondary">
                    <circle cx="50" cy="50" r="30" />
                    <path d="M50 20 L50 80 M20 50 L80 50" />
                  </g>
                </svg>
              </div>
            </div>

            {/* Scene 3 (Active) */}
            <div className="border-2 border-primary rounded-xl overflow-hidden shadow-sm">
              <div className="bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">Scene 3</div>
              <div className="h-24 bg-primary/10 flex items-center justify-center p-4">
                <svg viewBox="0 0 100 100" className="w-full h-full opacity-60" stroke="currentColor" strokeWidth="4" fill="none">
                  <g className="text-primary">
                    <path d="M20 20 L80 80 M80 20 L20 80" />
                    <rect x="30" y="30" width="40" height="40" />
                  </g>
                </svg>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
