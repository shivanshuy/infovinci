import { useEffect, useState } from 'react'

type NodeId = 'user' | 'client' | 'harbor'

type Beat = {
  id: string
  title: string
  line: string
  from: NodeId
  to: NodeId
  lane: 'left' | 'right' | 'inside'
  tag: string
  tone: 'chat' | 'card' | 'a2a' | 'art' | 'fog'
  payload: string
}

const BEATS: Beat[] = [
  {
    id: 'ask',
    title: 'Priya taps send',
    line: 'A short chat leaves her phone for her travel agent. This is not A2A yet — it is just her app talking to her agent.',
    from: 'user',
    to: 'client',
    lane: 'left',
    tag: 'chat → agent',
    tone: 'chat',
    payload: `Priya → her agent

"Quiet double at Harbor,
Lisbon, 12–15 May, two of us."

(app chat — not on the A2A wire)`,
  },
  {
    id: 'card',
    title: 'The door card rides the wire',
    line: 'Her agent does not invent Harbor. It fetches the Agent Card. Click the packet to read what came back.',
    from: 'harbor',
    to: 'client',
    lane: 'right',
    tag: 'Agent Card',
    tone: 'card',
    payload: `GET /.well-known/agent-card.json
Host: hotel.example

{
  "name": "Harbor Hotel Agent",
  "supportedInterfaces": [
    {
      "url": "https://hotel.example/a2a",
      "protocolBinding": "JSONRPC",
      "protocolVersion": "1.0"
    }
  ],
  "capabilities": { "streaming": true },
  "skills": [{ "id": "book-room", "name": "Book a room" }]
}`,
  },
  {
    id: 'send',
    title: 'SendMessage leaves her agent',
    line: 'Now it is A2A. Her agent wraps Priya’s ask as parts and posts it to Harbor’s endpoint.',
    from: 'client',
    to: 'harbor',
    lane: 'right',
    tag: 'SendMessage',
    tone: 'a2a',
    payload: `POST https://hotel.example/a2a
method: SendMessage

{
  "message": {
    "messageId": "3f1c0a2e-…",
    "role": "ROLE_USER",
    "parts": [
      { "text": "Hold a quiet double in Lisbon…" },
      {
        "data": {
          "city": "Lisbon",
          "checkIn": "2026-05-12",
          "checkOut": "2026-05-15",
          "adults": 2
        }
      }
    ]
  }
}`,
  },
  {
    id: 'fog',
    title: 'Harbor works alone',
    line: 'Harbor checks rooms with its own tools. Priya’s agent sees nothing of that. The gap is the product.',
    from: 'harbor',
    to: 'harbor',
    lane: 'inside',
    tag: 'private tools',
    tone: 'fog',
    payload: `(not on the wire)

Harbor’s tools:
  · courtyard inventory
  · wedding calendar
  · rate rules

A2A does not send this side.
You hired an agent. You do not watch its steps.`,
  },
  {
    id: 'task',
    title: 'A task rides back',
    line: 'Harbor answers with a task id and WORKING — not a confirmation yet. Click the packet for the JSON.',
    from: 'harbor',
    to: 'client',
    lane: 'right',
    tag: 'Task · WORKING',
    tone: 'a2a',
    payload: `{
  "result": {
    "task": {
      "id": "7c2a9e14-…",
      "contextId": "ctx-lisbon-priya",
      "status": { "state": "TASK_STATE_WORKING" }
    }
  }
}`,
  },
  {
    id: 'tell',
    title: 'Her agent tells Priya',
    line: 'A calm status back to the phone. Still no hotel password. Still no Harbor internals.',
    from: 'client',
    to: 'user',
    lane: 'left',
    tag: 'status → Priya',
    tone: 'chat',
    payload: `her agent → Priya

"Harbor has the job.
I’m watching it.
Room not confirmed yet."

(app chat again — not A2A)`,
  },
  {
    id: 'art',
    title: 'The artifact returns',
    line: 'When Harbor finishes, the confirmation travels as an artifact. That is the result her agent may show.',
    from: 'harbor',
    to: 'client',
    lane: 'right',
    tag: 'Artifact H-1842',
    tone: 'art',
    payload: `{
  "task": {
    "id": "7c2a9e14-…",
    "status": { "state": "TASK_STATE_COMPLETED" },
    "artifacts": [
      {
        "artifactId": "art-hold-1842",
        "name": "confirmation",
        "parts": [
          {
            "data": {
              "code": "H-1842",
              "heldUntil": "18:00"
            }
          }
        ]
      }
    ]
  }
}`,
  },
]

const SPEEDS = [
  { id: 'slow', label: 'Slow', ms: 1600 },
  { id: 'normal', label: 'Normal', ms: 900 },
  { id: 'fast', label: 'Fast', ms: 420 },
] as const

