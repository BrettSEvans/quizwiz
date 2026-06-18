'use client'

import { Logo, Button } from '@/components/primitives'

export default function QuizmasterPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-6 mb-12">
          <Logo size="lg" />
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter">Quizmaster Portal</h1>
            <p className="text-lg mt-2 text-[var(--muted)]">Create and manage trivia packages</p>
          </div>
        </div>

        <div className="border-4 border-black shadow-[8px_8px_0px_0px_black] p-8 bg-white">
          <h2 className="text-3xl font-black uppercase mb-6">Coming Soon</h2>
          <p className="text-lg mb-6">
            The Quizmaster Portal for creating and managing trivia packages is coming in Phase 2.
          </p>
          <Button variant="outline">Learn More</Button>
        </div>
      </div>
    </div>
  )
}
