import React from 'react';
import { ArrowLeft, ChevronDown, CheckCircle2, Circle, ChevronUp } from 'lucide-react';

const Logo = () => (
  <div className="flex items-center gap-2">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 5L8 11M16 13L8 19" stroke="#4A8A7E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);

export default function WorkspaceDrawing() {
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
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden p-6 gap-6 max-w-[1400px] mx-auto w-full">
        
        <div className="flex flex-1 gap-6 overflow-hidden">
          {/* LEFT CHAT PANEL */}
          <div className="w-80 shrink-0 flex flex-col">
            <div className="flex-1 overflow-auto pr-2 relative">
              {/* Vertical line connecting steps */}
              <div className="absolute left-[21px] top-6 bottom-12 w-0.5 border-l-2 border-dashed border-[#E5DED6] z-0"></div>

              <div className="space-y-4 relative z-10">
                {/* Completed steps */}
                {[
                  { id: 1, label: 'Progress', badge: 'Pomt' },
                  { id: 2, label: 'Aide', badge: 'Pomt' },
                  { id: 3, label: 'Progress', badge: 'Pomt' }
                ].map((step) => (
                  <div key={step.id} className="bg-white border border-[#E5DED6] rounded-xl p-3 flex items-center gap-3 shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-[#22C55E] shrink-0 bg-white" />
                    <span className="text-sm font-medium text-[#2C2420] flex-1">{step.label}</span>
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-[#F2EDE8] text-[#7A6F6B] px-2 py-0.5 rounded-full">{step.badge}</span>
                  </div>
                ))}

                {/* Active Step */}
                <div className="bg-[#2C2420] border-none rounded-xl p-4 flex flex-col gap-2 shadow-lg transform scale-[1.02] transition-transform">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 shrink-0 relative flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[#4A8A7E] absolute inset-0 animate-pulse">
                        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2"/>
                        <path d="M10 1V10H19" stroke="currentColor" strokeWidth="2" fill="currentColor"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-white flex-1">Generating illustrations</span>
                    <span className="text-xs font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">[1]</span>
                  </div>
                  <div className="pl-8 text-xs text-[#4A8A7E] font-medium uppercase tracking-widest">
                    4/8
                  </div>
                </div>

                {/* Pending steps */}
                <div className="bg-white border border-[#E5DED6] rounded-xl p-3 flex items-center gap-3 shadow-sm opacity-60">
                  <Circle className="w-5 h-5 text-[#D1CBC4] shrink-0 bg-white" />
                  <span className="text-sm font-medium text-[#7A6F6B] flex-1">Future</span>
                  <ChevronUp className="w-4 h-4 text-[#7A6F6B]" />
                </div>
                
                <div className="bg-white border border-[#E5DED6] rounded-xl p-3 flex items-center gap-3 shadow-sm opacity-40">
                  <Circle className="w-5 h-5 text-[#D1CBC4] shrink-0 bg-white" />
                  <span className="text-sm font-medium text-[#7A6F6B] flex-1">Future</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT CANVAS PANEL */}
          <div className="flex-1 flex flex-col">
            <div className="text-xs font-medium text-[#7A6F6B] uppercase tracking-wider mb-2 ml-2">Excalidraw</div>
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-[#E5DED6] relative overflow-hidden flex items-center justify-center">
              
              {/* Decorative rough shapes scattered */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" stroke="#7A6F6B" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                {/* Top left cluster */}
                <path d="M50 50 L80 50 L50 80 L80 80" />
                <path d="M120 40 L150 70 M150 40 L120 70" />
                <rect x="200" y="40" width="30" height="30" />
                
                {/* Right cluster */}
                <path d="M700 80 L750 80 M740 70 L750 80 L740 90" />
                <circle cx="650" cy="100" r="20" />
                <path d="M800 150 C 820 120, 850 180, 880 150" />

                {/* Bottom cluster */}
                <path d="M100 400 L100 350 L150 350" />
                <path d="M200 400 C 200 370, 240 370, 240 400 C 240 430, 200 430, 200 400" />
                <path d="M600 380 L550 380 M560 370 L550 380 L560 390" />
                <rect x="750" y="380" width="40" height="40" rx="10" />
              </svg>

              <h2 className="font-['Playfair_Display'] italic text-4xl text-[#7A6F6B]/50 z-10 animate-pulse">
                Agent is drawing...
              </h2>
            </div>
          </div>
        </div>

        {/* BOTTOM TIMELINE */}
        <div className="h-16 bg-white border border-[#E5DED6] rounded-2xl flex items-center px-8 shadow-sm">
          <div className="flex-1 relative flex items-center">
            {/* Base line */}
            <div className="absolute left-0 right-0 h-1 bg-[#F2EDE8] rounded-full"></div>
            {/* Progress line */}
            <div className="absolute left-0 w-[42%] h-1 bg-[#4A8A7E] rounded-full"></div>
            
            {/* Dots */}
            <div className="w-full flex justify-between relative z-10">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((dot) => (
                <div key={dot} className="flex flex-col items-center gap-2 transform translate-y-[2px]">
                  <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                    dot < 4 ? 'bg-[#4A8A7E]' : 
                    dot === 4 ? 'bg-[#4A8A7E] w-4 h-4 transform -translate-y-0.5' : 
                    'bg-[#D1CBC4]'
                  }`}></div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
