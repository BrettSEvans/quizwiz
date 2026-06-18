'use client'

import { Check, Loader2, WifiOff } from 'lucide-react'

interface StatusBarProps {
  status: 'idle' | 'submitting' | 'submitted' | 'syncing' | 'disconnected'
  message?: string
}

export function StatusBar({ status, message }: StatusBarProps) {
  const statusConfig = {
    idle: {
      bg: 'bg-white',
      text: 'text-[#121212]',
      icon: null,
      label: message || '',
    },
    submitting: {
      bg: 'bg-[#1040C0]',
      text: 'text-white',
      icon: <Loader2 className="w-5 h-5 animate-spin" />,
      label: message || 'Submitting...',
    },
    submitted: {
      bg: 'bg-[#1040C0]',
      text: 'text-white',
      icon: <Check className="w-5 h-5" />,
      label: message || 'SUBMITTED ✓',
    },
    syncing: {
      bg: 'bg-[#F0C020]',
      text: 'text-black',
      icon: <Loader2 className="w-5 h-5 animate-spin" />,
      label: message || 'Syncing...',
    },
    disconnected: {
      bg: 'bg-[#D02020]',
      text: 'text-white',
      icon: <WifiOff className="w-5 h-5" />,
      label: message || 'Reconnecting...',
    },
  }

  const config = statusConfig[status]

  if (status === 'idle' && !message) {
    return null
  }

  return (
    <div
      className={`
        w-full py-2 px-4
        flex items-center justify-center gap-2
        font-bold uppercase tracking-wider
        border-b-2 border-black
        ${config.bg}
        ${config.text}
      `}
    >
      {config.icon && <span>{config.icon}</span>}
      <span>{config.label}</span>
    </div>
  )
}
