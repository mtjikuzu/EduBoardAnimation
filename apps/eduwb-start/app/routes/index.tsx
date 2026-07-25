import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { listLessons, createLesson, deleteLesson, getCreditBalance, purchaseCredits, signupCreator } from '../lib/server-fns'
import { getCreatorId, setCreatorId } from '../lib/auth'
import { useState } from 'react'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [signedIn, setSignedIn] = useState(!!getCreatorId())
  const [showNew, setShowNew] = useState(false)
  const [title, setTitle] = useState('')
  const [grade, setGrade] = useState('')
  const [lang, setLang] = useState('English')

  const handleSignIn = async () => {
    if (!email.trim()) return
    const result = await signupCreator({ data: { email: email.trim() } })
    setCreatorId(result.id, result.email)
    setSignedIn(true)
  }

  const creatorId = getCreatorId()

  const { data: lessons, refetch: refetchLessons } = useQuery({
    queryKey: ['lessons', creatorId],
    queryFn: () => listLessons({ data: creatorId! }),
    enabled: !!creatorId,
  })

  const { data: balance } = useQuery({
    queryKey: ['balance', creatorId],
    queryFn: () => getCreditBalance({ data: creatorId! }),
    enabled: !!creatorId,
  })

  const handleCreate = async () => {
    if (!creatorId || !title || !grade) return
    await createLesson({ data: { creatorId, title, grade, language: lang } })
    setShowNew(false)
    setTitle('')
    setGrade('')
    refetchLessons()
  }

  const handleDelete = async (id: number) => {
    if (!creatorId) return
    if (!confirm('Delete this lesson?')) return
    await deleteLesson({ data: { id, creatorId } })
    refetchLessons()
  }

  const handleBuyCredits = async () => {
    if (!creatorId) return
    await purchaseCredits({ data: { creatorId, amount: 100 } })
    window.location.reload()
  }

  if (!signedIn) {
    return (
      <div className="w-screen h-screen bg-[#faf8f5] flex items-center justify-center">
        <div className="bg-white border rounded-xl p-8 max-w-sm w-full shadow-sm">
          <h1 className="font-serif text-2xl font-bold mb-6 text-center">EduWhiteboard</h1>
          <p className="text-sm text-gray-500 mb-4 text-center">Sign in to get started</p>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-3 py-2 border rounded-md text-sm mb-4" />
          <button onClick={handleSignIn} disabled={!email.trim()} className="w-full bg-blue-600 text-white rounded-md py-2 text-sm font-medium disabled:opacity-50">Continue</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <header className="h-14 bg-white border-b flex items-center justify-between px-6">
        <h1 className="font-serif font-bold text-lg">EduWhiteboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{balance?.available ?? 0} credits</span>
          <button onClick={handleBuyCredits} className="text-xs bg-gray-100 px-2 py-1 rounded">+ Buy</button>
          <button onClick={() => setShowNew(true)} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium">+ New Lesson</button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-6">
        {showNew && (
          <div className="bg-white border rounded-xl p-6 mb-6">
            <h2 className="font-serif text-lg font-bold mb-4">New Lesson</h2>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Lesson title" className="w-full px-3 py-2 border rounded-md text-sm mb-3" />
            <input value={grade} onChange={e => setGrade(e.target.value)} placeholder="Grade level" className="w-full px-3 py-2 border rounded-md text-sm mb-3" />
            <select value={lang} onChange={e => setLang(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm mb-3"><option>English</option></select>
            <div className="flex gap-2">
              <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Create</button>
              <button onClick={() => setShowNew(false)} className="text-sm text-gray-500">Cancel</button>
            </div>
          </div>
        )}
        {(!lessons || lessons.length === 0) && (
          <div className="text-center py-20"><p className="text-gray-500 mb-4">No lessons yet</p>
            <button onClick={() => setShowNew(true)} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium">Create your first lesson</button>
          </div>
        )}
        <div className="grid grid-cols-3 gap-4">
          {lessons?.map(lesson => (
            <div key={lesson.id} className="bg-white border rounded-xl overflow-hidden hover:shadow-sm cursor-pointer" onClick={() => navigate({ to: '/lessons/$id', params: { id: String(lesson.id) } })}>
              <div className="h-24 bg-gray-50 flex items-center justify-center text-gray-300 text-sm">{lesson.grade}</div>
              <div className="p-3">
                <h3 className="font-medium text-sm">{lesson.title}</h3>
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>{lesson.language}</span>
                  <span className="capitalize">{lesson.status}</span>
                </div>
                <button onClick={e => { e.stopPropagation(); handleDelete(lesson.id) }} className="text-xs text-red-500 mt-2">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
