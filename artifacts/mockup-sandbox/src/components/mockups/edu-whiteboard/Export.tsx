import React from 'react';
import { ArrowLeft, Play, Volume2, Settings, Download, Star, RefreshCw, Edit3 } from 'lucide-react';

export default function Export() {
  return (
    <div className="w-screen h-screen bg-[#F2EDE8] font-['Inter'] text-[#2C2420] flex flex-col overflow-hidden">
      {/* Top Header */}
      <header className="h-16 px-6 bg-[#FAFAF8] border-b border-[#E5DED6] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-[#7A6F6B] hover:text-[#2C2420] transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="w-px h-5 bg-[#E5DED6]"></div>
          <span className="font-['Playfair_Display'] font-bold text-xl">Grocery Shop Economics</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-[#4A8A7E] hover:bg-[#4A8A7E]/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Cancel
          </button>
          <button className="text-[#4A8A7E] hover:bg-[#4A8A7E]/10 p-2 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          <button className="bg-[#B86A50] hover:bg-[#a05a42] text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ml-2">
            Export Video
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden p-6 gap-6 max-w-[1600px] mx-auto w-full">
        
        {/* LEFT PANEL - VIDEO PLAYER & TIMELINE */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Video Player */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-[#E5DED6] overflow-hidden flex flex-col">
            <div className="flex-1 relative flex items-center justify-center bg-[#FAFAF8]">
              {/* Video Content */}
              <div className="flex flex-col items-center">
                <h1 className="font-['Playfair_Display'] italic font-bold text-6xl text-[#2C2420] mb-4">Introduction</h1>
                {/* Flourish */}
                <svg width="200" height="20" viewBox="0 0 200 20" fill="none" stroke="#B86A50" strokeWidth="4" strokeLinecap="round">
                  <path d="M10 10 Q 50 20 100 10 T 190 10" />
                </svg>
              </div>

              {/* Fake hand with marker */}
              <div className="absolute right-[30%] bottom-[30%] transform rotate-[-15deg] opacity-90">
                <svg width="120" height="150" viewBox="0 0 120 150" fill="none" stroke="#2C2420" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
                  {/* Marker */}
                  <rect x="10" y="10" width="20" height="80" fill="#4A8A7E" rx="3" transform="rotate(45 20 50)" />
                  {/* Hand shape rough sketch */}
                  <path d="M50 80 C 70 70, 90 90, 80 120 C 70 140, 40 150, 20 130 C 10 110, 20 90, 40 85" fill="#FAFAF8" />
                  <path d="M40 85 C 50 60, 80 50, 90 80 C 100 110, 80 130, 80 120" />
                </svg>
              </div>
            </div>

            {/* Video Controls */}
            <div className="h-14 bg-white border-t border-[#E5DED6] flex items-center px-4 gap-4">
              <button className="p-2 text-[#2C2420] hover:text-[#4A8A7E] transition-colors">
                <Play className="w-5 h-5 fill-current" />
              </button>
              <div className="flex-1 h-1.5 bg-[#F2EDE8] rounded-full relative cursor-pointer group">
                <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-[#4A8A7E] rounded-full"></div>
                <div className="absolute left-1/3 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#4A8A7E] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <span className="text-xs font-medium text-[#7A6F6B]">01:24 / 04:15</span>
              <button className="p-2 text-[#7A6F6B] hover:text-[#2C2420] transition-colors">
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scene Timeline */}
          <div className="h-32 mt-6 bg-white rounded-2xl shadow-sm border border-[#E5DED6] p-6 flex flex-col justify-center relative">
            <div className="flex items-center justify-between mb-4 px-2 relative z-10">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <div key={num} className="flex flex-col items-center relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 
                    ${num === 3 || num === 4 
                      ? 'bg-[#4A8A7E] text-white border-[#4A8A7E]' 
                      : 'bg-white text-[#7A6F6B] border-[#E5DED6]'
                    }`}
                  >
                    {num}
                  </div>
                  {num === 4 && (
                    <div className="absolute -bottom-8 bg-[#4A8A7E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                      Updated
                    </div>
                  )}
                </div>
              ))}
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-white text-[#7A6F6B] border-2 border-[#E5DED6]">
                &gt;
              </div>
            </div>
            
            {/* Timeline Bar connecting nodes */}
            <div className="absolute left-10 right-10 top-[42px] h-1.5 bg-[#F2EDE8] rounded-full z-0">
              <div className="absolute left-0 w-[55%] h-full bg-[#4A8A7E] rounded-full"></div>
            </div>
          </div>

        </div>

        {/* RIGHT PANEL - SETTINGS & SCENES */}
        <div className="w-[400px] shrink-0 flex flex-col gap-6">
          
          {/* Format Selection */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E5DED6] p-1.5 flex">
            <button className="flex-1 bg-[#4A8A7E] text-white py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 shadow-sm">
              <Star className="w-4 h-4 fill-current" /> MP4
            </button>
            <button className="flex-1 text-[#7A6F6B] hover:text-[#2C2420] py-2 rounded-xl text-sm font-medium transition-colors">
              WebM
            </button>
            <button className="flex-1 text-[#7A6F6B] hover:text-[#2C2420] py-2 rounded-xl text-sm font-medium transition-colors">
              Audio only
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-[#E5DED6] p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-[#2C2420]">Download</span>
            <span className="text-sm font-bold text-[#7A6F6B] font-['Playfair_Display']">Fndicombs</span>
          </div>

          {/* Scene List */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-[#E5DED6] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#E5DED6] bg-[#FAFAF8]">
              <h3 className="font-['Playfair_Display'] font-bold text-lg">Scene List</h3>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              
              {[
                { num: 1, title: 'Introduction' },
                { num: 2, title: 'Key Points' },
                { num: 3, title: 'Conclusion' },
                { num: 4, title: 'Summary' }
              ].map((scene) => (
                <div key={scene.num} className="border border-[#E5DED6] rounded-xl p-4 hover:border-[#4A8A7E] transition-colors group">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-bold text-[#7A6F6B]">Scene {scene.num}</span>
                    <h4 className="font-['Playfair_Display'] font-bold text-[#2C2420]">{scene.title}</h4>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 border border-[#4A8A7E] text-[#4A8A7E] hover:bg-[#4A8A7E]/5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors">
                      <Edit3 className="w-3.5 h-3.5" /> Edit this scene
                    </button>
                    <button className="flex-1 bg-[#B86A50] text-white hover:bg-[#a05a42] py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                      <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                    </button>
                  </div>
                </div>
              ))}

            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
