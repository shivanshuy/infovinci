/** True isometric: 30° elevation, the same camera the reference machines use. */
export const SCALE = 42
export const OX = 390.6
export const OY = 108

const COS = Math.cos(Math.PI / 6)
const SIN = Math.sin(Math.PI / 6)

export function project(x: number, y: number, z: number): [number, number] {
  return [OX + (x - y) * COS * SCALE, OY + ((x + y) * SIN - z) * SCALE]
}

function pts(points: [number, number][]) {
  return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
}

export function Solid({
  x,
  y,
  z,
  w,
  d,
  h,
  shadow = false,
  className = '',
}: {
  x: number
  y: number
  z: number
  w: number
  d: number
  h: number
  shadow?: boolean
  className?: string
}) {
  const p = (dx: number, dy: number, dz: number) => project(x + dx, y + dy, z + dz)
  const top = [p(0, 0, h), p(w, 0, h), p(w, d, h), p(0, d, h)]
  const front = [p(0, d, h), p(w, d, h), p(w, d, 0), p(0, d, 0)]
  const side = [p(w, 0, h), p(w, d, h), p(w, d, 0), p(w, 0, 0)]
  const foot = [p(0, 0, 0), p(w, 0, 0), p(w, d, 0), p(0, d, 0)].map(
    ([px, py]) => [px + 7, py + 8] as [number, number],
  )
  const ink = [top, front, side]
  return (
    <g className={`edge-solid ${className}`.trim()}>
      {shadow ? <polygon className="edge-solid__shadow" points={pts(foot)} /> : null}
      {ink.map((face, index) => (
        <polygon key={`ink-${index}`} className="edge-solid__ink" points={pts(face)} />
      ))}
      <polygon className="edge-solid__side" points={pts(side)} />
      <polygon className="edge-solid__front" points={pts(front)} />
      <polygon className="edge-solid__top" points={pts(top)} />
    </g>
  )
}

export function Cylinder({
  x,
  y,
  z,
  r,
  h,
  className = '',
}: {
  x: number
  y: number
  z: number
  r: number
  h: number
  className?: string
}) {
  const [sx, sy] = project(x, y, z + h)
  const rx = r * COS * Math.SQRT2 * SCALE
  const ry = r * SIN * Math.SQRT2 * SCALE
  const drop = h * SCALE
  const body = pts([
    [sx - rx, sy],
    [sx + rx, sy],
    [sx + rx, sy + drop],
    [sx - rx, sy + drop],
  ])
  return (
    <g className={`edge-cyl ${className}`.trim()}>
      <polygon className="edge-cyl__body" points={body} />
      <ellipse className="edge-cyl__top" cx={sx} cy={sy} rx={rx} ry={ry} />
    </g>
  )
}

export function Hose({ points, quiet = false }: { points: [number, number, number][]; quiet?: boolean }) {
  const d = points.map(([x, y, z]) => project(x, y, z).map((n) => n.toFixed(1)).join(',')).join(' ')
  const cls = quiet ? ' edge-hose--quiet' : ''
  return (
    <g className="edge-hoses" fill="none">
      <polyline className={`edge-hose${cls}`} points={d} />
      <polyline className={`edge-hose edge-hose--sheen${cls}`} points={d} />
    </g>
  )
}

export function Plate({ x, y, z, text }: { x: number; y: number; z: number; text: string }) {
  const [lx, ly] = project(x, y, z)
  const w = Math.max(58, text.length * 6.6 + 14)
  return (
    <g className="edge-plate">
      <line x1={lx} y1={ly - 2} x2={lx} y2={ly - 16} />
      <rect x={lx - w / 2} y={ly - 34} width={w} height={16} rx={2} />
      <text x={lx} y={ly - 23} textAnchor="middle">
        {text}
      </text>
    </g>
  )
}
