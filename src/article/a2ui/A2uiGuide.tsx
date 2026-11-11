import { useState, type MouseEvent } from 'react'
import '../edge-stack/edge-stack.css'
import './a2ui.css'
import { A2uiRoomBoard } from './A2uiRoomBoard'

const PROBLEMS = [
  {
    id: 'chat',
    title: 'Chat menu',
    tone: 'bad' as const,
    body: '“Reply 1, 2, or 3.” Works in Slack. Breaks the moment Priya needs a calendar or a room picker. The agent is inventing a UI out of text.',
    sample: `Agent: Pick a room —
1) Quiet double
2) Twin
3) Suite

Priya: …opens calendar instead`,
  },
  {
    id: 'html',
    title: 'Agent HTML',
    tone: 'bad' as const,
    body: 'The model emits a <script> or a form. Your own buttons cannot steal a session cookie. A tricked model can. That is not a UI protocol — that is giving the page to the model.',
    sample: `model → "<form onsubmit=…>"
model → "<script>…</script>"

# Your renderer should never run this.`,
  },
  {
    id: 'a2ui',
    title: 'A2UI',
    tone: 'good' as const,
    body: 'The agent names widgets and values. Your app maps those names onto React / Flutter components it already trusts. The agent never runs code in the page.',
    sample: `{ "updateComponents": { "components": [
  { "id": "go", "component": "Button",
    "action": { "name": "holdRoom" } }
] } }

# Your Button code is the button.`,
  },
]

const AGENT_VERBS = [
  {
    id: 'create',
    label: 'createSurface',
    body: 'Reserve a surfaceId. Optional catalogId (compiled in — not fetched). sendDataModel defaults false.',
  },
  {
    id: 'tree',
    label: 'updateComponents',
    body: 'Flat list of widgets. Parents list child ids. Until root exists, nothing paints.',
  },
  {
    id: 'data',
    label: 'updateDataModel',
    body: 'Patch values at a path. Widgets with @path redraw. Prefer tokens over passports.',
  },
  {
    id: 'delete',
    label: 'deleteSurface',
    body: 'Tear the card down. Widgets and model go together.',
  },
]

const UI_VERBS = [
  {
    id: 'action',
    label: 'action',
    body: 'Priya clicked. name, surfaceId, sourceComponentId, context. Not a script.',
  },
  {
    id: 'error',
    label: 'error',
    body: 'Renderer failed. Report error — do not pretend it was a click.',
  },
  {
    id: 'callAgent',
    label: 'callAgentFunction',
    body: 'Ask the agent to run a catalog function only it may run.',
  },
  {
    id: 'fnResp',
    label: 'rendererFunctionResponse',
    body: 'Answer to callRendererFunction. Copy functionCallId even when empty.',
  },
]

const BIND_STEPS = [
  {
    id: 'lit',
    title: 'Literal',
    line: 'Fixed text on the widget. No lookup.',
    code: `{ "text": "Hold a room" }`,
  },
  {
    id: 'path',
    title: '@path',
    line: 'Show whatever sits at /city in the data model. Change the model → field updates.',
    code: `{ "value": { "@path": "/city" } }

# data model:
{ "city": "Lisbon", "dates": "12–15 May" }`,
  },
  {
    id: 'patch',
    title: 'updateDataModel',
    line: 'One path patch. You do not resend the whole tree. null at a path deletes that key.',
    code: `{ "updateDataModel": {
  "surfaceId": "hold_room",
  "path": "/city",
  "value": "Porto"
} }`,
  },
]

