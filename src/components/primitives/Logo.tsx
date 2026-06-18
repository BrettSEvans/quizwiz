'use client'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizeMap = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
  }

  return (
    <div className={`${sizeMap[size]} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Circle (top - brain/head) */}
        <circle cx="50" cy="30" r="20" fill="#1040C0" stroke="#121212" strokeWidth="2" />

        {/* Square (middle - body of beer glass) */}
        <rect
          x="35"
          y="45"
          width="30"
          height="35"
          fill="#D02020"
          stroke="#121212"
          strokeWidth="2"
        />

        {/* Triangle (bottom - base accent) */}
        <polygon
          points="50,85 35,95 65,95"
          fill="#F0C020"
          stroke="#121212"
          strokeWidth="2"
        />

        {/* Small accent square (rotated) */}
        <g transform="translate(75, 20)">
          <rect
            x="-8"
            y="-8"
            width="16"
            height="16"
            fill="#F0C020"
            stroke="#121212"
            strokeWidth="1.5"
            transform="rotate(45)"
          />
        </g>
      </svg>
    </div>
  )
}
