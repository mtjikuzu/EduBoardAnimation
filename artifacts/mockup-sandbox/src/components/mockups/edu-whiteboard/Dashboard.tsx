import React, { useState } from 'react';
import { Search, Plus, Image as ImageIcon, Copy, Trash2, Download, ExternalLink } from 'lucide-react';

const Logo = () => (
  <div className="flex items-center gap-2">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 5L8 11M16 13L8 19" stroke="#4A8A7E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <span className="font-['Playfair_Display'] text-[#2C2420] text-xl font-bold">EduWhiteboard</span>
  </div>
);

export default function Dashboard() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const cards = [
    { id: 1, title: 'FIFO & AVCO', subtitle: 'Grade 10', badge: 'English', badgeColor: '#B86A50', status: 'In progress' },
    { id: 2, title: 'Photosynthesis', subtitle: 'Grade 7', badge: '5 min', badgeColor: '#4A8A7E', status: 'In progress' },
    { id: 3, title: 'Fractions', subtitle: 'Grade 4', badge: 'English', badgeColor: '#B86A50', status: 'Completed' },
    { id: 4, title: 'Water Cycle', subtitle: 'Grade 6', badge: '10 min', badgeColor: '#4A8A7E', status: 'In progress' },
    { id: 5, title: 'World War II', subtitle: 'Grade 9', badge: 'English', badgeColor: '#B86A50', status: 'Completed' },
    { id: 6, title: 'Solar System', subtitle: 'Grade 5', badge: '8 min', badgeColor: '#4A8A7E', status: 'Pending' },
  ];

  return (
    <div className="w-screen h-screen bg-[#F2EDE8] font-['Inter'] text-[#2C2420] flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="h-16 px-6 bg-[#FAFAF8] border-b border-[#E5DED6] flex items-center justify-between shrink-0">
        <Logo />
        <div className="flex-1 max-w-md mx-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6F6B]" />
          <input 
            type="text" 
            placeholder="Search Library..." 
            className="w-full pl-9 pr-4 py-2 bg-[#F2EDE8] border border-[#E5DED6] rounded-full text-sm focus:outline-none focus:border-[#4A8A7E] transition-colors placeholder:text-[#7A6F6B]"
          />
        </div>
        <button className="bg-[#B86A50] hover:bg-[#a05a42] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          New Lesson
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto flex gap-8 h-full">
          
          {/* Left Grid */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-8 mb-4 px-2 text-sm font-medium text-[#7A6F6B]">
              <div className="flex-1">Video</div>
              <div className="w-24">Date</div>
              <div className="w-24">Title</div>
            </div>
            
            <div className="grid grid-cols-3 gap-6 auto-rows-max">
              {cards.map((card) => (
                <div 
                  key={card.id}
                  className="bg-[#FAFAF8] border border-[#E5DED6] rounded-xl overflow-hidden hover:shadow-md transition-shadow group relative"
                  onMouseEnter={() => setHoveredCard(card.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Thumbnail */}
                  <div className="h-32 bg-[#E5DED6] flex items-center justify-center relative">
                    <ImageIcon className="w-8 h-8 text-[#7A6F6B] opacity-50" />
                    
                    {/* Hover Actions */}
                    {hoveredCard === card.id && (
                      <div className="absolute inset-0 bg-[#2C2420]/60 flex items-center justify-center gap-2 backdrop-blur-sm transition-opacity">
                        <button className="p-2 bg-white rounded-full text-[#2C2420] hover:text-[#B86A50] transition-colors"><ExternalLink className="w-4 h-4" /></button>
                        <button className="p-2 bg-white rounded-full text-[#2C2420] hover:text-[#B86A50] transition-colors"><Copy className="w-4 h-4" /></button>
                        <button className="p-2 bg-white rounded-full text-[#2C2420] hover:text-[#B86A50] transition-colors"><Download className="w-4 h-4" /></button>
                        <button className="p-2 bg-white rounded-full text-[#2C2420] hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                  
                  {/* Card Content */}
                  <div className="p-4">
                    <h3 className="font-['Playfair_Display'] font-bold text-lg mb-1 truncate">{card.title}</h3>
                    <p className="text-sm text-[#7A6F6B] mb-3">{card.subtitle}</p>
                    <div className="flex items-center justify-between">
                      <span 
                        className="text-xs px-2.5 py-1 rounded-full text-white font-medium"
                        style={{ backgroundColor: card.badgeColor }}
                      >
                        {card.badge}
                      </span>
                      <span className="text-xs text-[#7A6F6B] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ 
                          backgroundColor: card.status === 'Completed' ? '#22C55E' : card.status === 'Pending' ? '#D1CBC4' : '#4A8A7E' 
                        }}></span>
                        {card.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Projects */}
          <div className="w-80 shrink-0">
            <h2 className="font-['Playfair_Display'] text-xl font-bold mb-4">Projects</h2>
            <div className="border-2 border-dashed border-[#E5DED6] rounded-2xl bg-[#FAFAF8] p-8 text-center flex flex-col items-center justify-center h-[calc(100%-3rem)] min-h-[400px]">
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-6 opacity-80">
                <path d="M40 80C40 80 50 90 60 90C70 90 80 80 80 80" stroke="#4A8A7E" strokeWidth="4" strokeLinecap="round"/>
                <path d="M60 40V90" stroke="#4A8A7E" strokeWidth="4" strokeLinecap="round"/>
                <path d="M30 60C30 60 45 40 60 40C75 40 90 60 90 60" stroke="#4A8A7E" strokeWidth="4" strokeLinecap="round"/>
                <path d="M50 30L60 20L70 30" stroke="#B86A50" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="60" cy="60" r="50" stroke="#E5DED6" strokeWidth="4" strokeDasharray="8 8"/>
              </svg>
              <h3 className="font-['Playfair_Display'] text-2xl font-bold text-[#2C2420] mb-2">Create your first lesson</h3>
              <p className="text-[#7A6F6B] text-sm mb-6 max-w-[200px] leading-relaxed">Describe a lesson in chat, and let our AI agent generate a whiteboard video.</p>
              <button className="bg-[#4A8A7E] hover:bg-[#3d7268] text-white px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors shadow-sm w-full justify-center">
                <Plus className="w-5 h-5" />
                New Lesson
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
