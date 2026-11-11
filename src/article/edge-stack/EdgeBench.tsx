import { useEffect, useMemo, useState } from 'react'
import { Cylinder, Hose, Plate, Solid, project } from './isoKit'
import { useReducedMotion } from './useReducedMotion'

type StationId = 'request' | 'waf' | 'lb' | 'gw' | 'appA' | 'appB' | 'trace'
type Kind = 'page' | 'attack' | 'api' | 'anon'
type Tone = 'run' | 'deny' | 'ok' | 'skip'
type Shape = 'website' | 'api'

type Frame = { at: StationId; tone: Tone; text: string }

type Station = {
  id: StationId
  label: string
  kicker: string
}

const STATIONS: Station[] = [
  { id: 'request', label: 'Request', kicker: '01' },
  { id: 'waf', label: 'WAF', kicker: '02' },
  { id: 'lb', label: 'Balancer', kicker: '03' },
  { id: 'gw', label: 'Gateway', kicker: '04' },
  { id: 'appA', label: 'App A', kicker: '05' },
  { id: 'appB', label: 'App B', kicker: '06' },
  { id: 'trace', label: 'Trace', kicker: '07' },
]

const DECK = 0.52
const HOSE_Z = 0.66

type BoxPart = { kind: 'box'; x: number; y: number; z: number; w: number; d: number; h: number; shadow?: boolean; slip?: boolean }
type CylPart = { kind: 'cyl'; x: number; y: number; z: number; r: number; h: number; dial?: boolean }
type Part = BoxPart | CylPart

type Assembly = {
  id: StationId
  label: string
  depth: number
  ax: number
  ay: number
  plate: [number, number, number]
  token: [number, number, number]
  parts: Part[]
}

const ASSEMBLIES: Assembly[] = [
  {
    id: 'request',
    label: 'REQUEST',
    depth: 6.6,
    ax: 1.55,
    ay: 5.15,
    plate: [1.15, 4.45, 1.75],
    token: [1.55, 5.15, 1.55],
    parts: [
      { kind: 'box', x: 0.7, y: 4.5, z: DECK, w: 1.7, d: 1.15, h: 0.18, shadow: true },
      { kind: 'box', x: 0.82, y: 4.55, z: DECK + 0.18, w: 1.46, d: 0.14, h: 0.92 },
      { kind: 'box', x: 1.05, y: 4.88, z: DECK + 0.18, w: 0.7, d: 0.06, h: 0.74, slip: true },
    ],
  },
  {
    id: 'waf',
    label: 'WAF',
    depth: 8.5,
    ax: 4.35,
    ay: 4.8,
    plate: [4.35, 4.2, 2.15],
    token: [4.35, 4.8, 2.05],
    parts: [
      { kind: 'box', x: 3.55, y: 4.15, z: DECK, w: 1.6, d: 1.25, h: 1.35, shadow: true },
      { kind: 'cyl', x: 4.35, y: 4.75, z: DECK + 1.35, r: 0.34, h: 0.14, dial: true },
      { kind: 'cyl', x: 4.85, y: 4.4, z: DECK + 1.35, r: 0.1, h: 0.22 },
    ],
  },
  {
    id: 'lb',
    label: 'BALANCER',
    depth: 8.6,
    ax: 7.25,
    ay: 3.2,
    plate: [7.25, 2.5, 1.7],
    token: [7.25, 3.2, 1.55],
    parts: [
      { kind: 'box', x: 6.15, y: 2.45, z: DECK, w: 2.2, d: 1.5, h: 0.78, shadow: true },
      { kind: 'cyl', x: 6.75, y: 3.15, z: DECK + 0.78, r: 0.16, h: 0.32 },
      { kind: 'cyl', x: 7.7, y: 3.15, z: DECK + 0.78, r: 0.16, h: 0.32 },
    ],
  },
  {
    id: 'appA',
    label: 'APP A',
    depth: 6.4,
    ax: 10.75,
    ay: 1.15,
    plate: [10.75, 0.6, 2.55],
    token: [10.75, 1.15, 2.45],
    parts: [
      { kind: 'box', x: 10.05, y: 0.55, z: DECK, w: 1.4, d: 1.15, h: 1.9, shadow: true },
      { kind: 'box', x: 11.32, y: 0.78, z: DECK + 1.35, w: 0.16, d: 0.7, h: 0.07 },
      { kind: 'box', x: 11.32, y: 0.78, z: DECK + 1.12, w: 0.16, d: 0.7, h: 0.07 },
      { kind: 'box', x: 11.32, y: 0.78, z: DECK + 0.89, w: 0.16, d: 0.7, h: 0.07 },
      { kind: 'cyl', x: 10.45, y: 0.9, z: DECK + 1.9, r: 0.09, h: 0.16 },
    ],
  },
  {
    id: 'gw',
    label: 'GATEWAY',
    depth: 13.4,
    ax: 7.2,
    ay: 6.95,
    plate: [7.15, 7.75, 1.35],
    token: [7.2, 6.95, 1.75],
    parts: [
      { kind: 'box', x: 6.35, y: 6.35, z: DECK, w: 1.7, d: 1.15, h: 1.1, shadow: true },
      { kind: 'box', x: 6.9, y: 7.38, z: DECK + 0.42, w: 0.55, d: 0.2, h: 0.38 },
    ],
  },
  {
    id: 'appB',
    label: 'APP B',
    depth: 13.2,
    ax: 10.55,
    ay: 3.75,
    plate: [10.55, 3.2, 2.35],
    token: [10.55, 3.75, 2.25],
    parts: [
      { kind: 'box', x: 9.85, y: 3.15, z: DECK, w: 1.4, d: 1.15, h: 1.65, shadow: true },
      { kind: 'box', x: 11.12, y: 3.38, z: DECK + 1.15, w: 0.16, d: 0.7, h: 0.07 },
      { kind: 'box', x: 11.12, y: 3.38, z: DECK + 0.92, w: 0.16, d: 0.7, h: 0.07 },
      { kind: 'box', x: 11.12, y: 3.38, z: DECK + 0.69, w: 0.16, d: 0.7, h: 0.07 },
    ],
  },
  {
    id: 'trace',
    label: 'TRACE',
    depth: 14.6,
    ax: 3.55,
    ay: 8.3,
    plate: [4.15, 8.85, 1.05],
    token: [3.55, 8.3, 1.15],
    parts: [
      { kind: 'box', x: 2.3, y: 7.85, z: DECK, w: 2.5, d: 0.9, h: 0.42, shadow: true },
      { kind: 'cyl', x: 3.1, y: 8.15, z: DECK + 0.42, r: 0.18, h: 0.16 },
      { kind: 'box', x: 3.2, y: 8.68, z: DECK + 0.34, w: 0.72, d: 0.38, h: 0.04, slip: true },
    ],
  },
]

