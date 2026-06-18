import { NextRequest, NextResponse } from 'next/server'
import { gameRepo } from '@/lib/db/repositories'
import { logger } from '@/lib/logger/system-log'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
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
    logger.logError('game:start:error', error as Error)
    return NextResponse.json({ error: 'Failed to start game' }, { status: 500 })
  }
}
