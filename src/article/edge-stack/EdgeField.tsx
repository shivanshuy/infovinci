import { useEffect, useMemo, useRef, useState } from 'react'
import { FieldScene, type FieldCamera, type FieldStation, type FieldTone } from './fieldScene'
import { useReducedMotion } from './useReducedMotion'

type Kind = 'page' | 'attack' | 'api' | 'anon'

type Frame = { at: FieldStation; tone: FieldTone; text: string }

type Preset = {
  id: string
  label: string
  short: string
  kind: Kind
  shape: 'website' | 'api'
  blurb: string
  wafOff?: boolean
  gwOff?: boolean
  bDown?: boolean
}

const STATIONS: { id: FieldStation; label: string; ms: number }[] = [
  { id: 'request', label: 'Request', ms: 1 },
  { id: 'waf', label: 'WAF', ms: 4 },
  { id: 'lb', label: 'Balancer', ms: 2 },
  { id: 'gw', label: 'Gateway', ms: 7 },
  { id: 'appA', label: 'App A', ms: 18 },
  { id: 'appB', label: 'App B', ms: 18 },
]

const PRESETS: Preset[] = [
  {
    id: 'page',
    label: 'Healthy page',
    short: 'Page',
    kind: 'page',
    shape: 'website',
    blurb:
      'A browser asks for a public page. The WAF lets it through, the balancer picks App A, and the app renders the page. The gateway stays out of this run.',
  },
  {
    id: 'attack',
    label: 'SQL injection',
    short: 'SQLi',
    kind: 'attack',
    shape: 'website',
    blurb:
      "GET /search?q=' OR 1=1. The WAF returns 403. The balancer, both apps, and the gateway are never contacted.",
  },
  {
    id: 'open',
    label: 'WAF open',
    short: 'WAF open',
    kind: 'attack',
    shape: 'website',
    wafOff: true,
    blurb:
      'The same probe with the filter open. The balancer delivers it to App A. The exploit has already reached a running process.',
  },
  {
    id: 'api',
    label: 'API call',
    short: 'API',
    kind: 'api',
    shape: 'api',
    blurb:
      'GET /v1/orders with a valid key. The WAF lets it through, the gateway checks the key and the quota, and App B returns 200 after the ownership check.',
  },
  {
    id: 'anon',
    label: 'No key',
    short: 'No key',
    kind: 'anon',
    shape: 'api',
    blurb: 'The same API call with no key. The gateway returns 401. No app process is used.',
  },
  {
    id: 'nogw',
    label: 'No gateway',
    short: 'No GW',
    kind: 'anon',
    shape: 'api',
    gwOff: true,
    blurb:
      'No key, and the gateway is gone. The balancer has already chosen App A, and the handler returns 401. A worker was spent on a caller with no key.',
  },
  {
    id: 'down',
    label: 'Server B down',
    short: 'B down',
    kind: 'api',
    shape: 'api',
    bDown: true,
    blurb:
      'A valid API call, but App B failed its health check. The gateway still checks the key. The balancer skips B and App A returns 200.',
  },
]

const CAMERAS: { id: FieldCamera; label: string }[] = [
  { id: 'iso', label: 'Iso' },
  { id: 'front', label: 'Front' },
  { id: 'top', label: 'Top' },
]

function stationLabel(id: FieldStation) {
  return STATIONS.find((item) => item.id === id)?.label ?? id
}

function buildFrames(preset: Preset): Frame[] {
  const frames: Frame[] = []
  const push = (at: FieldStation, tone: FieldTone, text: string) => frames.push({ at, tone, text })
  const target: FieldStation = preset.bDown || preset.kind !== 'api' ? 'appA' : 'appB'
  const which = target === 'appA' ? 'App A' : 'App B'
  const { kind, wafOff, gwOff, bDown, shape } = preset

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
    push('waf', 'deny', 'Signature matches. 403. Stopped at the WAF. The balancer is not contacted.')
    return frames
  }

  push(
    'waf',
    wafOff && kind === 'attack' ? 'skip' : 'run',
    wafOff && kind === 'attack' ? 'The filter is open. The probe continues.' : 'The HTTP looks ordinary. It continues.',
  )

  push(
    'lb',
    'run',
    `Picks ${which}.${bDown ? ' Server B failed its health check.' : ' Both apps are healthy.'}`,
  )

  if (shape === 'api' && !gwOff) {
    if (kind === 'anon') {
      push('gw', 'deny', 'No key. 401. Stopped at the API gateway. No app process is used.')
      return frames
    }
    push('gw', 'run', 'Key maps to a consumer. This minute’s quota has room.')
  } else if (shape === 'api' && gwOff) {
    push('gw', 'skip', 'Gateway removed. The next hop is the app, which must check the caller itself.')
  }

  if (kind === 'attack') {
    push(target, 'deny', 'The probe reached a live process. The balancer only knew the process was up.')
    return frames
  }

  if (kind === 'anon') {
    push(target, 'deny', 'The handler returns 401. A worker was already chosen.')
    return frames
  }

  push(
    target,
    'ok',
    shape === 'api'
      ? `Handler checks that this caller owns the order, then returns 200. Served by ${which}.`
      : `The app renders the page. Served by ${which}.`,
  )
  return frames
}

