import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router'
import { triggerExport, getLesson } from '../lib/server-fns'
import { getCreatorId } from '../lib/auth'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

export const Route = createFileRoute('/lessons/$id/export')({
  component: LessonExport,
})

function LessonExport() {
  const { id } = useParams({ from: '/lessons/$id/export' })
  const navigate = useNavigate()
  const creatorId = getCreatorId()
  const lessonId = Number(id)
  const [exporting, setExporting] = useState(false)
  const [jobId, setJobId] = useState<number | null>(null)

  const { data: lesson } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => getLesson({ data: { id: lessonId, creatorId: creatorId! } }),
    enabled: !!creatorId,
  })

  const handleExport = async () => {
    setExporting(true)
    try {
      const result = await triggerExport({ data: { creatorId: creatorId!, storyboardId: lessonId } })
      setJobId(result.jobId)
    } finally { setExporting(false) }
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <header className="h-14 bg-white border-b flex items-center justify-between px-4">
        <button onClick={() => navigate({ to: `/lessons/${id}` })} className="text-sm text-gray-500">&larr; Back</button>
        <h1 className="font-serif font-bold">Export</h1>
        <div />
      </header>
      <main className="max-w-lg mx-auto p-6">
        <div className="bg-white border rounded-xl p-6">
          <h2 className="font-medium mb-2">Render Video</h2>
          <p className="text-sm text-gray-500 mb-4">Generate the final MP4 for &ldquo;{lesson?.title ?? 'Untitled'}&rdquo;</p>
          <button onClick={handleExport} disabled={exporting} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
            {exporting ? 'Rendering...' : 'Render Video'}
          </button>
          {jobId && <p className="text-sm text-green-600 mt-3">Render job #{jobId} submitted</p>}
        </div>
      </main>
    </div>
  )
}
