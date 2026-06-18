import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Dynamically import at runtime to avoid build-time database requirement
    const { gameRepo } = await import('@/lib/db/repositories')
    const { logger } = await import('@/lib/logger/system-log')

    const body = await request.json()
    const { hostName, venueName, packageSnapshot } = body

    const sessionToken = randomBytes(16).toString('hex')
    const boardToken = randomBytes(16).toString('hex')
    const manualJoinCode = randomBytes(3).toString('hex').toUpperCase()

    const game = await gameRepo.create({
      hostId: 'host-1', // TODO: get from auth
      hostName,
      venueName,
      sessionToken,
      boardToken,
      manualJoinCode,
      packageSnapshot,
    })

    logger.logEvent('game:created', {
      gameId: game.id,
      hostName,
      venueName,
    })

    return NextResponse.json({
      gameId: game.id,
      sessionToken,
      boardToken,
      manualJoinCode,
      qrCode: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/play/${sessionToken}`,
    })
  } catch (error) {
    try {
      const { logger } = await import('@/lib/logger/system-log')
      logger.logError('game:start:error', error as Error)
    } catch {}
    return NextResponse.json({ error: 'Failed to start game' }, { status: 500 })
  }
}
