'use client'

export default function BoardPage({ params }: { params: { token: string } }) {
  const mockScoreboard = [
    { rank: 1, name: 'The Legends', score: 48 },
    { rank: 2, name: 'Brain Squad', score: 46 },
    { rank: 3, name: 'Quiz Ninjas', score: 42 },
    { rank: 4, name: 'Smart Cookies', score: 38 },
    { rank: 5, name: 'Trivial Pursuits', score: 35 },
  ]

  return (
    <div className="min-h-screen bg-[var(--yellow)] p-8 flex flex-col">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
        <h1 className="text-8xl font-black uppercase text-[var(--fg)] mb-12 tracking-tighter">
          LEADERBOARD
        </h1>

        <div className="flex-1 bg-white border-4 border-black shadow-[8px_8px_0px_0px_black] p-8">
          <table className="w-full">
            <thead>
              <tr className="border-b-4 border-black">
                <th className="text-left py-3 px-4 font-black uppercase text-lg">Rank</th>
                <th className="text-left py-3 px-4 font-black uppercase text-lg">Team</th>
                <th className="text-right py-3 px-4 font-black uppercase text-lg">Score</th>
              </tr>
            </thead>
            <tbody>
              {mockScoreboard.map((team) => (
                <tr key={team.rank} className="border-b-2 border-black hover:bg-[var(--muted)]">
                  <td className="py-4 px-4 text-2xl font-black text-[var(--red)]">{team.rank}</td>
                  <td className="py-4 px-4 text-xl font-bold uppercase">{team.name}</td>
                  <td className="py-4 px-4 text-right text-2xl font-black text-[var(--blue)]">
                    {team.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-center mt-12 text-lg font-bold uppercase tracking-wider">
          Eat. Drink. Think. WIN!
        </p>
      </div>
    </div>
  )
}
