'use client'

import { Logo, Button } from '@/components/primitives'

export default function HostPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-6 mb-12">
          <Logo size="lg" />
          <div>
            <h1 className="text-6xl font-black uppercase tracking-tighter text-[var(--fg)]">
              Eat. Drink.
            </h1>
            <h1 className="text-6xl font-black uppercase tracking-tighter text-[var(--red)]">
              Think. WIN!
            </h1>
            <p className="text-lg mt-2 uppercase tracking-wider font-bold">Host Control Panel</p>
          </div>
        </div>

        <div className="border-4 border-black shadow-[8px_8px_0px_0px_black] p-8 bg-white mb-8">
          <h2 className="text-3xl font-black uppercase mb-6">Start Your Game</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wide mb-2">
                Host Name
              </label>
              <input
                type="text"
                placeholder="Your name"
                className="w-full border-2 border-black p-3 font-sans"
              />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-wide mb-2">Venue</label>
              <input
                type="text"
                placeholder="Bar or venue name"
                className="w-full border-2 border-black p-3 font-sans"
              />
            </div>
            <Button variant="primary" size="lg" className="w-full">
              Start Game
            </Button>
          </div>
        </div>

        <div className="text-center text-sm uppercase tracking-wider font-bold text-[var(--muted)]">
          Powered by Head Games Trivia
        </div>
      </div>
    </div>
  )
}
