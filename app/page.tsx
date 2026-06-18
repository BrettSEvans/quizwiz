'use client'

import { Logo, Button } from '@/components/primitives'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <div className="max-w-7xl mx-auto w-full py-16 px-4 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-6 mb-16">
          <Logo size="lg" />
          <div>
            <h1 className="text-6xl sm:text-7xl font-black uppercase tracking-tighter text-[var(--red)]">
              QuizWiz
            </h1>
            <p className="text-2xl font-bold uppercase tracking-wider mt-2">
              Eat. Drink. Think. WIN!
            </p>
          </div>
        </div>

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 mb-12">
          {/* Left: Description */}
          <div>
            <h2 className="text-5xl font-black uppercase mb-6 tracking-tighter">
              Live Trivia<br />
              Scoring for Bars
            </h2>
            <p className="text-lg leading-relaxed mb-8 font-medium">
              QuizWiz is the companion platform for live bar trivia. Hosts manage the game, teams
              submit answers on mobile, and the scoreboard displays live rankings.
            </p>
            <p className="text-sm uppercase tracking-wider font-bold text-[var(--muted)] mb-8">
              Brought to you by Head Games Trivia
            </p>
          </div>

          {/* Right: Action Cards */}
          <div className="space-y-4">
            <Link href="/host" className="block">
              <div className="bg-[var(--red)] border-4 border-black shadow-[8px_8px_0px_0px_black] p-6 hover:-translate-y-1 transition-all cursor-pointer h-full">
                <h3 className="text-2xl font-black uppercase text-white mb-2 tracking-tight">
                  Host Control
                </h3>
                <p className="text-white font-bold">Run your game</p>
              </div>
            </Link>
            <Link href="/quizmaster" className="block">
              <div className="bg-[var(--blue)] border-4 border-black shadow-[8px_8px_0px_0px_black] p-6 hover:-translate-y-1 transition-all cursor-pointer h-full">
                <h3 className="text-2xl font-black uppercase text-white mb-2 tracking-tight">
                  Quizmaster
                </h3>
                <p className="text-white font-bold">Create packages</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_black] p-8">
          <h3 className="text-3xl font-black uppercase mb-6">Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Real-Time',
                desc: 'Live answer submissions and instant score updates',
              },
              {
                title: 'Mobile-First',
                desc: 'Teams join via QR code on mobile browsers',
              },
              {
                title: 'Flexible',
                desc: 'Create custom rounds and scoring rules',
              },
            ].map((feature) => (
              <div key={feature.title} className="border-2 border-black p-4">
                <h4 className="font-black uppercase text-lg mb-2">{feature.title}</h4>
                <p className="text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-4 border-black p-4 text-center text-sm uppercase tracking-wider font-bold">
        QuizWiz v1.0 — Powered by Head Games Trivia
      </div>
    </div>
  )
}
