import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useReducedMotion } from '../edge-stack/useReducedMotion'
import '../edge-stack/edge-stack.css'
import './a2a.css'
import { A2aWireBoard } from './A2aWireBoard'
import { createA2aHireScene, type HireStep } from './a2aHireScene'

const STEPS: { id: HireStep; label: string; body: string; code: string }[] = [
  {
    id: 'idle',
    label: 'Reset',
    body: 'Two companies, two agents. Priya’s travel agent is on the left. Harbor’s hotel agent is on the right. They do not share memory or tools.',
    code: `# No shared database. No shared tools.
# A2A is the hire language between them.`,
  },
  {
    id: 'card',
    label: 'Read Agent Card',
    body: 'Priya’s agent fetches Harbor’s Agent Card — a public JSON file that says what Harbor can do, where to call it, and how to sign in. Think of it as the hotel’s “open for business” sign.',
    code: `GET https://hotel.example/.well-known/agent-card.json

# skills: book_room
# url: https://hotel.example/a2a
# auth: API key header`,
  },
  {
    id: 'send',
    label: 'Send the job',
    body: 'Priya’s agent sends a message: quiet double, Lisbon, 12–15 May, two adults. It does not ask for Harbor’s database password. Harbor’s tools stay inside Harbor.',
    code: `SendMessage({
  parts: [{ text: "Quiet double, Lisbon, 12-15 May, 2 adults" }]
})
# → Harbor creates task.id = "task_42"`,
  },
  {
    id: 'task',
    label: 'Wait on the task',
    body: 'Harbor may need a minute — or a day. The job stays open as a task with an id Harbor created. Priya’s agent stores that id. It can poll, subscribe, or wait.',
    code: `GetTask("task_42")
# state: working | input-required | completed | failed`,
  },
  {
    id: 'done',
    label: 'Take the result',
    body: 'Harbor returns an artifact — confirmation PDF or JSON hold. Priya’s agent never saw Harbor’s search. It only got the result of the hire.',
    code: `# state: completed
# artifacts: [ hold_confirm.pdf ]`,
  },
]

const VS = [
  {
    id: 'mcp',
    title: 'MCP',
    body: 'Your agent calls a tool you trust — calendar, database, file. You see the function and the result. Same company, same trust boundary.',
  },
  {
    id: 'a2a',
    title: 'A2A',
    body: 'Your agent hires another company’s agent. You ask for a room. You do not watch their search. You do not run their tools.',
  },
]

const STATES = [
  {
    id: 'working',
    label: 'Working',
    body: 'Harbor is busy. Keep the same task id. Do not start a second hire for the same ask.',
  },
  {
    id: 'input',
    label: 'Needs input',
    body: 'Harbor needs a missing fact — loyalty number, bed type. Send it on the same task id. The task is paused, not dead.',
  },
  {
    id: 'done',
    label: 'Completed',
    body: 'Artifacts are ready. A finished task stays shut. A follow-up question is a new task in the same conversation context.',
  },
  {
    id: 'fail',
    label: 'Failed / rejected',
    body: 'Harbor could not book, or said no. Read the error. Start a new task if you try again.',
  },
  {
    id: 'cancel',
    label: 'Canceled',
    body: 'You (or Harbor) stopped the job. Use CancelTask while the task is still open.',
  },
  {
    id: 'auth',
    label: 'Auth required',
    body: 'Sign in outside the chat message — OAuth or API key refresh. Then continue the same task.',
  },
]

const OPS = [
  {
    id: 'card',
    label: '1 · Agent Card',
    body: 'GET /.well-known/agent-card.json — skills, endpoint, login, streaming, push. GetExtendedAgentCard only when capabilities.extendedAgentCard is true.',
  },
  {
    id: 'send',
    label: '2 · SendMessage',
    body: 'A part is exactly one of text, raw bytes, url, or data. Harbor creates a task (or returns a finished Message) and answers.',
  },
  {
    id: 'msg',
    label: '3 · Message or Task',
    body: 'A Message is finished in one shot. A Task has task.id and contextId and stays open. Harbor owns the ticket; your agent only stores the id.',
  },
  {
    id: 'hear',
    label: '4 · Hearing updates',
    body: 'Default: wait until pause or end. Or return at once, then GetTask, SubscribeToTask (if streaming), or a push webhook. CancelTask until an ending.',
  },
  {
    id: 'pause',
    label: '5 · Pauses',
    body: 'INPUT_REQUIRED — send the missing fact on the same task id. AUTH_REQUIRED — sign in outside the message. Paused, not dead.',
  },
  {
    id: 'end',
    label: '6 · Endings',
    body: 'COMPLETED brings artifacts. FAILED, CANCELED, REJECTED also finish. A follow-up is a new task in the same contextId.',
  },
]