function dimOf(frames: Frame[]): FieldStation[] {
  const seen = new Set(frames.map((frame) => frame.at))
  const skipped = new Set(frames.filter((frame) => frame.tone === 'skip').map((frame) => frame.at))
  return STATIONS.map((item) => item.id).filter((id) => id !== 'request' && (!seen.has(id) || skipped.has(id)))
}

function readout(frame: Frame, preset: Preset): { code: string; label: string; mood: 'run' | 'deny' | 'ok' } {
  if (frame.tone === 'deny' && frame.at === 'waf') return { code: '403', label: 'Blocked at the WAF', mood: 'deny' }
  if (frame.tone === 'deny' && frame.at === 'gw') return { code: '401', label: 'Stopped at the gateway', mood: 'deny' }
  if (frame.tone === 'deny' && preset.kind === 'attack') {
    return { code: 'App', label: 'Probe reached the process', mood: 'deny' }
  }
  if (frame.tone === 'deny') return { code: '401', label: 'Rejected in the app', mood: 'deny' }
  if (frame.tone === 'ok') return { code: '200', label: frame.at === 'appB' ? 'Served by App B' : 'Served by App A', mood: 'ok' }
  if (frame.tone === 'skip' && frame.at === 'waf') return { code: 'Open', label: 'Filter is not in this run', mood: 'deny' }
  if (frame.tone === 'skip') return { code: 'Open', label: 'Gateway is not in this run', mood: 'deny' }
  if (frame.at === 'request') return { code: 'In', label: 'Request on the floor', mood: 'run' }
  if (frame.at === 'waf') return { code: 'WAF', label: 'Reading the HTTP', mood: 'run' }
  if (frame.at === 'lb') return { code: 'LB', label: 'Choosing a healthy process', mood: 'run' }
  if (frame.at === 'gw') return { code: 'GW', label: 'Checking key and quota', mood: 'run' }
  return { code: frame.at === 'appB' ? 'B' : 'A', label: 'Inside the handler', mood: 'run' }
}

function statusWord(tone: FieldTone) {
  if (tone === 'deny') return 'Blocked'
  if (tone === 'ok') return 'Served'
  if (tone === 'skip') return 'Bypassed'
  return 'In flight'
}