export function A2aWireBoard() {
  const [step, setStep] = useState(0)
  const [flying, setFlying] = useState(false)
  const [open, setOpen] = useState(true)
  const [speedIdx, setSpeedIdx] = useState(1)
  const [auto, setAuto] = useState(false)
  const beat = BEATS[step]
  const speed = SPEEDS[speedIdx]
  const dwell = Math.round(speed.ms * 0.85) + 700

  useEffect(() => {
    setFlying(true)
    setOpen(true)
    const t = window.setTimeout(() => setFlying(false), speed.ms)
    return () => window.clearTimeout(t)
  }, [step, speed.ms])

  useEffect(() => {
    if (!auto) return
    const t = window.setTimeout(() => {
      setStep((current) => (current >= BEATS.length - 1 ? 0 : current + 1))
    }, speed.ms + dwell)
    return () => window.clearTimeout(t)
  }, [auto, step, speed.ms, dwell])

  const go = (next: number) => {
    setAuto(false)
    setStep(Math.max(0, Math.min(BEATS.length - 1, next)))
  }

  const active = (id: NodeId) => beat.from === id || beat.to === id

  return (
    <div className="iv-wire" aria-label="Packets traveling on the A2A wire">
      <div className="iv-wire__top">
        <div>
          <p className="iv-wire__kicker">On the wire</p>
          <p className="iv-wire__title">{beat.title}</p>
          <p className="iv-wire__line">{beat.line}</p>
        </div>
        <div className="iv-wire__controls">
          <div className="iv-wire__speeds" role="group" aria-label="Animation speed">
            {SPEEDS.map((item, i) => (
              <button
                key={item.id}
                type="button"
                className={i === speedIdx ? 'is-on' : undefined}
                onClick={() => setSpeedIdx(i)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="iv-wire__nav">
            <button
              type="button"
              className={auto ? 'iv-wire__auto is-on' : 'iv-wire__auto'}
              aria-pressed={auto}
              onClick={() => setAuto((on) => !on)}
            >
              {auto ? 'Pause' : 'Auto'}
            </button>
            <button type="button" onClick={() => go(step - 1)} disabled={step === 0}>
              Back
            </button>
            <button
              type="button"
              className="iv-wire__next"
              onClick={() => go(step === BEATS.length - 1 ? 0 : step + 1)}
            >
              {step === BEATS.length - 1 ? 'Replay' : 'Next packet'}
            </button>
          </div>
        </div>
      </div>

      <ol className="iv-wire__rail" aria-label="Steps">
        {BEATS.map((item, i) => (
          <li key={item.id}>
            <button
              type="button"
              className={i === step ? 'is-on' : i < step ? 'is-done' : undefined}
              onClick={() => go(i)}
            >
              <span>{i + 1}</span>
              {item.tag}
            </button>
          </li>
        ))}
      </ol>

      <div className="iv-wire__stage" style={{ ['--iv-fly' as string]: `${speed.ms}ms` }}>
        <div className={`iv-wire__node${active('user') ? ' is-lit' : ''}`}>
          <svg viewBox="0 0 64 84" aria-hidden>
            <circle cx="32" cy="18" r="11" fill="color-mix(in srgb, var(--accent) 35%, #f3d2b5)" />
            <path d="M16 32c0 24 5 42 16 42s16-18 16-42z" fill="var(--fg)" />
          </svg>
          <strong>Priya</strong>
          <span>traveler</span>
        </div>

        <div className="iv-wire__lane" aria-hidden={beat.lane !== 'left'}>
          <span className="iv-wire__track" />
          {beat.lane === 'left' ? (
            <button
              type="button"
              className={`iv-wire__pkt iv-wire__pkt--${beat.tone}${flying ? ' is-fly' : ' is-land'}${beat.from === 'client' ? ' is-rev' : ''}`}
              onClick={() => setOpen(true)}
            >
              {beat.tag}
            </button>
          ) : null}
        </div>

        <div className={`iv-wire__node${active('client') ? ' is-lit' : ''}`}>
          <svg viewBox="0 0 64 84" aria-hidden>
            <rect x="12" y="20" width="40" height="30" rx="8" fill="var(--accent)" />
            <rect x="20" y="28" width="24" height="12" rx="4" fill="var(--fg)" />
            <path d="M18 50h28c0 22-5 34-14 34S18 72 18 50z" fill="color-mix(in srgb, var(--accent) 55%, var(--fg))" />
          </svg>
          <strong>Her agent</strong>
          <span>A2A client</span>
        </div>

        <div className="iv-wire__lane" aria-hidden={beat.lane !== 'right' && beat.lane !== 'inside'}>
          <span className="iv-wire__track" />
          {beat.lane === 'right' ? (
            <button
              type="button"
              className={`iv-wire__pkt iv-wire__pkt--${beat.tone}${flying ? ' is-fly' : ' is-land'}${beat.from === 'harbor' ? ' is-rev' : ''}`}
              onClick={() => setOpen(true)}
            >
              {beat.tag}
            </button>
          ) : null}
          {beat.lane === 'inside' ? (
            <button type="button" className="iv-wire__fog" onClick={() => setOpen(true)}>
              {beat.tag}
            </button>
          ) : null}
        </div>

        <div className={`iv-wire__node${active('harbor') ? ' is-lit' : ''}${beat.lane === 'inside' ? ' is-busy' : ''}`}>
          <svg viewBox="0 0 64 84" aria-hidden>
            <rect x="12" y="20" width="40" height="30" rx="8" fill="var(--paper)" stroke="var(--border-strong)" />
            <rect x="20" y="28" width="24" height="12" rx="4" fill="var(--fg)" />
            <path d="M18 50h28c0 22-5 34-14 34S18 72 18 50z" fill="var(--fg)" />
          </svg>
          <strong>Harbor</strong>
          <span>remote agent</span>
        </div>
      </div>

      <p className="iv-wire__hint">
        {auto ? 'Auto is on — Pause to stop, or click a packet.' : flying ? 'Packet in flight…' : 'Click the packet, Next, or Auto.'}
      </p>

      {open ? (
        <aside className="iv-wire__panel" aria-live="polite">
          <div className="iv-wire__panel-head">
            <p>{beat.tag}</p>
            <button type="button" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          <pre>{beat.payload}</pre>
        </aside>
      ) : null}
    </div>
  )
}
