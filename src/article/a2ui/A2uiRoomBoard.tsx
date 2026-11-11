import { useEffect, useState } from 'react'

const STEPS = [
  {
    id: 'blank',
    label: '1 · Blank',
    title: 'createSurface — name only',
    body: 'surfaceId hold_room and a catalogId. No root yet, so the frame stays empty. The agent reserved a card; your app has not drawn a field.',
    payload: `{
  "version": "1.0",
  "createSurface": {
    "surfaceId": "hold_room",
    "catalogId": "https://a2ui.org/catalog/basic.json",
    "sendDataModel": false
  }
}`,
  },
  {
    id: 'bones',
    label: '2 · Bones',
    title: 'updateComponents — shape without values',
    body: 'Title, city, dates, guests, button. Parents list child ids. Values are still blank, so you see the form’s bones, not Lisbon.',
    payload: `{
  "version": "1.0",
  "updateComponents": {
    "surfaceId": "hold_room",
    "components": [
      {
        "id": "root",
        "component": "Column",
        "children": ["title", "city", "dates", "guests", "go"]
      },
      { "id": "title", "component": "Text", "text": "Hold a room" },
      {
        "id": "city",
        "component": "TextField",
        "label": "City",
        "value": { "@path": "/city" }
      },
      {
        "id": "dates",
        "component": "TextField",
        "label": "Dates",
        "value": { "@path": "/dates" }
      },
      {
        "id": "guests",
        "component": "TextField",
        "label": "Guests",
        "value": { "@path": "/guests" }
      },
      {
        "id": "go",
        "component": "Button",
        "child": "go_label",
        "action": { "name": "holdRoom" }
      },
      {
        "id": "go_label",
        "component": "Text",
        "text": "Hold this room"
      }
    ]
  }
}`,
  },
  {
    id: 'filled',
    label: '3 · Filled',
    title: 'updateDataModel — Lisbon arrives',
    body: 'One path patch fills the blanks. The button is not sent again. If dates change later, only dates move.',
    payload: `{
  "version": "1.0",
  "updateDataModel": {
    "surfaceId": "hold_room",
    "path": "/",
    "value": {
      "city": "Lisbon",
      "dates": "12–15 May",
      "guests": "2 adults"
    }
  }
}`,
  },
  {
    id: 'ask',
    label: '4 · Ask',
    title: 'action — the click comes back',
    body: 'Your Button fired. The renderer sends name, surfaceId, sourceComponentId, and context. No agent JavaScript entered the page.',
    payload: `{
  "version": "1.0",
  "action": {
    "name": "holdRoom",
    "surfaceId": "hold_room",
    "sourceComponentId": "go",
    "timestamp": "2026-05-12T10:04:11Z",
    "context": {
      "city": "Lisbon",
      "dates": "12–15 May"
    }
  }
}`,
  },
  {
    id: 'held',
    label: '5 · Held',
    title: 'Same card, new status',
    body: 'The agent updates one value. The button now reads Held until 18:00. deleteSurface later clears widgets and the model together.',
    payload: `{
  "version": "1.0",
  "updateDataModel": {
    "surfaceId": "hold_room",
    "path": "/status",
    "value": "Held until 18:00"
  }
}`,
  },
] as const

export function A2uiRoomBoard() {
  const [idx, setIdx] = useState(0)
  const [auto, setAuto] = useState(false)
  const step = STEPS[idx]
  const bones = idx >= 1
  const filled = idx >= 2
  const asking = idx === 3
  const held = idx >= 4

  useEffect(() => {
    if (!auto) return
    const t = window.setTimeout(() => {
      setIdx((i) => (i >= STEPS.length - 1 ? 0 : i + 1))
    }, 1600)
    return () => window.clearTimeout(t)
  }, [auto, idx])

  return (
    <div className="iv-room" aria-label="A room card built from A2UI messages">
      <div className="iv-room__top">
        <div>
          <p className="iv-room__kicker">Watch one card appear</p>
          <p className="iv-room__lead">
            Left is what your app draws. Right is the message that just arrived. Auto steps the
            stream.
          </p>
        </div>
        <button
          type="button"
          className={auto ? 'iv-room__auto is-on' : 'iv-room__auto'}
          aria-pressed={auto}
          onClick={() => setAuto((on) => !on)}
        >
          {auto ? 'Pause' : 'Auto'}
        </button>
      </div>

      <div className="iv-room__stage">
        <div
          className={`iv-room__card${bones ? '' : ' is-blank'}${asking ? ' is-asking' : ''}${held ? ' is-held' : ''}`}
          aria-hidden
        >
          <p className="iv-room__card-kicker">{bones ? 'Harbor · quiet double' : 'surface · hold_room'}</p>
          <p className="iv-room__card-title">{bones ? 'Hold a room' : 'Nothing drawn yet'}</p>
          {bones ? (
            <>
              <div className={`iv-room__field${filled ? ' is-filled' : ''}`}>
                <span>City</span>
                <span>{filled ? 'Lisbon' : '—'}</span>
              </div>
              <div className={`iv-room__field${filled ? ' is-filled' : ''}`}>
                <span>Dates</span>
                <span>{filled ? '12–15 May' : '—'}</span>
              </div>
              <div className={`iv-room__field${filled ? ' is-filled' : ''}`}>
                <span>Guests</span>
                <span>{filled ? '2 adults' : '—'}</span>
              </div>
              <div className={`iv-room__btn${asking ? ' is-press' : ''}${held ? ' is-done' : ''}`}>
                {held ? 'Held until 18:00' : 'Hold this room'}
              </div>
            </>
          ) : (
            <p className="iv-room__wait">Waiting for root. createSurface alone does not paint pixels.</p>
          )}
        </div>

        <aside className="iv-room__panel" aria-live="polite">
          <p>
            {step.label} · {step.title}
          </p>
          <pre>{step.payload}</pre>
        </aside>
      </div>

      <div className="iv-room__steps" role="tablist" aria-label="A2UI stream steps">
        {STEPS.map((item, i) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={i === idx}
            className={i === idx ? 'is-on' : i < idx ? 'is-done' : undefined}
            onClick={() => {
              setAuto(false)
              setIdx(i)
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="iv-room__copy">
        <p className="iv-room__tip">{step.title}</p>
        <p>{step.body}</p>
      </div>
    </div>
  )
}