const HOSES: { id: string; quiet?: 'spur' | 'b'; points: [number, number, number][] }[] = [
  {
    id: 'in',
    points: [
      [2.4, 5.05, HOSE_Z],
      [3.55, 5.05, HOSE_Z],
      [3.55, 4.78, HOSE_Z],
    ],
  },
  {
    id: 'mid',
    points: [
      [5.15, 4.78, HOSE_Z],
      [5.15, 3.2, HOSE_Z],
      [6.15, 3.2, HOSE_Z],
    ],
  },
  {
    id: 'a',
    points: [
      [7.25, 2.45, HOSE_Z],
      [7.25, 1.12, HOSE_Z],
      [10.05, 1.12, HOSE_Z],
    ],
  },
  {
    id: 'spur',
    quiet: 'spur',
    points: [
      [7.25, 3.95, HOSE_Z],
      [7.25, 6.35, HOSE_Z],
    ],
  },
  {
    id: 'b',
    quiet: 'b',
    points: [
      [8.05, 6.92, HOSE_Z],
      [9.85, 6.92, HOSE_Z],
      [9.85, 3.72, HOSE_Z],
    ],
  },
  {
    id: 'trace',
    points: [
      [2.4, 5.05, HOSE_Z],
      [2.4, 8.3, HOSE_Z],
      [2.3, 8.3, HOSE_Z],
    ],
  },
]

const COPY: Record<StationId, { plain: string; sharp: string }> = {
  request: {
    plain: 'The call as it left the browser or the partner app: a method, a path, and maybe a body.',
    sharp: 'Nothing has been filtered, authenticated, or assigned to a process yet. DNS already happened, off this bench.',
  },
  waf: {
    plain: 'Reads the HTTP and can stop the run. A valid key is not a reason to skip this.',
    sharp: 'It only works on a hop that can see decrypted HTTP. An L4 balancer in front of it cannot do this job. Turn it off and an exploit is just another request the balancer will deliver.',
  },
  lb: {
    plain: 'Picks a machine that answered its health check. It does not know who the caller is.',
    sharp: 'Least connections, active probes, and draining. Server B down means the pool is smaller. The balancer will still deliver a SQL probe if the WAF did not refuse it.',
  },
  gw: {
    plain: 'Checks the badge and the quota, then sends the call on. A normal website does not stop here.',
    sharp: 'Authentication, not authorization. The handler still decides whether this caller may touch this record. Remove the gateway and that 401 happens inside a worker you already paid for.',
  },
  appA: {
    plain: 'One copy of the program. It renders the page or checks that this caller owns the order.',
    sharp: 'Security group should allow this port only from the balancer or the gateway. A public task can be reached with a forged X-Consumer-Username.',
  },
  appB: {
    plain: 'The other copy. If it stops answering, the balancer walks past it.',
    sharp: 'Same target group, other availability zone. Health-check failure removes it. Passive failure detection waits for a real request to fail first.',
  },
  trace: {
    plain: 'The slip that says where the call stopped, and whether an app was bothered.',
    sharp: 'Per-hop logs are how you tell a 403 at the WAF from a 401 at the gateway from a 401 inside the handler.',
  },
}

