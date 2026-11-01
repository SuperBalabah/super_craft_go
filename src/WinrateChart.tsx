import React, { useState, useRef, useMemo } from 'react'
import type { Game, Sign, Vertex } from './game'
import { gtp } from './katago'
import type { Judged, Pos, Cat } from './classify'
import { t } from './i18n'

interface WinrateChartProps {
  game: Game
  cursor: number
  judged?: (Judged | null | undefined)[] | null
  pos?: (Pos | undefined)[] | null
  go: (moveIndex: number) => void
  onReview?: () => void
  canReview?: boolean
  reading?: boolean
  pct?: number
}

interface Point {
  index: number // move index 0..total-1
  moveNumber: number // 1..total
  sign: Sign
  vertex: Vertex | null
  coord: string
  w: number // Black winrate 0..100
  lead?: number // Black score lead in points
  cat?: Cat
  loss?: number
  x: number // SVG coordinates
  y: number
}

const CAT_LABELS: Record<Cat, { name: string; color: string; bg: string }> = {
  brilliant: { name: '妙手', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.2)' },
  great: { name: '好手', color: '#34d399', bg: 'rgba(52, 211, 153, 0.2)' },
  best: { name: '最佳', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)' },
  excellent: { name: '極佳', color: '#818cf8', bg: 'rgba(129, 140, 248, 0.15)' },
  good: { name: '正著', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' },
  book: { name: '定石', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.15)' },
  inaccuracy: { name: '緩手', color: '#fb923c', bg: 'rgba(251, 146, 60, 0.2)' },
  mistake: { name: '失著', color: '#f87171', bg: 'rgba(248, 113, 113, 0.2)' },
  miss: { name: '錯失良機', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.2)' },
  blunder: { name: '大惡手', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.25)' },
}

export function WinrateChart({ game, cursor, judged, pos, go, onReview, canReview, reading, pct }: WinrateChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const W = 360, H = 84, PAD_X = 12, PAD_Y = 8
  const chartW = W - PAD_X * 2, chartH = H - PAD_Y * 2
  const midY = PAD_Y + chartH / 2 // 50% baseline

  const totalMoves = game.moves.length
  const size = game.info.size

  // Construct points array
  const points: Point[] = useMemo(() => {
    if (!totalMoves) return []

    return game.moves.map((m, i) => {
      const moveNumber = i + 1
      const j = judged?.[i]
      const p = pos?.[i]

      // Determine winrate (Black's winrate % 0..100)
      let w = 50
      if (j && typeof j.w === 'number') {
        w = Math.max(0.1, Math.min(99.9, j.w))
      } else if (p && typeof p.lead === 'number') {
        // sigmoid conversion from lead
        w = Math.max(0.1, Math.min(99.9, 100 / (1 + Math.exp(-0.14 * p.lead))))
      }

      const lead = p?.lead ?? (j ? (m.sign === 1 ? (j.ep - 0.5) * 30 : -(j.ep - 0.5) * 30) : undefined)
      const coord = m.vertex ? gtp(m.vertex, size) : t.passWord

      const x = totalMoves <= 1 ? PAD_X + chartW / 2 : PAD_X + (i / (totalMoves - 1)) * chartW
      // Invert Y: 100% winrate at top (PAD_Y), 0% winrate at bottom (PAD_Y + chartH)
      const y = PAD_Y + (1 - w / 100) * chartH

      return {
        index: i,
        moveNumber,
        sign: m.sign,
        vertex: m.vertex,
        coord,
        w,
        lead,
        cat: j?.cat,
        loss: j?.loss,
        x,
        y,
      }
    })
  }, [game.moves, judged, pos, totalMoves, size, chartW, chartH])

  const hasData = points.some(pt => judged?.[pt.index] || pos?.[pt.index])

  // Build SVG path
  const pathD = useMemo(() => {
    if (!points.length) return ''
    return points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`, '')
  }, [points])

  // Area under/over baseline for shading
  const areaD = useMemo(() => {
    if (!points.length) return ''
    const first = points[0], last = points[points.length - 1]
    return `M ${first.x.toFixed(1)},${midY} L ${first.x.toFixed(1)},${first.y.toFixed(1)} ` +
      points.slice(1).map(p => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
      ` L ${last.x.toFixed(1)},${midY} Z`
  }, [points, midY])

  // Current active move
  const activeMoveIndex = cursor > 0 ? cursor - 1 : 0
  const activePoint = points[activeMoveIndex] ?? points[0]

  // Hover target point
  const hoverPoint = hoverIndex !== null ? (points[hoverIndex] ?? null) : null
  const displayPoint = hoverPoint ?? activePoint

  // Handle click on chart to jump
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!points.length || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width
    const targetIdx = Math.max(0, Math.min(totalMoves - 1, Math.round(relX * (totalMoves - 1))))
    go(targetIdx + 1)
  }

  // Handle mouse move for scrubbing
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!points.length || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width
    const targetIdx = Math.max(0, Math.min(totalMoves - 1, Math.round(relX * (totalMoves - 1))))
    setHoverIndex(targetIdx)
  }

  const handleMouseLeave = () => {
    setHoverIndex(null)
  }

  return (
    <div className="fox-winrate-container">
      <div className="fox-winrate-header">
        <div className="fox-header-left">
          <span className="fox-title">{t.chartTitle}</span>
          {displayPoint && (
            <span className="fox-cur-move">
              <span className={`fox-stone-icon ${displayPoint.sign === 1 ? 'b' : 'w'}`} />
              第 {displayPoint.moveNumber} 手 · {displayPoint.coord}
            </span>
          )}
        </div>
        <div className="fox-header-right">
          {displayPoint && (
            <>
              <span className="fox-lead-stat">
                黑勝率 <strong style={{ color: displayPoint.w >= 50 ? '#38bdf8' : '#cbd5e1' }}>{displayPoint.w.toFixed(1)}%</strong>
              </span>
              {typeof displayPoint.lead === 'number' && (
                <span className="fox-lead-diff">
                  {displayPoint.lead >= 0 ? `黑+${displayPoint.lead.toFixed(1)}目` : `白+${Math.abs(displayPoint.lead).toFixed(1)}目`}
                </span>
              )}
              {displayPoint.cat && CAT_LABELS[displayPoint.cat] && (
                <span className="fox-cat-tag" style={{ color: CAT_LABELS[displayPoint.cat].color, background: CAT_LABELS[displayPoint.cat].bg }}>
                  {CAT_LABELS[displayPoint.cat].name}
                  {typeof displayPoint.loss === 'number' && displayPoint.loss >= 1 ? ` -${displayPoint.loss.toFixed(1)}` : ''}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      <div className="fox-chart-body" style={{ position: 'relative' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="fox-winrate-svg"
          onClick={handleSvgClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="blackAdvantage" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="whiteAdvantage" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#e11d48" stopOpacity="0.45" />
            </linearGradient>
            <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#fb7185" />
            </linearGradient>
          </defs>

          {/* Background upper (Black) & lower (White) zones */}
          <rect x={PAD_X} y={PAD_Y} width={chartW} height={chartH / 2} fill="url(#blackAdvantage)" rx="2" />
          <rect x={PAD_X} y={midY} width={chartW} height={chartH / 2} fill="url(#whiteAdvantage)" rx="2" />

          {/* 50% Baseline */}
          <line
            x1={PAD_X}
            y1={midY}
            x2={PAD_X + chartW}
            y2={midY}
            stroke="rgba(255, 255, 255, 0.28)"
            strokeDasharray="4 3"
            strokeWidth="1"
          />

          {/* Baseline label */}
          <text x={PAD_X + 2} y={midY - 3} fill="rgba(255, 255, 255, 0.4)" fontSize="8" fontFamily="sans-serif">50%</text>
          <text x={PAD_X + chartW - 24} y={PAD_Y + 9} fill="rgba(56, 189, 248, 0.7)" fontSize="8" fontFamily="sans-serif">黑優</text>
          <text x={PAD_X + chartW - 24} y={PAD_Y + chartH - 3} fill="rgba(251, 113, 133, 0.7)" fontSize="8" fontFamily="sans-serif">白優</text>

          {/* Winrate Area Fill & Line */}
          {hasData && pathD && (
            <>
              <path d={areaD} fill="rgba(56, 189, 248, 0.15)" />
              <path d={pathD} fill="none" stroke="url(#curveGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}

          {/* Notable move dots */}
          {hasData && points.map(p => {
            if (!p.cat || (p.cat !== 'blunder' && p.cat !== 'mistake' && p.cat !== 'brilliant' && p.cat !== 'great')) return null
            const isBad = p.cat === 'blunder' || p.cat === 'mistake'
            const isGood = p.cat === 'brilliant' || p.cat === 'great'
            return (
              <circle
                key={p.moveNumber}
                cx={p.x}
                cy={p.y}
                r={isBad ? 3.5 : 3}
                fill={isBad ? '#ef4444' : isGood ? '#34d399' : '#38bdf8'}
                stroke="#ffffff"
                strokeWidth="1.2"
                style={{ cursor: 'pointer', filter: isBad ? 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.8))' : 'drop-shadow(0 0 4px rgba(52, 211, 153, 0.8))' }}
              />
            )
          })}

          {/* Current board move marker line */}
          {cursor > 0 && points[cursor - 1] && (
            <g className="fox-cur-marker">
              <line
                x1={points[cursor - 1].x}
                y1={PAD_Y}
                x2={points[cursor - 1].x}
                y2={PAD_Y + chartH}
                stroke="#f59e0b"
                strokeWidth="1.5"
              />
              <circle
                cx={points[cursor - 1].x}
                cy={points[cursor - 1].y}
                r="4.5"
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth="1.5"
                style={{ filter: 'drop-shadow(0 0 6px #f59e0b)' }}
              />
            </g>
          )}

          {/* Hover scrubber vertical line */}
          {hoverPoint && (
            <g className="fox-hover-marker">
              <line
                x1={hoverPoint.x}
                y1={PAD_Y}
                x2={hoverPoint.x}
                y2={PAD_Y + chartH}
                stroke="#ffffff"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <circle
                cx={hoverPoint.x}
                cy={hoverPoint.y}
                r="4"
                fill="#ffffff"
                stroke="#0284c7"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Empty state or Review prompt */}
        {!hasData && (
          <div className="fox-empty-overlay">
            {reading ? (
              <div className="fox-reading-bar">
                <span>KataGo 深度復盤演算中 {pct !== undefined ? `${Math.round(pct * 100)}%` : '…'}</span>
                <div className="fox-progress-track">
                  <div className="fox-progress-fill" style={{ width: `${Math.round((pct ?? 0) * 100)}%` }} />
                </div>
              </div>
            ) : (
              <div className="fox-empty-prompt">
                <span>尚無勝率資料</span>
                {canReview && onReview && (
                  <button className="fox-review-btn" onClick={onReview}>
                    啟動復盤以生成勝率曲線
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