const PARTS = [
  {
    id: 'text',
    title: 'text',
    body: 'Plain words. The most common part for “quiet double in Lisbon…”',
    code: `{ "text": "Quiet double, Lisbon, 12–15 May, 2 adults" }`,
  },
  {
    id: 'data',
    title: 'data',
    body: 'Structured JSON. Prefer this for dates and guest counts — and for tokens, not raw emails.',
    code: `{ "data": { "city": "Lisbon", "checkIn": "2026-05-12", "adults": 2 } }`,
  },
  {
    id: 'file',
    title: 'file (bytes / url)',
    body: 'A PDF or image as raw bytes, or a URL the peer can fetch. Name it; do not dump a customer dossier.',
    code: `{ "file": { "name": "id.pdf", "mimeType": "application/pdf", "bytes": "…" } }`,
  },
]

function jump(id: string, event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault()
  const main = document.querySelector('.app__main')
  const el = document.getElementById(id)
  if (main instanceof HTMLElement && el) {
    const top = el.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop - 12
    main.scrollTop = top
  }
  history.replaceState(null, '', `#${id}`)
}

function HowTo({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="a2a-howto">
      <strong>{title}</strong>
      <ol>
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
  )
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="iv-article__pre">
      <code>{code}</code>
    </pre>
  )
}

