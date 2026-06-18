'use client'

import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  accent?: 'red' | 'blue' | 'yellow'
}

export function Card({ children, className = '', accent }: CardProps) {
  const accentColor = {
    red: '#D02020',
    blue: '#1040C0',
    yellow: '#F0C020',
  }

  return (
    <div
      className={`
        bg-white
        border-4 border-black
        shadow-[8px_8px_0px_0px_black]
        p-6
        transition-all duration-200 ease-out
        hover:-translate-y-1
        ${className}
      `}
    >
      {accent && (
        <div
          className="absolute top-0 right-0 w-3 h-3 border-2 border-black"
          style={{ backgroundColor: accentColor[accent] }}
        />
      )}
      {children}
    </div>
  )
}
