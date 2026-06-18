'use client'

import { ReactNode, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'yellow'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary: 'bg-[#D02020] text-white border-2 border-black shadow-[4px_4px_0px_0px_black]',
    secondary: 'bg-[#1040C0] text-white border-2 border-black shadow-[4px_4px_0px_0px_black]',
    outline: 'bg-white text-black border-2 border-black shadow-[4px_4px_0px_0px_black]',
    yellow: 'bg-[#F0C020] text-black border-2 border-black shadow-[4px_4px_0px_0px_black]',
  }

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  return (
    <button
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        font-bold uppercase tracking-wider
        transition-all duration-200 ease-out
        hover:shadow-[4px_4px_0px_0px_black] hover:opacity-90
        active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}