function station(id: StationId): Station {
  const found = STATIONS.find((item) => item.id === id)
  if (!found) throw new Error(id)
  return found
}

function buildFrames(kind: Kind, shape: Shape, wafOff: boolean, gwOff: boolean, bDown: boolean): Frame[] {
  const frames: Frame[] = []
  const push = (at: StationId, tone: Tone, text: string) => frames.push({ at, tone, text })
  const target: StationId = bDown || kind !== 'api' ? 'appA' : 'appB'
  const which = target === 'appA' ? 'app A' : 'app B'

  push(
    'request',
    'run',
    kind === 'attack'
      ? "Probe arrives: GET /search?q=' OR 1=1."
      : kind === 'anon'
        ? 'Call arrives with no API key.'
        : kind === 'api'
          ? 'Partner calls GET /v1/orders with a valid key.'
          : 'Browser asks for a public page.',
  )

  if (kind === 'attack' && !wafOff) {
    push('waf', 'deny', 'Signature matches. 403. The balancer is not contacted.')
    push('trace', 'deny', 'Stopped at the WAF.')
    return frames
  }

  push(
    'waf',
    wafOff && kind === 'attack' ? 'skip' : 'run',
    wafOff && kind === 'attack'
      ? 'The filter is open. The probe continues.'
      : 'The HTTP looks ordinary. It continues.',
  )

  push(
    'lb',
    'run',
    `Picks ${which}.${bDown ? ' Server B failed its health check.' : ' Both apps are healthy.'}`,
  )

  if (shape === 'api' && !gwOff) {
    if (kind === 'anon') {
      push('gw', 'deny', 'No key. 401. No app process is used.')
      push('trace', 'deny', 'Stopped at the API gateway.')
      return frames
    }
    if (kind === 'page') {
      push('gw', 'deny', 'Not an API route. 404. The apps stay idle.')
      push('trace', 'deny', 'No matching route at the gateway.')
      return frames
    }
    push('gw', 'run', 'Key maps to a consumer. This minute’s quota has room.')
  } else if (shape === 'api' && gwOff) {
    push('gw', 'skip', 'Gateway removed. The next hop is the app, which must check the caller itself.')
  }

  if (kind === 'attack') {
    push(target, 'deny', 'The probe reached a live process. The balancer only knew the process was up.')
    push('trace', 'deny', 'WAF was open. The exploit was delivered.')
    return frames
  }

  if (kind === 'anon') {
    push(target, 'deny', 'The handler returns 401. A worker was already chosen.')
    push('trace', 'deny', 'Rejected inside the app, after the balancer.')
    return frames
  }

  push(
    target,
    'ok',
    shape === 'api'
      ? 'Handler checks that this caller owns the order, then returns 200.'
      : 'The app renders the page.',
  )
  push('trace', 'ok', `Served by ${which}.`)
  return frames
}

