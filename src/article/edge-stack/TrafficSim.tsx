import { useEffect, useMemo, useState } from 'react'
import { useReducedMotion } from './useReducedMotion'

type Shape = 'website' | 'api'
type Tone = 'run' | 'deny' | 'ok' | 'skip'
type ServerName = 'A' | 'B' | 'C'

type Step = {
  hop: string
  text: string
  tone: Tone
  server?: ServerName
}

type Script = {
  id: string
  title: string
  steps: Step[]
}

const SERVERS: ServerName[] = ['A', 'B', 'C']

function buildScripts(shape: Shape, serverBDown: boolean): Script[] {
  let cursor = 0
  const pick = (): ServerName | null => {
    for (let i = 0; i < SERVERS.length; i += 1) {
      const name = SERVERS[(cursor + i) % SERVERS.length]
      if (serverBDown && name === 'B') continue
      cursor = (SERVERS.indexOf(name) + 1) % SERVERS.length
      return name
    }
    return null
  }

  const page = (): Script => {
    if (shape === 'api') {
      return {
        id: 'page',
        title: 'GET /pricing',
        steps: [
          { hop: 'Client', text: 'A browser asks for a public page.', tone: 'run' },
          {
            hop: 'WAF',
            text: 'The WAF parses the HTTP request. No exploit pattern, so it continues.',
            tone: 'run',
          },
          {
            hop: 'API gateway',
            text: 'This path is not an API route. The gateway returns 404. The services stay idle.',
            tone: 'deny',
          },
        ],
      }
    }
    const server = pick()
    return {
      id: 'page',
      title: 'GET /pricing',
      steps: [
        { hop: 'Client', text: 'A browser asks for a public page.', tone: 'run' },
        {
          hop: 'WAF',
          text: 'The WAF parses the HTTP request. No exploit pattern, so it continues.',
          tone: 'run',
        },
        {
          hop: 'Load balancer',
          text: server
            ? `Least-connections picks app ${server}. ${serverBDown ? 'B is out of the pool.' : 'A, B, and C are healthy.'}`
            : 'No healthy target. The balancer returns 503.',
          tone: server ? 'run' : 'deny',
          server: server ?? undefined,
        },
        ...(server
          ? [
              {
                hop: `App ${server}`,
                text: 'The app renders the page. Login, if any, is the app’s own session.',
                tone: 'ok' as Tone,
                server,
              },
            ]
          : []),
      ],
    }
  }

  const attack = (): Script => ({
    id: 'attack',
    title: "GET /search?q=' OR 1=1",
    steps: [
      { hop: 'Client', text: 'A scanner sends a SQL-injection probe.', tone: 'run' },
      {
        hop: 'WAF',
        text: 'The signature matches. 403. The balancer, the gateway, and the app never see this request.',
        tone: 'deny',
      },
    ],
  })

  const goodApi = (): Script => {
    const server = pick()
    const afterGateway: Step[] =
      shape === 'api'
        ? [
            {
              hop: 'API gateway',
              text: 'The key maps to consumer partner-app. This minute’s quota still has room.',
              tone: 'run',
            },
            {
              hop: 'Internal LB',
              text: server
                ? `The private balancer sends the call to task ${server}.`
                : 'No healthy task behind the gateway. 503.',
              tone: server ? 'run' : 'deny',
              server: server ?? undefined,
            },
            ...(server
              ? [
                  {
                    hop: `Service ${server}`,
                    text: 'The handler checks that partner-app owns this resource, then returns 200.',
                    tone: 'ok' as Tone,
                    server,
                  },
                ]
              : []),
          ]
        : [
            {
              hop: 'Load balancer',
              text: server
                ? `No gateway on this shape. The public balancer forwards to app ${server}.`
                : 'No healthy app. 503.',
              tone: server ? 'run' : 'deny',
              server: server ?? undefined,
            },
            ...(server
              ? [
                  {
                    hop: `App ${server}`,
                    text: 'The app validates the token itself. That check is copy-pasted into every service on this shape.',
                    tone: 'ok' as Tone,
                    server,
                  },
                ]
              : []),
          ]

    return {
      id: 'good-api',
      title: 'GET /v1/orders  (valid key)',
      steps: [
        { hop: 'Client', text: 'A partner app calls the orders API with its key.', tone: 'run' },
        {
          hop: 'WAF',
          text: 'A valid key is not a reason to skip the WAF. The HTTP itself looks fine.',
          tone: 'run',
        },
        ...afterGateway,
      ],
    }
  }

  const anon = (): Script => ({
    id: 'anon',
    title: 'POST /v1/orders  (no key)',
    steps: [
      { hop: 'Client', text: 'A call arrives with no API key and no token.', tone: 'run' },
      {
        hop: 'WAF',
        text: 'Missing credentials are not an exploit signature. The WAF lets it through.',
        tone: 'run',
      },
      shape === 'api'
        ? {
            hop: 'API gateway',
            text: 'key-auth fails. 401. The quota is not spent, and no task is contacted.',
            tone: 'deny',
          }
        : {
            hop: 'App',
            text: 'The balancer already chose a process. The app returns 401. Every replica had to implement that check.',
            tone: 'deny',
            server: pick() ?? undefined,
          },
    ],
  })

  return [page(), attack(), goodApi(), anon()]
}

