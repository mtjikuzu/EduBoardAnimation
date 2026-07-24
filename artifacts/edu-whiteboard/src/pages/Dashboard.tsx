import React, { useState, useEffect } from 'react';
import { Search, Plus, Image as ImageIcon, Copy, Trash2, Download, ExternalLink, Loader2, X } from 'lucide-react';
import { 
  useGetLessons, 
  useCreateLesson, 
  useGetLessonStats, 
  useDeleteLesson, 
  getGetLessonsQueryKey, 
  getGetLessonStatsQueryKey 
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

// Logo component
const Logo = () => (
  <div className="flex items-center gap-2">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 5L8 11M16 13L8 19" stroke="currentColor" className="text-secondary" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <span className="font-serif text-foreground text-xl font-bold">EduWhiteboard</span>
  </div>
);

// Lesson Dialog Component
const NewLessonDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const createLesson = useCreateLesson();
  
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState('');
  const [language, setLanguage] = useState('English');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !grade || !language) return;
    
    createLesson.mutate(
      { data: { title, grade, language, status: 'in_progress' } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetLessonsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetLessonStatsQueryKey() });
          onClose();
          setTitle('');
          setGrade('');
          setLanguage('English');
        }
      }
    );
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-serif text-xl font-bold text-card-foreground">New Lesson</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="button-close-dialog">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="title" className="text-sm font-medium text-card-foreground">Lesson Title</label>
            <input 
              id="title"
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Photosynthesis"
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
              autoFocus
              data-testid="input-lesson-title"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label htmlFor="grade" className="text-sm font-medium text-card-foreground">Grade Level</label>
            <input 
              id="grade"
              type="text" 
              value={grade}
              onChange={e => setGrade(e.target.value)}
              placeholder="e.g. Grade 10"
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
              data-testid="input-lesson-grade"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label htmlFor="language" className="text-sm font-medium text-card-foreground">Language</label>
            <select 
              id="language"
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
              data-testid="select-lesson-language"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
            </select>
          </div>
          
          <div className="mt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-cancel-dialog"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={createLesson.isPending || !title || !grade}
              className="bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              data-testid="button-submit-lesson"
            >
              {createLesson.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Create Lesson
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Lesson Card Component
const LessonCard = ({ lesson }: { lesson: any }) => {
  const [isHovered, setIsHovered] = useState(false);
  const queryClient = useQueryClient();
  const deleteLesson = useDeleteLesson();
  
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this lesson?')) {
      deleteLesson.mutate({ id: lesson.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetLessonsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetLessonStatsQueryKey() });
        }
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#22C55E';
      case 'pending': return '#D1CBC4';
      case 'rendering': return '#F59E0B';
      case 'in_progress': 
      default: return 'var(--color-secondary)';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'pending': return 'Pending';
      case 'rendering': return 'Rendering';
      case 'in_progress': 
      default: return 'In progress';
    }
  };
  
  const getBadgeColor = (lesson: any) => {
    if (lesson.language === 'English') return 'var(--color-primary)';
    if (lesson.language) return 'var(--color-secondary)';
    return 'var(--color-secondary)';
  };

  return (
    <div 
      className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`card-lesson-${lesson.id}`}
    >
      <div className="h-32 bg-muted flex items-center justify-center relative">
        {lesson.thumbnailUrl ? (
          <img src={lesson.thumbnailUrl} alt={lesson.title} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-8 h-8 text-muted-foreground opacity-50" />
        )}
        
        {isHovered && (
          <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center gap-2 backdrop-blur-sm transition-opacity">
            <button className="p-2 bg-background rounded-full text-foreground hover:text-primary transition-colors" data-testid={`button-open-${lesson.id}`}><ExternalLink className="w-4 h-4" /></button>
            <button className="p-2 bg-background rounded-full text-foreground hover:text-primary transition-colors" data-testid={`button-duplicate-${lesson.id}`}><Copy className="w-4 h-4" /></button>
            <button className="p-2 bg-background rounded-full text-foreground hover:text-primary transition-colors" data-testid={`button-download-${lesson.id}`}><Download className="w-4 h-4" /></button>
            <button 
              onClick={handleDelete}
              disabled={deleteLesson.isPending}
              className="p-2 bg-background rounded-full text-foreground hover:text-destructive transition-colors disabled:opacity-50"
              data-testid={`button-delete-${lesson.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-serif font-bold text-lg mb-1 truncate text-card-foreground" title={lesson.title}>{lesson.title}</h3>
        <p className="text-sm text-muted-foreground mb-3">{lesson.grade}</p>
        <div className="flex items-center justify-between">
          <span 
            className="text-xs px-2.5 py-1 rounded-full text-white font-medium"
            style={{ backgroundColor: getBadgeColor(lesson) }}
          >
            {lesson.durationMinutes ? `${lesson.durationMinutes} min` : lesson.language}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getStatusColor(lesson.status) }}></span>
            {getStatusText(lesson.status)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: lessons, isLoading } = useGetLessons(
    debouncedSearch ? { search: debouncedSearch } : {}
  );
  
  const { data: stats } = useGetLessonStats();

  const hasLessons = stats && stats.total > 0;

  return (
    <div className="w-screen h-screen bg-background font-sans text-foreground flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="h-16 px-6 bg-card border-b border-border flex items-center justify-between shrink-0">
        <Logo />
        <div className="flex-1 max-w-md mx-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search Library..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-full text-sm focus:outline-none focus:border-secondary transition-colors placeholder:text-muted-foreground text-foreground"
            data-testid="input-search"
          />
        </div>
        <button 
          onClick={() => setIsDialogOpen(true)}
          className="bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          data-testid="button-new-lesson-header"
        >
          <Plus className="w-4 h-4" />
          New Lesson
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto flex gap-8 h-full">
          
          {/* Left Grid */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-8 mb-4 px-2 text-sm font-medium text-muted-foreground">
              <div className="flex-1">Video</div>
              <div className="w-24">Date</div>
              <div className="w-24">Title</div>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-3 gap-6 auto-rows-max" data-testid="container-loading">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-card border border-border rounded-xl overflow-hidden h-[240px] animate-pulse">
                    <div className="h-32 bg-muted/50"></div>
                    <div className="p-4 flex flex-col gap-3 h-[112px]">
                      <div className="h-5 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                      <div className="flex justify-between mt-auto">
                        <div className="h-5 bg-muted rounded-full w-16"></div>
                        <div className="h-4 bg-muted rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : lessons?.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-card border border-border rounded-xl border-dashed" data-testid="container-empty">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-serif text-xl font-bold text-card-foreground mb-2">No lessons found</h3>
                <p className="text-muted-foreground max-w-sm">
                  {debouncedSearch 
                    ? `We couldn't find any lessons matching "${debouncedSearch}".`
                    : "You haven't created any lessons yet."}
                </p>
                {!debouncedSearch && (
                  <button 
                    onClick={() => setIsDialogOpen(true)}
                    className="mt-6 bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
                    data-testid="button-create-first"
                  >
                    <Plus className="w-4 h-4" />
                    Create First Lesson
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-6 auto-rows-max" data-testid="container-lessons">
                {lessons?.map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} />
                ))}
              </div>
            )}
          </div>

          {/* Right Panel - Projects / Stats */}
          <div className="w-80 shrink-0">
            <h2 className="font-serif text-xl font-bold mb-4 text-foreground">Projects</h2>
            
            {hasLessons ? (
              <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-6" data-testid="panel-stats">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Lessons</h3>
                  <div className="font-serif text-4xl font-bold text-foreground">{stats?.total || 0}</div>
                </div>
                
                <div className="h-px bg-border w-full"></div>
                
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">By Status</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22C55E' }}></span>
                      <span className="text-sm text-foreground">Completed</span>
                    </div>
                    <span className="text-sm font-medium">{stats?.byStatus.completed || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-secondary)' }}></span>
                      <span className="text-sm text-foreground">In Progress</span>
                    </div>
                    <span className="text-sm font-medium">{stats?.byStatus.in_progress || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F59E0B' }}></span>
                      <span className="text-sm text-foreground">Rendering</span>
                    </div>
                    <span className="text-sm font-medium">{stats?.byStatus.rendering || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#D1CBC4' }}></span>
                      <span className="text-sm text-foreground">Pending</span>
                    </div>
                    <span className="text-sm font-medium">{stats?.byStatus.pending || 0}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setIsDialogOpen(true)}
                  className="mt-4 w-full bg-secondary hover:opacity-90 text-secondary-foreground px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
                  data-testid="button-new-lesson-stats"
                >
                  <Plus className="w-4 h-4" />
                  New Lesson
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-2xl bg-card p-8 text-center flex flex-col items-center justify-center h-[calc(100%-3rem)] min-h-[400px]" data-testid="panel-empty">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-6 opacity-80">
                  <path d="M40 80C40 80 50 90 60 90C70 90 80 80 80 80" stroke="currentColor" className="text-secondary" strokeWidth="4" strokeLinecap="round"/>
                  <path d="M60 40V90" stroke="currentColor" className="text-secondary" strokeWidth="4" strokeLinecap="round"/>
                  <path d="M30 60C30 60 45 40 60 40C75 40 90 60 90 60" stroke="currentColor" className="text-secondary" strokeWidth="4" strokeLinecap="round"/>
                  <path d="M50 30L60 20L70 30" stroke="currentColor" className="text-primary" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="60" cy="60" r="50" stroke="currentColor" className="text-border" strokeWidth="4" strokeDasharray="8 8"/>
                </svg>
                <h3 className="font-serif text-2xl font-bold text-card-foreground mb-2">Create your first lesson</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-[200px] leading-relaxed">Describe a lesson in chat, and let our AI agent generate a whiteboard video.</p>
                <button 
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-secondary hover:opacity-90 text-secondary-foreground px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors shadow-sm w-full justify-center"
                  data-testid="button-new-lesson-empty"
                >
                  <Plus className="w-5 h-5" />
                  New Lesson
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <NewLessonDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </div>
  );
}
