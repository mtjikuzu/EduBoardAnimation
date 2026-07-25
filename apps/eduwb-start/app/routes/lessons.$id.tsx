import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getLesson, listStoryboards, generateStoryboard } from '../lib/server-fns'
import { getCreatorId } from '../lib/auth'
import { useState } from 'react'

export const Route = createFileRoute('/lessons/$id')({
  component: LessonWorkspace,
})

function LessonWorkspace() {
  const { id } = useParams({ from: '/lessons/$id' })
  const navigate = useNavigate()
  const creatorId = getCreatorId()
  const lessonId = Number(id)
  const [brief, setBrief] = useState('')
  const [generating, setGenerating] = useState(false)

  const { data: lesson } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => getLesson({ data: { id: lessonId, creatorId: creatorId! } }),
    enabled: !!creatorId,
  })

  const { data: boards, refetch } = useQuery({
    queryKey: ['storyboards', lessonId],
    queryFn: () => listStoryboards({ data: { lessonId, creatorId: creatorId! } }),
    enabled: !!creatorId,
  })

  const latestBoard = boards?.[0]
  const rawScenes = latestBoard?.scenes
  const scenes = rawScenes && typeof rawScenes === 'object' && !Array.isArray(rawScenes)
    ? (rawScenes as any).scenes ?? []
    : Array.isArray(rawScenes) ? rawScenes : []

  const handleGenerate = async () => {
    if (!creatorId || !brief.trim()) return
    setGenerating(true)
    try {
      await generateStoryboard({ data: { creatorId, lessonId, brief: brief.trim() } })
      refetch()
      setBrief('')
    } finally { setGenerating(false) }
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <header className="h-14 bg-white border-b flex items-center justify-between px-4">
        <button onClick={() => navigate({ to: '/' })} className="text-sm text-gray-500">&larr; Dashboard</button>
        <h1 className="font-serif font-bold text-lg">{lesson?.title ?? 'Loading...'}</h1>
        <button onClick={() => navigate({ to: `/lessons/${id}/export` })} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium">Export</button>
      </header>
      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-white border rounded-xl p-6 mb-6">
          <h2 className="font-medium mb-2">Lesson Brief</h2>
          <textarea value={brief} onChange={e => setBrief(e.target.value)} placeholder="Describe the lesson..." rows={4} className="w-full px-3 py-2 border rounded-md text-sm mb-3 resize-y" />
          <button onClick={handleGenerate} disabled={generating || !brief.trim()} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
            {generating ? 'Generating...' : 'Generate Storyboard'}
          </button>
        </div>
        {scenes.length > 0 && (
          <div>
            <h2 className="font-medium mb-3">Storyboard ({scenes.length} scenes)</h2>
            <div className="space-y-3">
              {scenes.map((scene: any, i: number) => (
                <div key={i} className="bg-white border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-400">Scene {scene.order ?? i + 1}</span>
                    <span className="text-xs text-gray-400">{scene.durationSec ?? 60}s</span>
                  </div>
                  <h3 className="font-medium text-sm mb-1">{scene.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{scene.narration}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {scene.elements?.map((el: any, j: number) => (
                      <span key={j} className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-500">{el.type}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