const PATHS = [
  {
    id: 'b',
    title: 'Option B · A1 authors',
    body: 'Harbor returns ordinary A2A facts (code, heldUntil). Priya’s agent authors A2UI for catalogs the app already shipped. Harbor never names Button or TextField. Usual for product UIs.',
    code: `# Option B — Harbor sends facts; A1 authors A2UI
# A2A reply from Harbor (no a2ui mime):
{
  "task": {
    "status": { "state": "TASK_STATE_COMPLETED" },
    "artifacts": [{
      "parts": [{
        "data": { "code": "H-1842", "heldUntil": "18:00", "city": "Lisbon" }
      }]
    }]
  }
}

# Priya’s agent (A1) then sends to the UI:
{ "version": "1.0", "createSurface": { "surfaceId": "hold_room" } }
{ "version": "1.0", "updateComponents": { "…" } }
{ "version": "1.0", "updateDataModel": {
  "surfaceId": "hold_room",
  "path": "/",
  "value": { "code": "H-1842", "heldUntil": "18:00" }
} }
# Harbor never named Button or TextField.`,
  },
  {
    id: 'a',
    title: 'Option A · A2 embeds',
    body: 'Harbor embeds A2UI inside an A2A data part (mimeType application/a2ui+json, data as an array). Priya’s agent unwraps and sends only those A2UI objects to the UI — or rewrites surface ids. ADK orchestrator sample style.',
    code: `# Option A — A2UI inside an A2A data part
{
  "kind": "data",
  "metadata": { "mimeType": "application/a2ui+json" },
  "data": [
    { "version": "1.0", "createSurface": { "surfaceId": "hold_room" } },
    { "version": "1.0", "updateComponents": { "…" } }
  ]
}
# data MUST be an array. Process in order. Not a transaction.
# A1 unwraps and forwards only the A2UI objects to the UI.`,
  },
]

const NEIGHBORS = [
  {
    id: 'mcp',
    title: 'MCP',
    job: 'model → tool',
    body: 'Call a calendar, database, or file you trust. Function in, result out. Same trust boundary.',
  },
  {
    id: 'a2a',
    title: 'A2A',
    job: 'agent → agent',
    body: 'Hire another company’s agent. Ask for a room. Do not watch their search. Take an artifact.',
  },
  {
    id: 'a2ui',
    title: 'A2UI',
    job: 'agent → screen',
    body: 'Describe a card as names and values. Your renderer draws it. No agent HTML.',
  },
]

