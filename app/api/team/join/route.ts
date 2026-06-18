import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Dynamically import at runtime to avoid build-time database requirement
    const { gameRepo, teamRepo } = await import('@/lib/db/repositories')
    const { logger } = await import('@/lib/logger/system-log')

    const body = await request.json()
    const { sessionToken, teamName } = body

    const game = await gameRepo.findBySessionToken(sessionToken)
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    if (!game.status || game.status === 'completed') {
      return NextResponse.json({ error: 'Game not accepting teams' }, { status: 400 })
    }

    const teamToken = randomBytes(16).toString('hex')
    const team = await teamRepo.create({
      gameId: game.id,
      name: teamName,
      teamToken,
    })

    logger.logEvent('team:joined', {
      gameId: game.id,
      teamId: team.id,
      teamName,
    })

    return NextResponse.json({
      teamId: team.id,
      teamToken,
      gameId: game.id,
    })
  } catch (error) {
    try {
      const { logger } = await import('@/lib/logger/system-log')
      logger.logError('team:join:error', error as Error)
    } catch {}
    return NextResponse.json({ error: 'Failed to join game' }, { status: 500 })
  }
}