export function TrafficSim() {
  const reduced = useReducedMotion()
  const [shape, setShape] = useState<Shape>('api')
  const [serverBDown, setServerBDown] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [frame, setFrame] = useState(0)

  const scripts = useMemo(() => buildScripts(shape, serverBDown), [shape, serverBDown])
  const frames = useMemo(
    () =>
      scripts.flatMap((script, packet) => script.steps.map((_, step) => ({ packet, step }))),
    [scripts],
  )
  const cursor = frames[Math.min(frame, frames.length - 1)] ?? frames[0]
  const packetIndex = cursor?.packet ?? 0
  const stepIndex = cursor?.step ?? 0
  const packet = scripts[packetIndex] ?? scripts[0]
  const stepCount = frames.length
  const stepNumber = Math.min(frame, frames.length - 1) + 1

  useEffect(() => {
    setFrame(0)
    setPlaying(false)
  }, [shape, serverBDown])

  useEffect(() => {
    if (!playing || reduced) return
    if (frame >= frames.length - 1) {
      setPlaying(false)
      return
    }
    const id = window.setTimeout(() => setFrame((current) => current + 1), 1100)
    return () => window.clearTimeout(id)
  }, [playing, reduced, frame, frames.length])

  function reset() {
    setPlaying(false)
    setFrame(0)
  }

  function advance() {
    setFrame((current) => Math.min(frames.length - 1, current + 1))
  }

  const served: Record<ServerName, number> = { A: 0, B: 0, C: 0 }
  let blockedWaf = 0
  let stoppedGateway = 0
  for (let p = 0; p < scripts.length; p += 1) {
    const last = p < packetIndex ? scripts[p].steps.length - 1 : p === packetIndex ? stepIndex : -1
    for (let s = 0; s <= last; s += 1) {
      const step = scripts[p].steps[s]
      if (step.tone === 'ok' && step.server) served[step.server] += 1
      if (step.tone === 'deny' && step.hop === 'WAF') blockedWaf += 1
      if (step.tone === 'deny' && step.hop === 'API gateway') stoppedGateway += 1
    }
  }

  const chips =
    shape === 'api'
      ? ['Client', 'WAF', 'API gateway', 'Internal LB', 'Service']
      : ['Client', 'WAF', 'Load balancer', 'App']

  return (
    <div className="edge-sim">
      <div className="edge-sim__controls">
        <div className="edge-choices" role="group" aria-label="Deployment shape">
          <button
            type="button"
            className={shape === 'website' ? 'edge-choice edge-choice--on' : 'edge-choice'}
            onClick={() => setShape('website')}
          >
            Website
          </button>
          <button
            type="button"
            className={shape === 'api' ? 'edge-choice edge-choice--on' : 'edge-choice'}
            onClick={() => setShape('api')}
          >
            API platform
          </button>
        </div>
        <label className="edge-check">
          <input
            type="checkbox"
            checked={serverBDown}
            onChange={(event) => setServerBDown(event.target.checked)}
          />
          Server B is down
        </label>
        <div className="edge-choices">
          <button
            type="button"
            className="edge-choice edge-choice--on"
            onClick={() => (playing ? setPlaying(false) : setPlaying(true))}
            disabled={reduced}
          >
            {playing ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="edge-choice" onClick={advance}>
            Step
          </button>
          <button type="button" className="edge-choice" onClick={reset}>
            Reset
          </button>
        </div>
      </div>

      <p className="edge-sim__meta">
        <span className="edge-kicker">
          Step {Math.min(stepNumber, stepCount)} of {stepCount}
        </span>
        <span className="edge-sim__title">{packet.title}</span>
      </p>

      <ol className="edge-chips" aria-label="Hops in this shape">
        {chips.map((chip) => {
          const active = packet.steps[stepIndex]?.hop.startsWith(chip.split(' ')[0] ?? chip)
          return (
            <li key={chip} className={active ? 'edge-chip edge-chip--on' : 'edge-chip'}>
              {chip}
            </li>
          )
        })}
      </ol>

      <ol className="edge-trace">
        {packet.steps.map((step, index) => {
          const state = index < stepIndex ? 'done' : index === stepIndex ? 'active' : 'wait'
          return (
            <li key={`${packet.id}-${step.hop}-${index}`} className={`edge-trace__step edge-trace__step--${state} edge-trace__step--${step.tone}`}>
              <span className="edge-trace__hop">{step.hop}</span>
              <span>{step.text}</span>
            </li>
          )
        })}
      </ol>

      <div className="edge-meters" aria-label="Where the played requests went">
        <div>
          <span className="edge-kicker">Blocked at WAF</span>
          <strong>{blockedWaf}</strong>
        </div>
        <div>
          <span className="edge-kicker">Stopped at gateway</span>
          <strong>{stoppedGateway}</strong>
        </div>
        {SERVERS.map((name) => (
          <div key={name} className={serverBDown && name === 'B' ? 'edge-meter--down' : undefined}>
            <span className="edge-kicker">Served by {name}</span>
            <strong>{served[name]}</strong>
            <span
              className="edge-meter__bar"
              style={{ transform: `scaleX(${Math.min(served[name], 3) / 3})` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