function HireBoard() {
  const hostRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<ReturnType<typeof createA2aHireScene> | null>(null)
  const [stepId, setStepId] = useState<HireStep>('idle')
  const reduced = useReducedMotion()
  const step = STEPS.find((item) => item.id === stepId) ?? STEPS[0]

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const scene = createA2aHireScene(host)
    sceneRef.current = scene
    scene.setStep('idle')
    return () => {
      scene.dispose()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    sceneRef.current?.setStep(reduced && stepId !== 'idle' ? stepId : stepId)
  }, [stepId, reduced])

  return (
    <div>
      <HowTo
        title="Try this"
        steps={[
          'Click Read Agent Card, then Send the job, Wait on the task, and Take the result.',
          'Watch the orange packet move between the two agents in the 3D view.',
          'Read the note and the short code under the buttons.',
        ]}
      />
      <div className="edge-choices" role="group" aria-label="Hire steps">
        {STEPS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === step.id ? 'edge-choice edge-choice--on' : 'edge-choice'}
            aria-pressed={item.id === step.id}
            onClick={() => setStepId(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="a2a-stage" ref={hostRef} aria-label="3D hire scene" />
      <div className="a2a-note">
        <span className="edge-kicker">{step.label}</span>
        <p>{step.body}</p>
      </div>
      <CodeBlock code={step.code} />
    </div>
  )
}

export function A2aGuide() {
  const [vsId, setVsId] = useState(VS[1].id)
  const [stateId, setStateId] = useState(STATES[0].id)
  const [opId, setOpId] = useState(OPS[0].id)
  const [partId, setPartId] = useState(PARTS[0].id)
  const vs = VS.find((item) => item.id === vsId) ?? VS[0]
  const state = STATES.find((item) => item.id === stateId) ?? STATES[0]
  const op = OPS.find((item) => item.id === opId) ?? OPS[0]
  const part = PARTS.find((item) => item.id === partId) ?? PARTS[0]

  return (
    <div className="edge-guide">
      <p className="edge-deck">
        Priya wants a quiet room at Harbor. Her travel agent is good at trips. Harbor already has its
        own agent — with its own tools and the right to say no. A2A is how one agent hires another
        without sharing passwords or memory. This guide follows specification 1.0.0.
      </p>

      <nav className="edge-toc" aria-label="On this page">
        <a href="#a2a-intro" onClick={(event) => jump('a2a-intro', event)}>Scene</a>
        <a href="#a2a-wire" onClick={(event) => jump('a2a-wire', event)}>On the wire</a>
        <a href="#a2a-vs" onClick={(event) => jump('a2a-vs', event)}>MCP vs A2A</a>
        <a href="#a2a-hire" onClick={(event) => jump('a2a-hire', event)}>One hire</a>
        <a href="#a2a-ops" onClick={(event) => jump('a2a-ops', event)}>Spec steps</a>
        <a href="#a2a-task" onClick={(event) => jump('a2a-task', event)}>Who creates the task</a>
        <a href="#a2a-states" onClick={(event) => jump('a2a-states', event)}>Task states</a>
        <a href="#a2a-parts" onClick={(event) => jump('a2a-parts', event)}>Parts</a>
        <a href="#a2a-card" onClick={(event) => jump('a2a-card', event)}>Agent Card</a>
        <a href="#a2a-week" onClick={(event) => jump('a2a-week', event)}>This week</a>
      </nav>

      <section id="a2a-intro" aria-labelledby="a2a-intro-title">
        <span className="a2a-part">01 · Scene</span>
        <h3 id="a2a-intro-title">How does Priya’s agent ask Harbor for a room?</h3>
        <p>
          A private Harbor API works once. The next hotel has a different shape. A2A is the shared
          language: find what the other agent can do, send a job, take a result — without seeing how
          the other agent works inside.
        </p>
        <p>
          Google announced A2A on 9 April 2025. On 23 June 2025 Google donated it to the Linux
          Foundation so no single company owns the standard. AWS, Cisco, Microsoft, Salesforce, SAP,
          and ServiceNow joined. Implementations must match <code>specification/a2a.proto</code>.
          Website JSON in this guide is illustration only.
        </p>
        <p>
          Five rules shape every field name below. Agents may collaborate with no shared memory or
          tools. Use HTTP, SSE, and JSON-RPC that companies already run. Use OpenAPI-style login: API
          keys, HTTP auth, OAuth, OpenID Connect. A task may run for hours or days, with a person
          able to answer, and must keep reporting status. Content may be text, files, audio, or
          video.
        </p>
      </section>

      <section id="a2a-wire" aria-labelledby="a2a-wire-title">
        <span className="a2a-part">02 · On the wire</span>
        <h3 id="a2a-wire-title">Watch one ask travel as packets</h3>
        <p>
          Same booking story as packets on the wire. Click <strong>Next packet</strong>, or turn on{' '}
          <strong>Auto</strong>. Click a flying packet to open what traveled. Slow, Normal, or Fast
          sets the pace. Chat to Priya is not A2A — only the middle hop between her agent and Harbor
          is.
        </p>
        <HowTo
          title="Try this"
          steps={[
            'Press Auto once, or step with Next packet.',
            'Click the flying packet (or the fog bubble) to read the JSON.',
            'Notice which lane lights up — phone↔agent vs agent↔Harbor.',
          ]}
        />
        <A2aWireBoard />
      </section>

      <section id="a2a-vs" aria-labelledby="a2a-vs-title">
        <span className="a2a-part">03 · Neighbors</span>
        <h3 id="a2a-vs-title">MCP is for your tools. A2A is for another agent.</h3>
        <p>
          A2A’s job is narrow: discover what another agent can do, exchange text or files or data,
          manage a task — without seeing the other agent’s memory, state, or tools.
        </p>
        <HowTo
          title="Try this"
          steps={['Click MCP, then A2A.', 'Read the difference in one sentence each.']}
        />
        <div className="edge-choices" role="group" aria-label="Protocol neighbor">
          {VS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === vs.id ? 'edge-choice edge-choice--on' : 'edge-choice'}
              aria-pressed={item.id === vs.id}
              onClick={() => setVsId(item.id)}
            >
              {item.title}
            </button>
          ))}
        </div>
        <div className="a2a-note">
          <span className="edge-kicker">{vs.title}</span>
          <p>{vs.body}</p>
        </div>
        <p>
          Person → your agent → (MCP) your tools. Your agent → (A2A task) hotel agent → (its MCP)
          hotel systems → artifact back. The hotel agent never becomes “your tool.”
        </p>
      </section>

      <section id="a2a-hire" aria-labelledby="a2a-hire-title">
        <span className="a2a-part">04 · One hire · 3D</span>
        <h3 id="a2a-hire-title">Same booking, as two desks in space</h3>
        <p>
          The model only proposes the hire. Discovery, login, the task id, and retries live in your
          runtime — the same idea as checking tools outside the model, applied to two companies.
        </p>
        <HireBoard />
      </section>

      <section id="a2a-ops" aria-labelledby="a2a-ops-title">
        <span className="a2a-part">05 · Spec steps</span>
        <h3 id="a2a-ops-title">The same walk, as the specification names them</h3>
        <p>Spec 1.0 lists eleven operations. The booking walks six of them in this order.</p>
        <HowTo
          title="Try this"
          steps={['Click each step.', 'Match it to a packet you saw on the wire board.']}
        />
        <div className="a2a-states" role="group" aria-label="Specification steps">
          {OPS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === op.id}
              onClick={() => setOpId(item.id)}
            >
              <strong>{item.label}</strong>
            </button>
          ))}
        </div>
        <div className="a2a-note">
          <span className="edge-kicker">{op.label}</span>
          <p>{op.body}</p>
        </div>
      </section>

      <section id="a2a-task" aria-labelledby="a2a-task-title">
        <span className="a2a-part">06 · Who creates the task</span>
        <h3 id="a2a-task-title">Priya’s agent never creates the Task. Harbor does.</h3>
        <ol className="edge-refs">
          <li>
            <strong>Read the Agent Card</strong> — skills, input/output modes, where to call, how to
            sign in.
          </li>
          <li>
            <strong>Send a Message</strong> with <code>SendMessage</code> (parts that fit the card’s
            input modes).
          </li>
          <li>
            <strong>Harbor answers.</strong> Instant ask → maybe only a Message. Needs time → Harbor
            creates a Task, returns id + WORKING.
          </li>
          <li>
            <strong>Store</strong> <code>task.id</code> (and <code>contextId</code>). When Harbor
            says INPUT_REQUIRED, send another Message with the <em>same</em> taskId — “Queen.” Same
            job, new turn.
          </li>
          <li>
            <strong>COMPLETED</strong> puts the confirmation in Artifacts on that Task.
          </li>
        </ol>
        <p>
          So: <strong>Message</strong> = one turn you send or receive. <strong>Task</strong> =
          Harbor’s open job ticket. Your agent keeps the ticket number; Harbor owns the ticket.
        </p>
        <p>
          Think of it as a folder and sticky notes. The Task is the folder (one booking). Each
          Message is a sticky note. Priya’s agent writes notes. Harbor writes notes and finally drops
          the confirmation artifact into the same folder. A brand-new ask after completion is a new
          Task, usually with the same <code>contextId</code>.
        </p>
        <CodeBlock
          code={`# Same task.id after Harbor’s first reply
Priya → Harbor: Message "Hold quiet double…"
Harbor → Priya: Task WORKING
Harbor → Priya: Task INPUT_REQUIRED + "Queen or twin?"
Priya → Harbor: Message taskId=… "Queen."
Harbor → Priya: Task COMPLETED + Artifact H-1842`}
        />
      </section>

      <section id="a2a-states" aria-labelledby="a2a-states-title">
        <span className="a2a-part">07 · Task states</span>
        <h3 id="a2a-states-title">A task can pause. It is not always “done or failed.”</h3>
        <HowTo
          title="Try this"
          steps={['Click a state.', 'Read what Priya’s agent should do next.']}
        />
        <div className="a2a-states" role="group" aria-label="Task states">
          {STATES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === state.id}
              onClick={() => setStateId(item.id)}
            >
              <strong>{item.label}</strong>
            </button>
          ))}
        </div>
        <div className="a2a-note">
          <span className="edge-kicker">{state.label}</span>
          <p>{state.body}</p>
        </div>
      </section>

      <section id="a2a-parts" aria-labelledby="a2a-parts-title">
        <span className="a2a-part">08 · Parts</span>
        <h3 id="a2a-parts-title">A part is exactly one of four payloads</h3>
        <p>
          The Agent Card advertises <strong>modes</strong> (MIME types). A Message carries Parts that
          must fit those modes. Harbor’s reply may be a lasting Task. When done, Artifacts are also
          made of Parts.
        </p>
        <HowTo
          title="Try this"
          steps={['Click text, data, then file.', 'Prefer data + tokens over a raw customer file.']}
        />
        <div className="edge-choices" role="group" aria-label="Part kinds">
          {PARTS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === part.id ? 'edge-choice edge-choice--on' : 'edge-choice'}
              aria-pressed={item.id === part.id}
              onClick={() => setPartId(item.id)}
            >
              {item.title}
            </button>
          ))}
        </div>
        <div className="a2a-note">
          <span className="edge-kicker">{part.title}</span>
          <p>{part.body}</p>
        </div>
        <CodeBlock code={part.code} />
        <p>
          Short map: <strong>mode</strong> = allowed MIME. <strong>Part</strong> = content atom.{' '}
          <strong>Message</strong> = one turn. <strong>Task</strong> = Harbor’s job.{' '}
          <strong>Artifact</strong> = result on that task.
        </p>
      </section>

      <section id="a2a-card" aria-labelledby="a2a-card-title">
        <span className="a2a-part">09 · Agent Card</span>
        <h3 id="a2a-card-title">Read the card before you send work</h3>
        <p>
          The Agent Card is a JSON file at a well-known URL. It lists skills, endpoints, login, and
          whether streaming or push is supported. Ask only for features the card advertised. A skill
          is advertising, not a promise. Sign or pin the card if you did not fetch it from a URL you
          already trust.
        </p>
        <div className="a2a-matrix" role="table" aria-label="Agent Card fields">
          {[
            ['name / description', 'Who this agent is, in human words.'],
            ['supportedInterfaces', 'Where to call it, and which binding (JSON-RPC, gRPC, …).'],
            ['skills', 'What jobs it will take — book_room, not “run any SQL.”'],
            ['securitySchemes', 'How to sign in: API key, OAuth, and so on.'],
            ['capabilities', 'Streaming, push notifications, richer card on request.'],
            ['defaultInputModes / OutputModes', 'MIME types this agent accepts and returns.'],
          ].map(([field, meaning]) => (
            <div key={field} className="a2a-matrix__row" role="row">
              <strong role="cell">{field}</strong>
              <span role="cell">{meaning}</span>
            </div>
          ))}
        </div>
        <CodeBlock
          code={`GET /.well-known/agent-card.json

{
  "name": "Harbor Hotel Agent",
  "description": "Books rooms. Does not plan flights.",
  "skills": [{
    "id": "book-room",
    "name": "Book a room",
    "description": "Holds a room when dates, city, and guest count are known.",
    "inputModes": ["text/plain", "application/json"],
    "outputModes": ["application/json", "text/plain"]
  }],
  "supportedInterfaces": [{
    "url": "https://hotel.example/a2a",
    "protocolBinding": "JSONRPC",
    "protocolVersion": "1.0"
  }],
  "capabilities": { "streaming": true, "pushNotifications": true },
  "securitySchemes": {
    "apiKey": {
      "apiKeySecurityScheme": { "location": "header", "name": "X-API-Key" }
    }
  }
}`}
        />
        <p>
          Three layers so the binding can change: a “task” means the same thing on JSON-RPC, gRPC, or
          HTTP+JSON. The Agent Card lists which bindings this agent speaks. Production URLs are
          absolute HTTPS.
        </p>
      </section>

      <section id="a2a-week" aria-labelledby="a2a-week-title">
        <span className="a2a-part">10 · This week</span>
        <h3 id="a2a-week-title">Three moves you can ship</h3>
        <ul className="edge-refs">
          <li>
            <strong>Publish a card.</strong> Put a real <code>agent-card.json</code> behind HTTPS
            with one skill, one auth scheme, and honest input/output modes.
          </li>
          <li>
            <strong>Hire with a task id Harbor created.</strong> Do not pretend every ask is a
            one-shot chat. Keep state for working, input-required, and completed.
          </li>
          <li>
            <strong>Send tokens, not customer files.</strong> An A2A data part is another place the
            customer file can land — same lesson as the PII guide. Pass EMAIL_1, not the raw address.
          </li>
        </ul>
        <p>
          Related: <a href="/post/pii-in-agents">Protecting PII in agents</a>
          {' · '}
          <a href="/post/a2ui">A2UI — agent describes the screen</a>
        </p>
      </section>
    </div>
  )
}
