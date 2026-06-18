'use client'

import { Logo, Button, StatusBar } from '@/components/primitives'
import { useState } from 'react'

export default function PlayPage({ params }: { params: { token: string } }) {
  const [teamName, setTeamName] = useState('')
  const [joined, setJoined] = useState(false)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'submitted' | 'syncing' | 'disconnected'>('idle')

  const handleJoin = () => {
    if (teamName.trim()) {
      setJoined(true)
    }
  }

  const handleSubmit = () => {
    setStatus('submitting')
    setTimeout(() => {
      setStatus('submitted')
    }, 500)
  }

  if (!joined) {
    return (
      <div className="min-h-screen bg-[var(--blue)] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border-4 border-black shadow-[8px_8px_0px_0px_black] p-8">
          <div className="flex justify-center mb-8">
            <Logo size="md" />
          </div>
          <h1 className="text-4xl font-black uppercase text-center mb-8 tracking-tighter">
            Join Game
          </h1>
          <input
            type="text"
            placeholder="Enter Team Name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            className="w-full border-2 border-black p-3 font-sans mb-4 text-lg"
            autoFocus
          />
          <Button variant="secondary" size="lg" onClick={handleJoin} className="w-full">
            Join
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--blue)] flex flex-col">
      <StatusBar status={status} message={status === 'submitted' ? 'SUBMITTED ✓' : undefined} />

      <div className="flex-1 p-4 flex flex-col">
        <h1 className="text-3xl font-black uppercase text-white text-center mb-8">
          {teamName}
        </h1>

        <div className="flex-1 bg-white border-4 border-black shadow-[8px_8px_0px_0px_black] p-6 flex flex-col">
          <h2 className="text-2xl font-black uppercase mb-6">Round 1: Standard</h2>

          <div className="space-y-4 flex-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i}>
                <label className="block text-sm font-bold uppercase mb-1">Question {i}</label>
                <input
                  type="text"
                  placeholder="Your answer"
                  className="w-full border-2 border-black p-2 font-sans"
                />
              </div>
            ))}
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            disabled={status === 'submitted'}
            className="w-full mt-6"
          >
            {status === 'submitted' ? 'Submitted' : 'Submit Answers'}
          </Button>
        </div>
      </div>
    </div>
  )
}