const PRESETS: {
  id: string
  label: string
  kind: Kind
  shape: Shape
  blurb: string
  wafOff?: boolean
  gwOff?: boolean
  bDown?: boolean
}[] = [
  {
    id: 'page',
    label: 'Healthy page',
    kind: 'page',
    shape: 'website',
    blurb:
      'A browser asks for a public page. The WAF sees ordinary HTTP and lets it through. The balancer picks App A. The app renders the page. The trace says it was served by App A. The gateway stays faded: a website does not stop there.',
  },
  {
    id: 'attack',
    label: 'SQL injection',
    kind: 'attack',
    shape: 'website',
    blurb:
      "The call is GET /search?q=' OR 1=1. The WAF recognizes the probe and returns 403. The balancer, both apps, and the gateway are never contacted. The trace says it stopped at the WAF.",
  },
  {
    id: 'open',
    label: 'Injection, WAF open',
    kind: 'attack',
    shape: 'website',
    wafOff: true,
    blurb:
      'The same probe, with the WAF switched off, so that block is faded. The balancer still sees a live process and delivers the probe to App A. The app is the first thing that can refuse it, which is already too late: the exploit was handed to a running process. The trace says the WAF was open.',
  },
  {
    id: 'api',
    label: 'API call',
    kind: 'api',
    shape: 'api',
    blurb:
      'A partner calls GET /v1/orders with a valid key. The WAF lets it through. The balancer picks App B, because both apps are healthy and this is an API, so the lower spur is in use. The gateway checks the key and the quota, then the handler checks that this caller owns the order and returns 200. The trace says it was served by App B.',
  },
  {
    id: 'anon',
    label: 'API, no key',
    kind: 'anon',
    shape: 'api',
    blurb:
      'The same API path, with no key. The WAF and the balancer still run, then the gateway returns 401. No app process is used. The trace says it stopped at the API gateway.',
  },
  {
    id: 'nogw',
    label: 'No key, no gateway',
    kind: 'anon',
    shape: 'api',
    gwOff: true,
    blurb:
      'The same call with no key, and the gateway removed, so that block is faded. The balancer has already chosen App A. The handler itself returns 401. A worker was spent on a caller who had no key. The trace says it was rejected inside the app.',
  },
  {
    id: 'down',
    label: 'Server B down',
    kind: 'api',
    shape: 'api',
    bDown: true,
    blurb:
      'A valid API call again, but App B failed its health check, so that rack is faded. The gateway still checks the key. The balancer skips B and picks App A. The handler returns 200. The trace says it was served by App A.',
  },
]

function shiftOf(asm: Assembly, exploded: boolean): [number, number] {
  if (!exploded) return [0, 0]
  const vx = asm.ax - 6.6
  const vy = asm.ay - 4.7
  const len = Math.hypot(vx, vy) || 1
  return [(vx / len) * 1.7, (vy / len) * 1.7]
}

