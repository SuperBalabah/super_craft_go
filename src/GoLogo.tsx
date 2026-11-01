import React from 'react'

export interface GoLogoProps {
  size?: number
  className?: string
}

/**
 * 弈境 (GoRealm) 原創向量 Logo
 * 融合黑白雙子太極陰陽律動、棋盤經緯十字星位與金石質感的現代幾何圍棋標誌。
 */
export const GoLogo: React.FC<GoLogoProps> = ({ size = 32, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`go-logo ${className}`}
      aria-label="弈境 GoRealm Logo"
    >
      <defs>
        {/* 外圈光暈漸變 */}
        <linearGradient id="gl-ring" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4af37" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#a37e2c" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#e5c158" stopOpacity="0.8" />
        </linearGradient>

        {/* 經緯格線金屬漸變 */}
        <linearGradient id="gl-grid" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#b49144" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#caa455" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#b49144" stopOpacity="0.1" />
        </linearGradient>

        {/* 黑子黑曜石質地 */}
        <radialGradient id="gl-black" cx="38%" cy="36%" r="65%">
          <stop offset="0%" stopColor="#3f3f46" />
          <stop offset="45%" stopColor="#18181b" />
          <stop offset="100%" stopColor="#09090b" />
        </radialGradient>

        {/* 白子雲子凝脂質地 */}
        <radialGradient id="gl-white" cx="36%" cy="34%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#f4f4f5" />
          <stop offset="85%" stopColor="#e4e4e7" />
          <stop offset="100%" stopColor="#a1a1aa" />
        </radialGradient>

        {/* 投影濾鏡 */}
        <filter id="gl-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.38" />
        </filter>
        <filter id="gl-soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* 經緯交織棋盤底蘊線條 */}
      <circle cx="50" cy="50" r="46" stroke="url(#gl-ring)" strokeWidth="1.75" opacity="0.75" />
      <line x1="22" y1="50" x2="78" y2="50" stroke="url(#gl-grid)" strokeWidth="1.2" strokeDasharray="1.5 2" />
      <line x1="50" y1="22" x2="50" y2="78" stroke="url(#gl-grid)" strokeWidth="1.2" strokeDasharray="1.5 2" />

      {/* 黑子（沈穩內斂） */}
      <circle
        cx="41"
        cy="43"
        r="24"
        fill="url(#gl-black)"
        filter="url(#gl-shadow)"
      />
      {/* 黑子高光微弧 */}
      <path
        d="M 28 35 A 18 18 0 0 1 48 27"
        stroke="#71717a"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.45"
      />

      {/* 白子（靈動玉潤，交疊於黑子之上） */}
      <circle
        cx="59"
        cy="57"
        r="24"
        fill="url(#gl-white)"
        filter="url(#gl-soft-shadow)"
        stroke="#d4d4d8"
        strokeWidth="0.75"
      />
      {/* 白子珍珠高光 */}
      <ellipse
        cx="52"
        cy="48"
        rx="5.5"
        ry="3.5"
        transform="rotate(-25 52 48)"
        fill="#ffffff"
        opacity="0.85"
      />

      {/* 天元星位核心微光 */}
      <circle cx="50" cy="50" r="2.2" fill="#d4af37" opacity="0.9" />
    </svg>
  )
}
