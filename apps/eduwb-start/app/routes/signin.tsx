import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { signupCreator } from '../lib/server-fns'
import { setCreatorId } from '../lib/auth'
import { useState } from 'react'

export const Route = createFileRoute('/signin')({
  component: SignIn,
})

function SignIn() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  const handleSignIn = async () => {
    if (!email.trim()) return
    const result = await signupCreator({ data: { email: email.trim() } })
    setCreatorId(result.id, result.email)
    navigate({ to: '/' })
  }

  return (
    <div className="w-screen h-screen bg-[#faf8f5] flex items-center justify-center">
      <div className="bg-white border rounded-xl p-8 max-w-sm w-full shadow-sm">
        <div className="flex items-center gap-2 justify-center mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M16 5L8 11M16 13L8 19" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span className="font-serif text-2xl font-bold">EduWhiteboard</span>
        </div>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-3 py-2 border rounded-md text-sm mb-4" autoFocus />
        <button onClick={handleSignIn} disabled={!email.trim()} className="w-full bg-blue-600 text-white rounded-md py-2.5 text-sm font-medium disabled:opacity-50">Continue</button>
      </div>
    </div>
  )
}