function AssemblyView({
  asm,
  exploded,
  state,
  selected,
  onSelect,
}: {
  asm: Assembly
  exploded: boolean
  state: 'idle' | 'on' | 'seen' | 'deny' | 'dim'
  selected: boolean
  onSelect: (id: StationId) => void
}) {
  const [ox, oy] = shiftOf(asm, exploded)
  const parts = [...asm.parts].sort((a, b) => a.x + a.y + a.z - (b.x + b.y + b.z))
  return (
    <g
      className={`edge-asm edge-asm--${state}${selected ? ' edge-asm--selected' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={asm.label}
      onClick={() => onSelect(asm.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(asm.id)
        }
      }}
    >
      {parts.map((part, index) =>
        part.kind === 'box' ? (
          <Solid
            key={index}
            x={part.x + ox}
            y={part.y + oy}
            z={part.z}
            w={part.w}
            d={part.d}
            h={part.h}
            shadow={part.shadow}
            className={part.slip ? 'edge-solid--slip' : ''}
          />
        ) : (
          <Cylinder
            key={index}
            x={part.x + ox}
            y={part.y + oy}
            z={part.z}
            r={part.r}
            h={part.h}
            className={part.dial ? 'edge-cyl--dial' : ''}
          />
        ),
      )}
    </g>
  )
}

export function EdgeBench() {
  const reduced = useReducedMotion()
  const [presetId, setPresetId] = useState(PRESETS[0].id)
  const [playing, setPlaying] = useState(false)
  const [frame, setFrame] = useState(0)
  const [exploded, setExploded] = useState(false)
  const [selected, setSelected] = useState<StationId>('request')

  const preset = PRESETS.find((item) => item.id === presetId) ?? PRESETS[0]
  const frames = useMemo(
    () =>
      buildFrames(
        preset.kind,
        preset.shape,
        Boolean(preset.wafOff),
        Boolean(preset.gwOff),
        Boolean(preset.bDown),
      ),
    [preset],
  )
  const index = Math.min(frame, frames.length - 1)
  const current = frames[index]

  useEffect(() => {
    setFrame(0)
    setPlaying(false)
  }, [presetId])

  useEffect(() => {
    if (!playing || reduced || exploded) return
    if (index >= frames.length - 1) {
      setPlaying(false)
      return
    }
    const id = window.setTimeout(() => setFrame((value) => value + 1), 900)
    return () => window.clearTimeout(id)
  }, [playing, reduced, exploded, index, frames.length])

  const tokenAt = current?.at ?? 'request'
  const tokenAsm = ASSEMBLIES.find((item) => item.id === tokenAt) ?? ASSEMBLIES[0]
  const [tx, ty] = project(tokenAsm.token[0], tokenAsm.token[1], tokenAsm.token[2])

  function stateFor(id: StationId): 'idle' | 'on' | 'seen' | 'deny' | 'dim' {
    if (id === 'gw' && (preset.shape === 'website' || preset.gwOff)) return 'dim'
    if (id === 'appB' && preset.bDown) return 'dim'
    if (id === 'waf' && preset.wafOff) return 'dim'
    const hit = frames.slice(0, index + 1).find((item) => item.at === id)
    if (!hit) return 'idle'
    if (hit.tone === 'deny') return 'deny'
    if (id === tokenAt) return 'on'
    return 'seen'
  }

  const detail = COPY[selected]
  const spurQuiet = preset.shape === 'website' || Boolean(preset.gwOff)
  const ordered = [...ASSEMBLIES].sort((a, b) => a.depth - b.depth)

  return (
    <div className="edge-bench">
      <div className="edge-choices" role="group" aria-label="Situations">
        {PRESETS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === preset.id ? 'edge-choice edge-choice--on' : 'edge-choice'}
            onClick={() => setPresetId(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="edge-bench__blurb" aria-live="polite">
        <span className="edge-kicker">{preset.label}</span>
        {preset.blurb}
      </p>
      <div className="edge-bench__controls">
        <button
          type="button"
          className="edge-choice edge-choice--on"
          disabled={reduced || exploded}
          onClick={() => setPlaying((value) => !value)}
        >
          {playing ? 'Pause' : 'Run'}
        </button>
        <button
          type="button"
          className="edge-choice"
          onClick={() => setFrame((value) => Math.min(frames.length - 1, value + 1))}
        >
          Step
        </button>
        <button type="button" className="edge-choice" onClick={() => setExploded((value) => !value)}>
          {exploded ? 'Assemble' : 'Explode'}
        </button>
        <button
          type="button"
          className="edge-choice"
          onClick={() => {
            setFrame(0)
            setPlaying(false)
            setExploded(false)
          }}
        >
          Reset
        </button>
        <span className="edge-kicker">
          Step {index + 1} of {frames.length}
        </span>
      </div>

      <div className="edge-bench__stage">
        <svg className="edge-bench__svg" viewBox="0 0 940 680" role="img" aria-label="Request bench">
          <g className="edge-chassis">
            <Solid x={0} y={0} z={0} w={13.2} d={9.35} h={0.46} shadow />
            <Solid x={0.35} y={0.35} z={0.46} w={12.5} d={8.65} h={0.06} className="edge-solid--deck" />
            {[
              [0.62, 0.62],
              [12.4, 0.62],
              [0.62, 8.55],
              [12.4, 8.55],
            ].map(([x, y]) => (
              <Cylinder key={`${x}-${y}`} x={x} y={y} z={0.52} r={0.11} h={0.08} className="edge-cyl--screw" />
            ))}
          </g>
          {!exploded &&
            HOSES.map((hose) => (
              <Hose
                key={hose.id}
                points={hose.points}
                quiet={(hose.quiet === 'spur' && spurQuiet) || (hose.quiet === 'b' && (spurQuiet || Boolean(preset.bDown)))}
              />
            ))}
          {ordered.map((asm) => (
            <AssemblyView
              key={asm.id}
              asm={asm}
              exploded={exploded}
              state={stateFor(asm.id)}
              selected={selected === asm.id}
              onSelect={setSelected}
            />
          ))}
          {ordered.map((asm) => {
            const [ox, oy] = shiftOf(asm, exploded)
            const state = stateFor(asm.id)
            return (
              <g key={asm.id} className={`edge-asm edge-asm--${state}${selected === asm.id ? ' edge-asm--selected' : ''}`}>
                <Plate x={asm.plate[0] + ox} y={asm.plate[1] + oy} z={asm.plate[2]} text={asm.label} />
              </g>
            )
          })}
          {!exploded && (
            <g className={current?.tone === 'deny' ? 'edge-token edge-token--deny' : 'edge-token'}>
              <rect x={tx - 9} y={ty - 16} width={18} height={12} rx={1.5} />
            </g>
          )}
        </svg>
        <p className="edge-bench__status" aria-live="polite">
          <span className="edge-kicker">{current?.at ?? 'request'}</span>
          {current?.text}
        </p>
      </div>

      <div className="edge-read">
        <div>
          <h4>
            {station(selected).kicker} · {station(selected).label} · Plain
          </h4>
          <p>{detail.plain}</p>
        </div>
        <div>
          <h4>Sharp</h4>
          <p>{detail.sharp}</p>
        </div>
      </div>
    </div>
  )
}