const MISTAKES = [
  {
    id: 'two-keys',
    title: 'Two keys in one object',
    body: 'createSurface and updateComponents in the same JSON is invalid. One message, one job. v1.0 may pack components on create — that is still one key: createSurface.',
  },
  {
    id: 'no-root',
    title: 'No root yet',
    body: 'createSurface alone paints nothing. Until a component with id "root" arrives, updates buffer. That blank card on the room board is correct.',
  },
  {
    id: 'fetch-catalog',
    title: 'Fetching catalogId',
    body: 'catalogId is an identifier your app already compiled in. It is not a URL to download. Unknown type → reject, do not invent a widget.',
  },
  {
    id: 'out-of-order',
    title: 'Out-of-order stream',
    body: 'Create, then tree, then data. Valid messages in the wrong order still build the wrong screen. Carriers must keep order.',
  },
  {
    id: 'send-all',
    title: 'sendDataModel left on',
    body: 'Every action can ship the whole form — including secrets Priya typed. Default off. Scrub before you opt in.',
  },
  {
    id: 'forward-task',
    title: 'Forwarding the A2A Task',
    body: 'On Option A, A1 unwraps A2UI and sends only those objects to the UI. The browser never speaks A2A.',
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
    <div className="a2ui-howto">
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

export function A2uiGuide() {
  const [problemId, setProblemId] = useState(PROBLEMS[2].id)
  const [duplexSide, setDuplexSide] = useState<'agent' | 'ui'>('agent')
  const [agentVerbId, setAgentVerbId] = useState(AGENT_VERBS[0].id)
  const [uiVerbId, setUiVerbId] = useState(UI_VERBS[0].id)
  const [bindId, setBindId] = useState(BIND_STEPS[1].id)
  const [pathId, setPathId] = useState(PATHS[0].id)
  const [neighborId, setNeighborId] = useState(NEIGHBORS[2].id)
  const [mistakeId, setMistakeId] = useState(MISTAKES[0].id)

  const problem = PROBLEMS.find((item) => item.id === problemId) ?? PROBLEMS[0]
  const agentVerb = AGENT_VERBS.find((item) => item.id === agentVerbId) ?? AGENT_VERBS[0]
  const uiVerb = UI_VERBS.find((item) => item.id === uiVerbId) ?? UI_VERBS[0]
  const bind = BIND_STEPS.find((item) => item.id === bindId) ?? BIND_STEPS[0]
  const path = PATHS.find((item) => item.id === pathId) ?? PATHS[0]
  const neighbor = NEIGHBORS.find((item) => item.id === neighborId) ?? NEIGHBORS[0]
  const mistake = MISTAKES.find((item) => item.id === mistakeId) ?? MISTAKES[0]
  const activeVerb = duplexSide === 'agent' ? agentVerb : uiVerb

  return (
    <div className="edge-guide">
      <p className="edge-deck">
        Priya’s booking chat needs a form — dates, room type, submit. The agent must not send HTML or
        JavaScript for the page to run. A2UI is how the agent describes the screen as data, and your
        app draws it with widgets it already trusts. Shapes below are v1.0 candidate; ship v0.9.1 in
        production until 1.0 is current.
      </p>

      <nav className="edge-toc" aria-label="On this page">
        <a href="#a2ui-intro" onClick={(event) => jump('a2ui-intro', event)}>Scene</a>
        <a href="#a2ui-room" onClick={(event) => jump('a2ui-room', event)}>One card</a>
        <a href="#a2ui-duplex" onClick={(event) => jump('a2ui-duplex', event)}>Two directions</a>
        <a href="#a2ui-bind" onClick={(event) => jump('a2ui-bind', event)}>@path</a>
        <a href="#a2ui-create" onClick={(event) => jump('a2ui-create', event)}>Create + tree</a>
        <a href="#a2ui-paths" onClick={(event) => jump('a2ui-paths', event)}>A2A options</a>
        <a href="#a2ui-neighbors" onClick={(event) => jump('a2ui-neighbors', event)}>Neighbors</a>
        <a href="#a2ui-safe" onClick={(event) => jump('a2ui-safe', event)}>Safe data</a>
        <a href="#a2ui-mistakes" onClick={(event) => jump('a2ui-mistakes', event)}>Breaks</a>
        <a href="#a2ui-week" onClick={(event) => jump('a2ui-week', event)}>This week</a>
      </nav>

      <section id="a2ui-intro" aria-labelledby="a2ui-intro-title">
        <span className="a2ui-part">01 · Scene</span>
        <h3 id="a2ui-intro-title">The agent should not own the page</h3>
        <p>
          Google made A2UI public on 15 December 2025 (Apache 2.0, with CopilotKit and the community).
          Official renderers exist for React, Angular, Lit, and Flutter. AG-UI is often the pipe;
          A2UI is the screen description on that pipe (or inside A2A / MCP).
        </p>

        <HowTo
          title="Try this"
          steps={[
            'Click Chat menu, then Agent HTML, then A2UI.',
            'Keep the middle path: names and values, your components.',
          ]}
        />
        <div className="edge-choices" role="group" aria-label="Three ways to ask for a form">
          {PROBLEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === problem.id ? 'edge-choice edge-choice--on' : 'edge-choice'}
              aria-pressed={item.id === problem.id}
              onClick={() => setProblemId(item.id)}
            >
              {item.title}
            </button>
          ))}
        </div>
        <div className={problem.tone === 'bad' ? 'a2ui-note a2ui-note--bad' : 'a2ui-note'}>
          <span className="edge-kicker">{problem.title}</span>
          <p>{problem.body}</p>
        </div>
        <CodeBlock code={problem.sample} />

        <div className="a2ui-hops" aria-label="Where A2UI sits">
          <div className="a2ui-hops__node">
            <strong>Booking UI</strong>
            <span>your renderer</span>
          </div>
          <div className="a2ui-hops__arrow" aria-hidden>
            <span>A2UI</span>
          </div>
          <div className="a2ui-hops__node a2ui-hops__node--accent">
            <strong>Priya’s agent</strong>
            <span>A1</span>
          </div>
          <div className="a2ui-hops__arrow" aria-hidden>
            <span>A2A</span>
          </div>
          <div className="a2ui-hops__node">
            <strong>Harbor</strong>
            <span>A2 · hotel agent</span>
          </div>
        </div>
        <p className="a2ui-hops__caption">
          Different wires, different jobs. The screen never speaks A2A. Harbor never draws your
          React tree unless you chose Option A and A1 relayed it.
        </p>
      </section>

      <section id="a2ui-room" aria-labelledby="a2ui-room-title">
        <span className="a2ui-part">02 · One card</span>
        <h3 id="a2ui-room-title">Watch a booking card appear from messages</h3>
        <p>
          Blank → Bones → Filled → Ask → Held — or press Auto. Left is what your app draws. Right is
          the message that just arrived. The agent only sent names and values.
        </p>
        <HowTo
          title="Try this"
          steps={[
            'Press Auto, or click each step tab.',
            'Notice createSurface alone leaves the card blank — root is still missing.',
            'Read the JSON on the right. That is the trust story.',
          ]}
        />
        <A2uiRoomBoard />
      </section>

      <section id="a2ui-duplex" aria-labelledby="a2ui-duplex-title">
        <span className="a2ui-part">03 · Two directions</span>
        <h3 id="a2ui-duplex-title">Agent → screen is not the same schema as screen → agent</h3>
        <p>
          Every agent message has a version and exactly one key. Every UI message has a version and
          exactly one of action, error, callAgentFunction, or rendererFunctionResponse. Mixing
          directions is how teams invent invalid payloads.
        </p>
        <HowTo
          title="Try this"
          steps={[
            'Click Agent → UI, then pick a verb.',
            'Flip to UI → Agent and pick action.',
            'Notice the UI never sends createSurface.',
          ]}
        />
        <div className="a2ui-duplex" role="group" aria-label="Message direction">
          <button
            type="button"
            className={duplexSide === 'agent' ? 'is-on' : undefined}
            aria-pressed={duplexSide === 'agent'}
            onClick={() => setDuplexSide('agent')}
          >
            <strong>Agent → UI</strong>
            <span>create · tree · data · delete</span>
          </button>
          <button
            type="button"
            className={duplexSide === 'ui' ? 'is-on' : undefined}
            aria-pressed={duplexSide === 'ui'}
            onClick={() => setDuplexSide('ui')}
          >
            <strong>UI → Agent</strong>
            <span>action · error · functions</span>
          </button>
        </div>
        <div className="a2ui-verbs" role="group" aria-label="Verbs for this direction">
          {(duplexSide === 'agent' ? AGENT_VERBS : UI_VERBS).map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === activeVerb.id}
              onClick={() => {
                if (duplexSide === 'agent') setAgentVerbId(item.id)
                else setUiVerbId(item.id)
              }}
            >
              <strong>{item.label}</strong>
              <span>{item.body}</span>
            </button>
          ))}
        </div>
        <div className="a2ui-note">
          <span className="edge-kicker">
            {duplexSide === 'agent' ? 'Agent → UI' : 'UI → Agent'} · {activeVerb.label}
          </span>
          <p>{activeVerb.body}</p>
        </div>
      </section>

      <section id="a2ui-bind" aria-labelledby="a2ui-bind-title">
        <span className="a2ui-part">04 · @path</span>
        <h3 id="a2ui-bind-title">Data stays data. The field points at a path.</h3>
        <p>
          A changing value is a literal, an <code>@path</code> into the model, or an{' '}
          <code>@call</code> the catalog already defined. The <code>@</code> prefix is reserved. The
          message’s own path field on updateDataModel stays the word <code>path</code> — only
          bindings inside widgets use <code>@path</code>.
        </p>
        <HowTo
          title="Try this"
          steps={['Click Literal, then @path, then updateDataModel.', 'Watch what the City field is bound to.']}
        />
        <div className="edge-choices" role="group" aria-label="Binding kinds">
          {BIND_STEPS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === bind.id ? 'edge-choice edge-choice--on' : 'edge-choice'}
              aria-pressed={item.id === bind.id}
              onClick={() => setBindId(item.id)}
            >
              {item.title}
            </button>
          ))}
        </div>
        <div className="a2ui-bind" aria-hidden={false}>
          <div className="a2ui-bind__field">
            <span>City</span>
            <strong>{bind.id === 'patch' ? 'Porto' : bind.id === 'path' ? 'Lisbon' : '—'}</strong>
            <em>{bind.id === 'lit' ? 'literal' : '{ "@path": "/city" }'}</em>
          </div>
          <div className="a2ui-bind__arrow" aria-hidden>
            ↔
          </div>
          <div className="a2ui-bind__model">
            <p>data model</p>
            <code>{`{ "city": "${bind.id === 'patch' ? 'Porto' : 'Lisbon'}", "dates": "12–15 May" }`}</code>
          </div>
        </div>
        <div className="a2ui-note">
          <span className="edge-kicker">{bind.title}</span>
          <p>{bind.line}</p>
        </div>
        <CodeBlock code={bind.code} />
      </section>

      <section id="a2ui-create" aria-labelledby="a2ui-create-title">
        <span className="a2ui-part">05 · Create + tree</span>
        <h3 id="a2ui-create-title">createSurface reserves a card. root paints it.</h3>
        <p>
          <code>surfaceId</code> is required. <code>catalogId</code> is optional and becomes the
          default catalog for widgets that do not name their own. Teams format it like a URL so two
          companies do not collide. <strong>It is not fetched</strong> — the renderer already has
          that catalog compiled in, or it refuses the surface.
        </p>
        <p>
          <code>sendDataModel</code> defaults to false. Turn it on only when the agent must see the
          whole form on every click — then scrub. The protocol invents a Surface whose only child is{' '}
          <code>&quot;root&quot;</code>. A flat list pretends to be a tree: parents list child ids,
          so a later message can replace one button without resending the page.
        </p>
        <div className="a2ui-tree" aria-label="Flat list as a tree">
          <div className="a2ui-tree__node a2ui-tree__node--root">
            <strong>root</strong>
            <span>Column · children: title, city, go</span>
          </div>
          <div className="a2ui-tree__kids">
            <div className="a2ui-tree__node">
              <strong>title</strong>
              <span>Text</span>
            </div>
            <div className="a2ui-tree__node">
              <strong>city</strong>
              <span>TextField · @path /city</span>
            </div>
            <div className="a2ui-tree__node">
              <strong>go</strong>
              <span>Button · action holdRoom</span>
            </div>
          </div>
        </div>
        <CodeBlock
          code={`{ "version": "1.0", "createSurface": {
  "surfaceId": "hold_room",
  "catalogId": "https://a2ui.org/catalog/basic.json",
  "sendDataModel": false
} }

{ "version": "1.0", "updateComponents": {
  "surfaceId": "hold_room",
  "components": [
    { "id": "root", "component": "Column",
      "children": ["title", "city", "go"] },
    { "id": "title", "component": "Text", "text": "Hold a room" },
    { "id": "city", "component": "TextField",
      "label": "City", "value": { "@path": "/city" } },
    { "id": "go", "component": "Button",
      "child": "go_label", "action": { "name": "holdRoom" } },
    { "id": "go_label", "component": "Text", "text": "Hold this room" }
  ]
} }`}
        />
        <p>
          Carriers must keep order, send one JSON object per frame/event/line, and carry catalog
          capabilities beside the message — not inside a widget. AG-UI, A2A, MCP, WebSockets, SSE,
          and REST can all carry this. REST works; it does not stream.
        </p>
      </section>

      <section id="a2ui-paths" aria-labelledby="a2ui-paths-title">
        <span className="a2ui-part">06 · Riding on A2A</span>
        <h3 id="a2ui-paths-title">Two ways Harbor’s answer becomes a card</h3>
        <p>
          UI talks only to Priya’s agent (A1). A1 hires Harbor (A2) with A2A. What changes is what A2
          puts on the wire — and what A1 does before the pixels move.
        </p>
        <HowTo
          title="Try this"
          steps={[
            'Click Option B (usual), then Option A (extension).',
            'Watch the code example change with the choice.',
          ]}
        />
        <div className="edge-choices" role="group" aria-label="A2UI on A2A paths">
          {PATHS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === path.id ? 'edge-choice edge-choice--on' : 'edge-choice'}
              aria-pressed={item.id === path.id}
              onClick={() => setPathId(item.id)}
            >
              {item.title}
            </button>
          ))}
        </div>
        <div className="a2ui-note">
          <span className="edge-kicker">{path.title}</span>
          <p>{path.body}</p>
        </div>
        <CodeBlock code={path.code} />
      </section>

      <section id="a2ui-neighbors" aria-labelledby="a2ui-neighbors-title">
        <span className="a2ui-part">07 · Neighbors</span>
        <h3 id="a2ui-neighbors-title">Three protocols, three jobs</h3>
        <HowTo
          title="Try this"
          steps={['Click each card.', 'Say the one-line job out loud once.']}
        />
        <div className="a2ui-neighbors" role="group" aria-label="Protocol neighbors">
          {NEIGHBORS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === neighbor.id ? 'is-on' : undefined}
              aria-pressed={item.id === neighbor.id}
              onClick={() => setNeighborId(item.id)}
            >
              <span className="a2ui-neighbors__job">{item.job}</span>
              <strong>{item.title}</strong>
              <span>{item.body}</span>
            </button>
          ))}
        </div>
        <p>
          A2UI does not replace the other two. It often rides inside them. Think: A2UI ≈ HTML; a
          renderer ≈ a browser; your CSS still owns how it looks.
        </p>
      </section>

      <section id="a2ui-safe" aria-labelledby="a2ui-safe-title">
        <span className="a2ui-part">08 · Safe data</span>
        <h3 id="a2ui-safe-title">A form can leak too</h3>
        <p>
          A surface that round-trips a passport into the browser is a new leak path — even if the
          chat bubble looked clean. Leave sendDataModel off for secrets until you scrub. Send tokens
          and task fields, not the full customer file.
        </p>
        <div className="a2ui-matrix" role="table" aria-label="Safe surface rules">
          {[
            ['Widget catalog', 'Only names your app already implements. Unknown widget → reject.'],
            ['Data model', 'Dates and room type are fine. Passport and card are not.'],
            ['Actions', 'Named events your code handles. Not arbitrary scripts.'],
            ['Trust boundary', 'Catalog + renderer. The model only proposes names and values.'],
            ['sendDataModel', 'Default off. On = whole form rides back — scrub first.'],
          ].map(([title, body]) => (
            <div key={title} className="a2ui-matrix__row" role="row">
              <strong role="cell">{title}</strong>
              <span role="cell">{body}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="a2ui-mistakes" aria-labelledby="a2ui-mistakes-title">
        <span className="a2ui-part">09 · What usually breaks</span>
        <h3 id="a2ui-mistakes-title">Six traps teams hit in week one</h3>
        <HowTo
          title="Try this"
          steps={['Click each trap.', 'Check your draft messages against it before you ship.']}
        />
        <div className="a2ui-mistakes" role="group" aria-label="Common mistakes">
          {MISTAKES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === mistake.id ? 'is-on' : undefined}
              aria-pressed={item.id === mistake.id}
              onClick={() => setMistakeId(item.id)}
            >
              {item.title}
            </button>
          ))}
        </div>
        <div className="a2ui-note a2ui-note--bad">
          <span className="edge-kicker">{mistake.title}</span>
          <p>{mistake.body}</p>
        </div>
      </section>

      <section id="a2ui-week" aria-labelledby="a2ui-week-title">
        <span className="a2ui-part">10 · This week</span>
        <h3 id="a2ui-week-title">Three moves you can ship</h3>
        <ul className="edge-refs">
          <li>
            <strong>Start with one surface.</strong> One booking card: dates, room, submit. Map three
            widget names to components you already have. Prefer Option B unless Harbor must own the
            card.
          </li>
          <li>
            <strong>Reject unknown widgets.</strong> If the agent invents a type, do not draw it.
          </li>
          <li>
            <strong>Scrub the data model.</strong> Same prepare() idea as tools and A2A — no raw
            customer file in the form payload. Leave sendDataModel off until you need it.
          </li>
        </ul>
        <p>
          Related: <a href="/post/a2a">A2A — how one agent hires another</a>
          {' · '}
          <a href="/post/pii-in-agents">Protecting PII in agents</a>
        </p>
      </section>
    </div>
  )
}
