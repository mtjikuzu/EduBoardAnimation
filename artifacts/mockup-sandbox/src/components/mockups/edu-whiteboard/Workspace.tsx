import React from 'react';
import { ArrowLeft, ChevronDown, CheckCircle2, Circle, Send, Search } from 'lucide-react';

const Logo = () => (
  <div className="flex items-center gap-2">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 5L8 11M16 13L8 19" stroke="#4A8A7E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);

export default function Workspace() {
  const steps = [
    { id: 1, label: 'Lesson plan created', status: 'done' },
    { id: 2, label: 'Lesson plan created', status: 'done' },
    { id: 3, label: 'Generating narration', status: 'done' },
    { id: 4, label: 'Generating narration', status: 'done' },
    { id: 5, label: 'Generating narration', status: 'done' },
    { id: 6, label: 'Lesson plan cressa', status: 'in-progress' },
    { id: 7, label: 'Lesson plan created', status: 'pending' },
    { id: 8, label: 'Generating narration', status: 'pending' },
  ];

  return (
    <div className="w-screen h-screen bg-[#F2EDE8] font-['Inter'] text-[#2C2420] flex flex-col overflow-hidden">
      {/* Top Header */}
      <header className="h-14 px-4 bg-[#FAFAF8] border-b border-[#E5DED6] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-[#7A6F6B] hover:text-[#2C2420] transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <div className="w-px h-4 bg-[#E5DED6]"></div>
          <div className="flex items-center gap-3">
            <span className="font-['Playfair_Display'] font-bold text-lg uppercase tracking-wide">GROCERY SHOP</span>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#E5DED6] text-[#7A6F6B]">Grade: 3</span>
            <button className="flex items-center gap-1 text-sm text-[#7A6F6B] hover:text-[#2C2420]">
              English <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>
        <button className="bg-[#B86A50] hover:bg-[#a05a42] text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm">
          Export
        </button>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL - AI AGENT (28%) */}
        <div className="w-[28%] min-w-[300px] border-r border-[#E5DED6] bg-[#FAFAF8] flex flex-col">
          <div className="p-4 border-b border-[#E5DED6]">
            <button className="bg-[#4A8A7E] text-white px-4 py-2 rounded-lg text-sm font-medium w-full flex items-center justify-center gap-2">
              <Logo /> AI AGENT
            </button>
          </div>
          
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {steps.map((step) => (
              <div key={step.id} className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  {step.status === 'done' && <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />}
                  {step.status === 'in-progress' && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[#4A8A7E]">
                      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2"/>
                      <path d="M10 1V10H19" stroke="currentColor" strokeWidth="2" fill="currentColor"/>
                    </svg>
                  )}
                  {step.status === 'pending' && <Circle className="w-5 h-5 text-[#D1CBC4]" />}
                </div>
                <span className={`text-sm ${step.status === 'pending' ? 'text-[#7A6F6B]' : 'text-[#2C2420]'} ${step.status === 'in-progress' ? 'font-medium' : ''}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-[#E5DED6] bg-[#FAFAF8]">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Ask AI agent..." 
                className="w-full pl-4 pr-10 py-3 bg-white border border-[#E5DED6] rounded-xl text-sm focus:outline-none focus:border-[#4A8A7E] transition-colors placeholder:text-[#7A6F6B] shadow-sm"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#4A8A7E] hover:bg-[#F2EDE8] rounded-lg transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* CENTER PANEL - CANVAS (50%) */}
        <div className="w-[50%] flex flex-col bg-[#F2EDE8]">
          <div className="flex justify-center p-4">
            <div className="flex p-1 bg-[#E5DED6] rounded-lg">
              <button className="px-4 py-1.5 rounded-md bg-white text-[#2C2420] text-sm font-medium shadow-sm">Canvas</button>
              <button className="px-4 py-1.5 rounded-md text-[#7A6F6B] text-sm font-medium hover:text-[#2C2420]">Storyboard</button>
              <button className="px-4 py-1.5 rounded-md text-[#7A6F6B] text-sm font-medium hover:text-[#2C2420]">Preview</button>
            </div>
          </div>
          
          <div className="flex-1 px-8 pb-8 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#7A6F6B] uppercase tracking-wider">Excalidraw</span>
            </div>
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-[#E5DED6] overflow-hidden flex items-center justify-center relative p-8">
              
              {/* Hand-drawn sketch SVG */}
              <svg viewBox="0 0 400 300" className="w-full h-full max-w-lg opacity-80" style={{ strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                {/* Building base */}
                <path d="M50 250 L350 250 L340 100 L60 100 Z" fill="none" stroke="#2C2420" strokeWidth="3" className="path-rough"/>
                {/* Awning */}
                <path d="M40 100 L360 100 L380 140 L20 140 Z" fill="none" stroke="#4A8A7E" strokeWidth="3"/>
                <path d="M60 140 L60 160 M120 140 L120 160 M180 140 L180 160 M240 140 L240 160 M300 140 L300 160 M340 140 L340 160" stroke="#4A8A7E" strokeWidth="3"/>
                {/* Door */}
                <path d="M160 250 L160 170 L240 170 L240 250" fill="none" stroke="#2C2420" strokeWidth="3"/>
                <circle cx="230" cy="210" r="3" fill="#2C2420"/>
                {/* Windows */}
                <rect x="70" y="170" width="70" height="60" fill="none" stroke="#2C2420" strokeWidth="3"/>
                <rect x="260" y="170" width="70" height="60" fill="none" stroke="#2C2420" strokeWidth="3"/>
                {/* Window panes */}
                <path d="M105 170 L105 230 M70 200 L140 200" stroke="#2C2420" strokeWidth="2" strokeDasharray="4 4"/>
                <path d="M295 170 L295 230 M260 200 L330 200" stroke="#2C2420" strokeWidth="2" strokeDasharray="4 4"/>
                {/* Sign text */}
                <text x="200" y="80" textAnchor="middle" className="font-['Playfair_Display'] font-bold text-2xl" fill="#2C2420">GROCERY SHOP</text>
                <path d="M100 85 L300 85" stroke="#2C2420" strokeWidth="2" strokeDasharray="4 4"/>
              </svg>
              
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - SCENE CARDS (22%) */}
        <div className="w-[22%] min-w-[240px] border-l border-[#E5DED6] bg-[#FAFAF8] flex flex-col">
          <div className="p-4 border-b border-[#E5DED6]">
            <h3 className="font-['Playfair_Display'] font-bold text-lg">Scenes</h3>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-4">
            
            {/* Scene 1 */}
            <div className="border-2 border-transparent rounded-xl overflow-hidden cursor-pointer hover:border-[#E5DED6] transition-colors">
              <div className="bg-[#4A8A7E] px-3 py-1.5 text-xs font-medium text-white/90">Scene 1</div>
              <div className="h-24 bg-[#4A8A7E]/10 flex items-center justify-center p-4">
                <svg viewBox="0 0 100 100" className="w-full h-full opacity-50" stroke="#4A8A7E" strokeWidth="4" fill="none">
                  <rect x="20" y="40" width="60" height="40" />
                  <path d="M10 40 L90 40 L50 10 Z" />
                </svg>
              </div>
            </div>

            {/* Scene 2 */}
            <div className="border-2 border-transparent rounded-xl overflow-hidden cursor-pointer hover:border-[#E5DED6] transition-colors">
              <div className="bg-[#4A8A7E] px-3 py-1.5 text-xs font-medium text-white/90">Scene 2</div>
              <div className="h-24 bg-[#4A8A7E]/10 flex items-center justify-center p-4">
                <svg viewBox="0 0 100 100" className="w-full h-full opacity-50" stroke="#4A8A7E" strokeWidth="4" fill="none">
                  <circle cx="50" cy="50" r="30" />
                  <path d="M50 20 L50 80 M20 50 L80 50" />
                </svg>
              </div>
            </div>

            {/* Scene 3 (Active) */}
            <div className="border-2 border-[#B86A50] rounded-xl overflow-hidden shadow-sm">
              <div className="bg-[#B86A50] px-3 py-1.5 text-xs font-medium text-white">Scene 3</div>
              <div className="h-24 bg-[#B86A50]/10 flex items-center justify-center p-4">
                <svg viewBox="0 0 100 100" className="w-full h-full opacity-60" stroke="#B86A50" strokeWidth="4" fill="none">
                  <path d="M20 20 L80 80 M80 20 L20 80" />
                  <rect x="30" y="30" width="40" height="40" />
                </svg>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