export function EdgeField() {
  const reduced = useReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<FieldScene | null>(null)
  const [presetId, setPresetId] = useState(PRESETS[0].id)
  const [frameIndex, setFrameIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [isolated, setIsolated] = useState<FieldStation | null>(null)
  const [exploded, setExploded] = useState(false)
  const [camera, setCamera] = useState<FieldCamera>('iso')

  const preset = PRESETS.find((item) => item.id === presetId) ?? PRESETS[0]
  const frames = useMemo(() => buildFrames(preset), [preset])
  const frame = frames[Math.min(frameIndex, frames.length - 1)]
  const read = readout(frame, preset)
  const dim = useMemo(() => dimOf(frames), [frames])
  const reached = new Set(frames.slice(0, frameIndex + 1).map((item) => item.at))
  const spent = STATIONS.reduce((sum, item) => (reached.has(item.id) ? sum + item.ms : sum), 0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const scene = new FieldScene(canvas, (id) => {
      setIsolated((current) => (current === id ? null : id))
    })
    sceneRef.current = scene
    return () => {
      scene.dispose()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    sceneRef.current?.setView({
      active: frame.at,
      tone: frame.tone,
      dim,
      isolated,
      exploded,
      snap: reduced,
    })
  }, [frame.at, frame.tone, dim, isolated, exploded, reduced])

  useEffect(() => {
    sceneRef.current?.setCamera(camera)
  }, [camera])

  useEffect(() => {
    setPlaying(!reduced)
  }, [reduced])

  useEffect(() => {
    if (!playing || reduced) return
    const timer = window.setTimeout(() => {
      setFrameIndex((current) => (current + 1) % frames.length)
    }, 900)
    return () => window.clearTimeout(timer)
  }, [playing, reduced, frameIndex, frames.length])

  function choosePreset(id: string) {
    setPresetId(id)
    setFrameIndex(0)
    setPlaying(!reduced)
  }

  const chart = frames.map((item, index) => {
    const y = STATIONS.findIndex((station) => station.id === item.at)
    const x = frames.length === 1 ? 8 : 8 + (index / (frames.length - 1)) * 112
    return { x, y: 10 + y * 14, index }
  })

  return (
    <div className="edge-field-scroll">
      <div className="edge-field">
        <header className="edge-field__bar">
          <span className="edge-kicker">Edge stack</span>
          <strong>Field simulator</strong>
          <span className={`edge-field__status edge-field__status--${frame.tone}`}>{statusWord(frame.tone)}</span>
        </header>

        <div className="edge-field__body">
          <aside className="edge-field__col" aria-label="Telemetry">
            <p className="edge-kicker">Status</p>
            <p className={`edge-field__code edge-field__code--${read.mood}`}>{read.code}</p>
            <p className="edge-field__read">{read.label}</p>
            <p className="edge-kicker">Hop trace</p>
            <svg className="edge-field__chart" viewBox="0 0 128 100" role="img" aria-label="Which hop this call is on">
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                points={chart.map((point) => `${point.x},${point.y}`).join(' ')}
              />
              {chart.map((point) => (
                <circle
                  key={point.index}
                  cx={point.x}
                  cy={point.y}
                  r={point.index === frameIndex ? 3.2 : 1.7}
                  className={point.index === frameIndex ? 'edge-field__dot edge-field__dot--on' : 'edge-field__dot'}
                />
              ))}
            </svg>
            <p className="edge-kicker">Illustrative time</p>
            <p className="edge-field__ms">{spent} ms</p>
            <ul className="edge-field__bars">
              {STATIONS.filter((item) => item.id !== 'request').map((item) => (
                <li key={item.id}>
                  <span>{item.label}</span>
                  <span className="edge-field__track">
                    <span
                      className={reached.has(item.id) ? 'edge-field__fill edge-field__fill--on' : 'edge-field__fill'}
                      style={{ width: reached.has(item.id) ? '100%' : '0%' }}
                    />
                  </span>
                  <span>{reached.has(item.id) ? item.ms : '—'}</span>
                </li>
              ))}
            </ul>
          </aside>

          <div className="edge-field__stage">
            <canvas ref={canvasRef} aria-label="Request path machine. Drag to orbit. Click a block to lift it." />
            <p className="edge-field__orbit">Drag to orbit</p>
          </div>

          <aside className="edge-field__col" aria-label="Controls">
            <p className="edge-kicker">Simulation</p>
            <div className="edge-field__row">
              <button type="button" className="edge-choice" onClick={() => setPlaying((value) => !value)}>
                {playing ? 'Pause' : 'Run'}
              </button>
              <button
                type="button"
                className="edge-choice"
                onClick={() => {
                  setPlaying(false)
                  setFrameIndex(0)
                }}
              >
                Reset
              </button>
            </div>
            <p className="edge-kicker">Pattern</p>
            <div className="edge-field__patterns">
              {PRESETS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={item.id === preset.id ? 'edge-choice edge-choice--on' : 'edge-choice'}
                  onClick={() => choosePreset(item.id)}
                >
                  {item.short}
                </button>
              ))}
            </div>
            <p className="edge-kicker">Camera</p>
            <div className="edge-field__row">
              {CAMERAS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={item.id === camera ? 'edge-choice edge-choice--on' : 'edge-choice'}
                  onClick={() => setCamera(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="edge-kicker">Subsystems</p>
            <div className="edge-field__patterns">
              {STATIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={isolated === item.id ? 'edge-choice edge-choice--on' : 'edge-choice'}
                  onClick={() => setIsolated((current) => (current === item.id ? null : item.id))}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="edge-kicker">Display</p>
            <button
              type="button"
              className={exploded ? 'edge-choice edge-choice--on' : 'edge-choice'}
              onClick={() => setExploded((value) => !value)}
            >
              {exploded ? 'Assembled' : 'Exploded'}
            </button>
          </aside>
        </div>

        <footer className="edge-field__log">
          <p>
            <span className="edge-kicker">{preset.label}</span>
            {preset.blurb}
          </p>
          <p className="edge-field__now">
            <span className="edge-kicker">
              {frameIndex + 1} / {frames.length}
            </span>
            {frame.text}
          </p>
          <ol className="edge-field__strip">
            {frames.map((item, index) => (
              <li key={`${item.at}-${index}`}>
                <button
                  type="button"
                  className={index === frameIndex ? 'edge-choice edge-choice--on' : 'edge-choice'}
                  onClick={() => {
                    setPlaying(false)
                    setFrameIndex(index)
                  }}
                >
                  {index + 1} {stationLabel(item.at)}
                </button>
              </li>
            ))}
          </ol>
          <input
            className="edge-field__scrub"
            type="range"
            min={0}
            max={Math.max(0, frames.length - 1)}
            value={Math.min(frameIndex, frames.length - 1)}
            aria-label="Scrub the request"
            onChange={(event) => {
              setPlaying(false)
              setFrameIndex(Number(event.target.value))
            }}
          />
        </footer>
      </div>
    </div>
  )
}
