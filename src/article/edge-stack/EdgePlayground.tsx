import { useEffect, useRef, useState } from 'react'

type Mode = 'suggest' | 'check'
type Situation = 'page' | 'outside'
type Tone = 'ok' | 'bad' | 'warn' | 'private'
type NodeId = 'client' | 'waf' | 'lb' | 'gw' | 'web' | 'catalog' | 'inventory' | 'db' | 'nat'

type Pieces = {
  web: boolean
  catalog: boolean
  inventory: boolean
  db: boolean
}

type Edge = {
  waf: boolean
  lb: boolean
  gw: boolean
}

type Spot = { id: NodeId; x: number; y: number }

type Finding = { tone: 'bad' | 'warn'; text: string }

type Wire = { from: NodeId; to: NodeId; quiet: boolean; bad: boolean }
type Link = { from: NodeId; to: NodeId }

const NODE_W = 128
const NODE_H = 58
const PAD = 16

const PALETTE: { id: NodeId; label: string }[] = [
  { id: 'web', label: 'Web app' },
  { id: 'catalog', label: 'Catalog' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'db', label: 'Database' },
  { id: 'waf', label: 'WAF' },
  { id: 'lb', label: 'Load balancer' },
  { id: 'gw', label: 'API gateway' },
  { id: 'nat', label: 'NAT gateway' },
]

function needsNat(pieces: Pieces) {
  return pieces.web || pieces.catalog || pieces.inventory
}

function hasApi(pieces: Pieces) {
  return pieces.catalog || pieces.inventory
}

function suggested(situation: Situation, pieces: Pieces): Edge {
  if (situation === 'page') {
    return { waf: pieces.web, lb: pieces.web, gw: false }
  }
  const api = hasApi(pieces)
  return { waf: api, lb: api, gw: api }
}

function piecesOf(spots: Spot[]): Pieces {
  const has = (id: NodeId) => spots.some((spot) => spot.id === id)
  return { web: has('web'), catalog: has('catalog'), inventory: has('inventory'), db: has('db') }
}

function edgeOf(spots: Spot[]): Edge {
  const has = (id: NodeId) => spots.some((spot) => spot.id === id)
  return { waf: has('waf'), lb: has('lb'), gw: has('gw') }
}

function findings(situation: Situation, pieces: Pieces, edge: Edge): Finding[] {
  const out: Finding[] = []
  const api = hasApi(pieces)

  if (situation === 'page') {
    if (!pieces.web) out.push({ tone: 'bad', text: 'The Web app simulation needs the web app that renders the page.' })
    if (pieces.web && !edge.waf) {
      out.push({ tone: 'bad', text: 'The search comes from the internet. Place the WAF in front of the web app.' })
    }
    if (edge.gw) {
      out.push({
        tone: 'bad',
        text: 'This page renders in the web app. The API gateway is for a published API. Path rules on the load balancer are enough.',
      })
    }
    if (pieces.web && !edge.lb) {
      out.push({
        tone: 'bad',
        text: 'A production web app runs more than one process. Place the load balancer between the WAF and the web app.',
      })
    }
    if (!pieces.web && !api && pieces.db) {
      out.push({ tone: 'bad', text: 'The database is on the board with nothing in front of it that can query it.' })
    }
    return out
  }

  if (!api) out.push({ tone: 'bad', text: 'The Service simulation needs catalog or inventory on the board.' })
  if (api && !edge.waf) out.push({ tone: 'bad', text: 'The partner call is public HTTP. Place one WAF in front of both services.' })
  if (api && !edge.gw) {
    out.push({
      tone: 'bad',
      text: 'The caller is an API client. Place the gateway after the WAF. It checks the key and sends each path to the right service.',
    })
  }
  if (!api && edge.gw) out.push({ tone: 'bad', text: 'The gateway is on the board, and there is no service to route to.' })
  if (api && !edge.lb) {
    out.push({
      tone: 'bad',
      text: 'A production API runs more than one task. Place an internal load balancer after the gateway and in front of the services.',
    })
  }
  if (pieces.web) {
    out.push({ tone: 'warn', text: 'The web app is on the board. This outside call does not enter through it.' })
  }
  if (!api && !pieces.web && pieces.db) {
    out.push({ tone: 'bad', text: 'The database is on the board with nothing in front of it that can query it.' })
  }
  return out
}

function natFindings(pieces: Pieces, spots: Spot[]): Finding[] {
  const out: Finding[] = []
  const hasNat = spots.some((spot) => spot.id === 'nat')
  if (needsNat(pieces) && !hasNat) {
    out.push({
      tone: 'warn',
      text: 'Private tasks that call the internet (SaaS, image pulls, patches) need a NAT gateway in a public subnet. Do not give the task a public IP instead.',
    })
  }
  const nat = spots.find((spot) => spot.id === 'nat')
  const client = spots.find((spot) => spot.id === 'client')
  if (nat && client && Math.abs(nat.y - client.y) < 36 && nat.x < client.x + NODE_W) {
    out.push({
      tone: 'bad',
      text: 'The NAT is on the inbound row. Browsers and partners never hit a NAT. Keep it on the private egress side.',
    })
  }
  return out
}

function leftOf(spots: Spot[], earlier: NodeId, later: NodeId) {
  const a = spots.find((spot) => spot.id === earlier)
  const b = spots.find((spot) => spot.id === later)
  if (!a || !b) return false
  if (Math.abs(a.y - b.y) >= 36) return false
  return a.x + NODE_W / 2 > b.x + NODE_W / 2 + 48
}

function above(spots: Spot[], anchor: NodeId, child: NodeId) {
  const a = spots.find((spot) => spot.id === anchor)
  const b = spots.find((spot) => spot.id === child)
  if (!a || !b) return false
  return b.y + NODE_H < a.y + 16
}

function orderFindings(situation: Situation, spots: Spot[]): Finding[] {
  const out: Finding[] = []
  const names: Record<NodeId, string> = {
    client: situation === 'page' ? 'browser' : 'outside caller',
    waf: 'WAF',
    lb: 'load balancer',
    gw: 'API gateway',
    web: 'web app',
    catalog: 'catalog',
    inventory: 'inventory',
    db: 'database',
    nat: 'NAT gateway',
  }
  const check = (earlier: NodeId, later: NodeId) => {
    if (leftOf(spots, earlier, later)) {
      out.push({
        tone: 'bad',
        text: `Read the public path left to right. The ${names[later]} is sitting in front of the ${names[earlier]}.`,
      })
    }
  }
  if (situation === 'page') {
    check('client', 'waf')
    check('waf', 'lb')
    check('waf', 'web')
    check('lb', 'web')
    for (const id of ['catalog', 'inventory', 'db', 'nat'] as NodeId[]) {
      const web = spots.find((spot) => spot.id === 'web')
      const child = spots.find((spot) => spot.id === id)
      if (web && child && Math.abs(web.y - child.y) < 36) {
        out.push({
          tone: 'bad',
          text:
            id === 'nat'
              ? 'The NAT is on the public inbound row. Keep it with private tasks — browsers never hit it.'
              : `${names[id][0].toUpperCase()}${names[id].slice(1)} is on the public row. The web app calls it in private, so it sits below the page path.`,
        })
      }
    }
    return out
  }
  check('client', 'waf')
  check('waf', 'gw')
  check('gw', 'lb')
  check('gw', 'catalog')
  check('gw', 'inventory')
  check('lb', 'catalog')
  check('lb', 'inventory')
  if (above(spots, 'catalog', 'db') || above(spots, 'inventory', 'db')) {
    out.push({ tone: 'bad', text: 'The database sits above the services. It stays behind them.' })
  }
  return out
}

function holdsText(situation: Situation, pieces: Pieces, edge: Edge) {
  if (situation === 'page') {
    const hops = ['Browser', edge.waf ? 'the WAF' : '', edge.lb ? 'the load balancer' : '', 'the web app'].filter(Boolean)
    const apis = [pieces.catalog ? 'catalog' : '', pieces.inventory ? 'inventory' : ''].filter(Boolean)
    const apiSentence =
      apis.length > 0
        ? ` ${apis.length === 1 ? `${apis[0][0].toUpperCase()}${apis[0].slice(1)} is a private call` : `${apis[0][0].toUpperCase()}${apis[0].slice(1)} and ${apis[1]} are private calls`} from the web app, with no second WAF and no public gateway.`
        : ''
    const db = pieces.db ? ' The database stays behind the app.' : ''
    const nat = needsNat(pieces)
      ? ' Private tasks that must call the internet leave through a NAT gateway, not a public IP.'
      : ''
    return `${hops.join(', then ')}.${apiSentence}${db}${nat}`
  }
  const services = [pieces.catalog ? 'catalog' : '', pieces.inventory ? 'inventory' : ''].filter(Boolean)
  const hops = [
    'The outside caller',
    edge.waf ? 'the WAF' : '',
    edge.gw ? 'the API gateway' : '',
    edge.lb ? 'the internal load balancer' : '',
    services.join(' and '),
  ].filter(Boolean)
  const db = pieces.db ? ' The database stays behind the services.' : ''
  const nat = needsNat(pieces)
    ? ' Those services egress through a NAT when they need the public internet.'
    : ''
  return `${hops.join(', then ')}.${db}${nat}`
}

function arrange(situation: Situation, pieces: Pieces, width: number): Spot[] {
  const edge = suggested(situation, pieces)
  const chain: NodeId[] = ['client']
  if (edge.waf) chain.push('waf')
  if (situation === 'page') {
    if (edge.lb) chain.push('lb')
    if (pieces.web) chain.push('web')
  } else {
    if (edge.gw) chain.push('gw')
    if (edge.lb) chain.push('lb')
  }
  const room = Math.max(width, 320)
  const free = room - PAD * 2 - chain.length * NODE_W
  const gap = chain.length <= 1 ? 20 : Math.max(12, Math.min(28, Math.floor(free / (chain.length - 1))))
  const y = 28
  const spots: Spot[] = chain.map((id, index) => ({ id, x: PAD + index * (NODE_W + gap), y }))

  const placeGroup = (ids: NodeId[], top: number, anchorX: number) => {
    if (ids.length === 0) return
    const groupW = ids.length * NODE_W + (ids.length - 1) * 16
    const maxX = Math.max(PAD, room - PAD - groupW)
    const centered = anchorX + NODE_W / 2 - groupW / 2
    const x = Math.min(Math.max(PAD, centered), maxX)
    ids.forEach((id, index) => spots.push({ id, x: x + index * (NODE_W + 16), y: top }))
  }

  const centerUnder = (ids: NodeId[], top: number) => {
    const first = spots.find((spot) => spot.id === ids[0])
    const last = spots.find((spot) => spot.id === ids[ids.length - 1])
    if (!first || !last) return
    const mid = (first.x + last.x + NODE_W) / 2 - NODE_W / 2
    spots.push({ id: 'db', x: Math.max(PAD, Math.min(mid, room - PAD - NODE_W)), y: top })
  }

  const placeNatBeside = (top: number, fallbackX: number) => {
    if (!needsNat(pieces)) return
    const row = spots.filter((spot) => Math.abs(spot.y - top) < 8)
    const right = row.reduce<Spot | null>((best, spot) => (!best || spot.x > best.x ? spot : best), null)
    const anchorX = right ? right.x : fallbackX
    const beside = Math.max(PAD, anchorX + NODE_W + 28)
    if (beside + NODE_W <= room - PAD) {
      spots.push({ id: 'nat', x: beside, y: top })
      return
    }
    // Drop under the private row; let the sheet grow rather than overlap the database.
    const underY = top + NODE_H + 32
    const underRow = spots.filter((spot) => Math.abs(spot.y - underY) < 8)
    const underRight = underRow.reduce<Spot | null>((best, spot) => (!best || spot.x > best.x ? spot : best), null)
    const underX = underRight ? underRight.x + NODE_W + 28 : anchorX
    spots.push({
      id: 'nat',
      x: Math.max(PAD, underX),
      y: underY,
    })
  }

  if (situation === 'page') {
    const priv = (['catalog', 'inventory'] as const).filter((id) => pieces[id])
    const web = spots.find((spot) => spot.id === 'web')
    const privateY = y + NODE_H + 44
    placeGroup([...priv], privateY, web ? web.x : PAD)
    if (pieces.db) {
      const under = priv.length > 0 ? [...priv] : web ? (['web'] as NodeId[]) : []
      if (under.length > 0) centerUnder(under, privateY + (priv.length > 0 ? NODE_H + 32 : 0))
    }
    placeNatBeside(privateY, web ? web.x : PAD)
    return spots
  }

  const services = (['catalog', 'inventory'] as const).filter((id) => pieces[id])
  const fork = spots.find((spot) => spot.id === 'lb') ?? spots.find((spot) => spot.id === 'gw') ?? spots[spots.length - 1]
  const rowY = y + NODE_H + 44
  placeGroup([...services], rowY, fork.x)
  if (pieces.db) {
    const under = services.length > 0 ? [...services] : [fork.id]
    centerUnder(under, rowY + (services.length > 0 ? NODE_H + 32 : 0))
  }
  placeNatBeside(rowY, fork.x)
  if (pieces.web) {
    const below = rowY + NODE_H + 32 + (pieces.db ? NODE_H + 16 : 0)
    spots.push({ id: 'web', x: PAD, y: below })
  }
  return spots
}

function wires(situation: Situation, spots: Spot[]): Wire[] {
  const has = (id: NodeId) => spots.some((spot) => spot.id === id)
  const out: Wire[] = []
  const join = (from: NodeId, to: NodeId, quiet = false, bad = false) => {
    if (has(from) && has(to)) out.push({ from, to, quiet, bad })
  }
  if (situation === 'page') {
    const mid: NodeId | null = has('lb') ? 'lb' : has('waf') ? 'waf' : 'client'
    join('client', 'waf')
    join('waf', 'lb')
    if (has('gw')) join(has('waf') ? 'waf' : 'client', 'gw', false, true)
    join(mid, 'web')
    join('web', 'catalog', true)
    join('web', 'inventory', true)
    if (has('catalog') || has('inventory')) {
      join('catalog', 'db', true)
      join('inventory', 'db', true)
      join('catalog', 'nat', true)
      join('inventory', 'nat', true)
    } else {
      join('web', 'db', true)
      join('web', 'nat', true)
    }
    return out
  }
  join('client', 'waf')
  join('waf', 'gw')
  join('gw', 'lb')
  const fork: NodeId = has('lb') ? 'lb' : has('gw') ? 'gw' : has('waf') ? 'waf' : 'client'
  join(fork, 'catalog')
  join(fork, 'inventory')
  join('catalog', 'db', true)
  join('inventory', 'db', true)
  join('catalog', 'nat', true)
  join('inventory', 'nat', true)
  return out
}

function plainLinks(list: Wire[]): Link[] {
  return list.filter((link) => !link.bad).map((link) => ({ from: link.from, to: link.to }))
}

function paintLink(situation: Situation, spots: Spot[], link: Link): Wire {
  const match = wires(situation, spots).find((item) => item.from === link.from && item.to === link.to)
  if (match) return match
  return { ...link, quiet: false, bad: true }
}

function noteFor(id: NodeId, situation: Situation): { label: string; note: string; tone: Tone } {
  if (id === 'client') {
    return situation === 'page'
      ? { label: 'Browser', note: 'Searches a page', tone: 'ok' }
      : { label: 'Outside caller', note: 'Calls the APIs', tone: 'ok' }
  }
  if (id === 'waf') return { label: 'WAF', note: situation === 'page' ? 'Public search' : 'One door', tone: 'ok' }
  if (id === 'lb') {
    return {
      label: situation === 'outside' ? 'Internal LB' : 'Load balancer',
      note: situation === 'outside' ? 'Behind the gateway' : 'Picks a process',
      tone: 'ok',
    }
  }
  if (id === 'gw') {
    return {
      label: 'API gateway',
      note: situation === 'page' ? 'Not on this page' : 'Key, quota, route',
      tone: situation === 'page' ? 'bad' : 'ok',
    }
  }
  if (id === 'web') {
    return {
      label: 'Web app',
      note: situation === 'page' ? 'Renders the page' : 'Not on this call',
      tone: situation === 'page' ? 'ok' : 'warn',
    }
  }
  if (id === 'catalog') {
    return { label: 'Catalog', note: situation === 'page' ? 'Private call' : '/v1/products', tone: situation === 'page' ? 'private' : 'ok' }
  }
  if (id === 'inventory') {
    return { label: 'Inventory', note: situation === 'page' ? 'Private call' : '/v1/stock', tone: situation === 'page' ? 'private' : 'ok' }
  }
  if (id === 'nat') {
    return {
      label: 'NAT gateway',
      note: 'Egress only · public subnet',
      tone: 'warn',
    }
  }
  return {
    label: 'Database',
    note: situation === 'page' ? 'Behind the app' : 'Behind the services',
    tone: 'private',
  }
}

function wireFindings(situation: Situation, spots: Spot[], drawn: Link[]): Finding[] {
  const expected = wires(situation, spots)
  const label = (id: NodeId) => noteFor(id, situation).label
  const out: Finding[] = []
  for (const link of expected) {
    if (link.bad) continue
    if (!drawn.some((item) => item.from === link.from && item.to === link.to)) {
      out.push({ tone: 'bad', text: `Draw the wire from ${label(link.from)} to ${label(link.to)}.` })
    }
  }
  for (const link of drawn) {
    if (!expected.some((item) => item.from === link.from && item.to === link.to)) {
      out.push({
        tone: 'bad',
        text: `The wire from ${label(link.from)} to ${label(link.to)} does not belong on this path.`,
      })
    }
  }
  return out
}

function ports(from: Spot, to: Spot) {
  const acx = from.x + NODE_W / 2
  const acy = from.y + NODE_H / 2
  const bcx = to.x + NODE_W / 2
  const bcy = to.y + NODE_H / 2
  if (Math.abs(bcx - acx) >= Math.abs(bcy - acy)) {
    if (bcx >= acx) return { x1: from.x + NODE_W, y1: acy, x2: to.x, y2: bcy }
    return { x1: from.x, y1: acy, x2: to.x + NODE_W, y2: bcy }
  }
  if (bcy >= acy) return { x1: acx, y1: from.y + NODE_H, x2: bcx, y2: to.y }
  return { x1: acx, y1: from.y, x2: bcx, y2: to.y + NODE_H }
}

const PAGE_PIECES: Pieces = { web: true, catalog: true, inventory: true, db: true }
const SERVICE_PIECES: Pieces = { web: false, catalog: true, inventory: true, db: true }

export function EdgePlayground() {
  const sheetRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<Mode>('suggest')
  const [situation, setSituation] = useState<Situation>('page')
  const [pieces, setPieces] = useState<Pieces>(PAGE_PIECES)
  const [canvasW, setCanvasW] = useState(640)
  const [spots, setSpots] = useState<Spot[]>(() => arrange('page', PAGE_PIECES, 640))
  const [drawn, setDrawn] = useState<Link[] | null>(null)
  const [draft, setDraft] = useState<{ from: NodeId; x: number; y: number } | null>(null)
  const [dragId, setDragId] = useState<NodeId | null>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const measure = () => setCanvasW(el.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (mode !== 'suggest') return
    setSpots(arrange(situation, pieces, canvasW))
  }, [mode, situation, pieces, canvasW])

  const boardPieces = piecesOf(spots)
  const boardEdge = edgeOf(spots)
  const auto = wires(situation, spots)
  const manual = drawn ?? plainLinks(auto)
  const links = mode === 'check' ? manual.map((link) => paintLink(situation, spots, link)) : auto
  const draftFrom = draft ? spots.find((spot) => spot.id === draft.from) : null
  const issues = [
    ...findings(situation, boardPieces, boardEdge),
    ...orderFindings(situation, spots),
    ...natFindings(boardPieces, spots),
    ...(mode === 'check' ? wireFindings(situation, spots, manual) : []),
  ]
  const broken = issues.some((item) => item.tone === 'bad')

  function togglePiece(id: NodeId) {
    if (id === 'web' || id === 'catalog' || id === 'inventory' || id === 'db') {
      const key = id
      setPieces((current) => ({ ...current, [key]: !current[key] }))
    }
  }

  function toggleSpot(id: NodeId) {
    setSpots((current) => {
      if (current.some((spot) => spot.id === id)) return current.filter((spot) => spot.id !== id)
      const n = current.length
      return [...current, { id, x: 36 + (n % 3) * 28, y: 36 + n * 18 }]
    })
    setDrawn((current) => {
      const base = current ?? plainLinks(wires(situation, spots))
      return base.filter((link) => link.from !== id && link.to !== id)
    })
  }

  function nodeAt(clientX: number, clientY: number) {
    const sheet = sheetRef.current
    if (!sheet) return null
    const rect = sheet.getBoundingClientRect()
    const x = clientX - rect.left + sheet.scrollLeft
    const y = clientY - rect.top + sheet.scrollTop
    const hit = [...spots].reverse().find((spot) => x >= spot.x - 8 && x <= spot.x + NODE_W + 10 && y >= spot.y && y <= spot.y + NODE_H)
    return hit ? hit.id : null
  }

  function onPortPointerDown(id: NodeId, event: React.PointerEvent<HTMLButtonElement>) {
    event.stopPropagation()
    event.preventDefault()
    const sheet = sheetRef.current
    const spot = spots.find((item) => item.id === id)
    if (!sheet || !spot) return
    const fromX = spot.x + NODE_W
    const fromY = spot.y + NODE_H / 2
    setDraft({ from: id, x: fromX, y: fromY })
    const move = (ev: PointerEvent) => {
      const rect = sheet.getBoundingClientRect()
      setDraft({
        from: id,
        x: ev.clientX - rect.left + sheet.scrollLeft,
        y: ev.clientY - rect.top + sheet.scrollTop,
      })
    }
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      const target = nodeAt(ev.clientX, ev.clientY)
      setDraft(null)
      if (!target || target === id) return
      setDrawn((current) => {
        const base = current ?? plainLinks(wires(situation, spots))
        const rest = base.filter((link) => !((link.from === id && link.to === target) || (link.from === target && link.to === id)))
        return [...rest, { from: id, to: target }]
      })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  function onNodePointerDown(id: NodeId, event: React.PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('button')) return
    const spot = spots.find((item) => item.id === id)
    const sheet = sheetRef.current
    if (!spot || !sheet) return
    const rect = sheet.getBoundingClientRect()
    const offsetX = event.clientX - rect.left + sheet.scrollLeft - spot.x
    const offsetY = event.clientY - rect.top + sheet.scrollTop - spot.y
    setDragId(id)
    const move = (ev: PointerEvent) => {
      const nextRect = sheet.getBoundingClientRect()
      const x = Math.max(8, ev.clientX - nextRect.left + sheet.scrollLeft - offsetX)
      const y = Math.max(8, ev.clientY - nextRect.top + sheet.scrollTop - offsetY)
      setSpots((current) => current.map((item) => (item.id === id ? { ...item, x, y } : item)))
    }
    const up = () => {
      setDragId(null)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  function onPalettePointerDown(id: NodeId, event: React.PointerEvent<HTMLButtonElement>) {
    if (mode === 'suggest') {
      togglePiece(id)
      return
    }
    const startX = event.clientX
    const startY = event.clientY
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointerup', up)
      const sheet = sheetRef.current
      const moved = Math.hypot(ev.clientX - startX, ev.clientY - startY) > 6
      if (!sheet) return
      const rect = sheet.getBoundingClientRect()
      const inside =
        ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY >= rect.top && ev.clientY <= rect.bottom
      if (moved && inside) {
        const x = Math.max(8, ev.clientX - rect.left + sheet.scrollLeft - NODE_W / 2)
        const y = Math.max(8, ev.clientY - rect.top + sheet.scrollTop - NODE_H / 2)
        setSpots((current) => [...current.filter((spot) => spot.id !== id), { id, x, y }])
        return
      }
      if (!moved) toggleSpot(id)
    }
    window.addEventListener('pointerup', up)
  }

  const typeName = situation === 'page' ? 'Web app' : 'Service'

  return (
    <div className="edge-play">
      <div className="edge-choices" role="group" aria-label="Playground mode">
        <button
          type="button"
          className={mode === 'suggest' ? 'edge-choice edge-choice--on' : 'edge-choice'}
          aria-pressed={mode === 'suggest'}
          onClick={() => {
            setPieces(piecesOf(spots))
            setDrawn(null)
            setMode('suggest')
          }}
        >
          Suggest
        </button>
        <button
          type="button"
          className={mode === 'check' ? 'edge-choice edge-choice--on' : 'edge-choice'}
          aria-pressed={mode === 'check'}
          onClick={() => {
            setDrawn(plainLinks(wires(situation, spots)))
            setMode('check')
          }}
        >
          Check
        </button>
        <button
          type="button"
          className={situation === 'page' ? 'edge-choice edge-choice--on' : 'edge-choice'}
          aria-pressed={situation === 'page'}
          onClick={() => {
            setSituation('page')
            if (mode === 'suggest') setPieces(PAGE_PIECES)
          }}
        >
          Web app
        </button>
        <button
          type="button"
          className={situation === 'outside' ? 'edge-choice edge-choice--on' : 'edge-choice'}
          aria-pressed={situation === 'outside'}
          onClick={() => {
            setSituation('outside')
            if (mode === 'suggest') setPieces(SERVICE_PIECES)
          }}
        >
          Service
        </button>
      </div>

      <div className="edge-board">
        <aside className="edge-board__palette" aria-label="Components">
          <p className="edge-kicker">Pieces</p>
          <p className="edge-board__hint">
            {mode === 'suggest'
              ? 'Click a system piece. Suggest draws the inbound path, private calls, and a NAT for egress.'
              : 'Drag the dot on a box to another box to draw a wire. Click a wire to remove it. Left to right is the public path. NAT is egress from private tasks — not on that inbound row.'}
          </p>
          {PALETTE.map((item) => {
            const on = spots.some((spot) => spot.id === item.id)
            const locked =
              mode === 'suggest' && (item.id === 'waf' || item.id === 'lb' || item.id === 'gw' || item.id === 'nat')
            return (
              <button
                key={item.id}
                type="button"
                className={on ? 'edge-board__stamp edge-board__stamp--on' : 'edge-board__stamp'}
                aria-pressed={on}
                disabled={locked}
                onPointerDown={(event) => onPalettePointerDown(item.id, event)}
              >
                {item.label}
              </button>
            )
          })}
        </aside>
        <div className="edge-board__scroll" ref={scrollRef}>
          <div
            ref={sheetRef}
            className="edge-board__sheet"
            aria-label="Diagram"
            style={{
              minHeight: Math.max(440, spots.reduce((max, spot) => Math.max(max, spot.y + NODE_H + 72), 0)),
              minWidth: spots.reduce((max, spot) => Math.max(max, spot.x + NODE_W + 24), 0),
            }}
          >
            <svg className={mode === 'check' ? 'edge-board__wires edge-board__wires--live' : 'edge-board__wires'} aria-hidden={mode !== 'check'}>
              <defs>
                <marker id="edge-board-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                  <path d="M0 0 L8 4 L0 8 Z" />
                </marker>
                <marker id="edge-board-arrow-bad" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                  <path className="is-bad-head" d="M0 0 L8 4 L0 8 Z" />
                </marker>
              </defs>
              {links.map((link) => {
                const from = spots.find((spot) => spot.id === link.from)
                const to = spots.find((spot) => spot.id === link.to)
                if (!from || !to) return null
                const port = ports(from, to)
                const marker = link.bad ? 'url(#edge-board-arrow-bad)' : 'url(#edge-board-arrow)'
                return (
                  <g key={`${link.from}-${link.to}`}>
                    {mode === 'check' ? (
                      <line
                        x1={port.x1}
                        y1={port.y1}
                        x2={port.x2}
                        y2={port.y2}
                        className="is-hit"
                        onClick={() =>
                          setDrawn((current) =>
                            (current ?? plainLinks(wires(situation, spots))).filter(
                              (item) => !(item.from === link.from && item.to === link.to),
                            ),
                          )
                        }
                      >
                        <title>{`Remove wire from ${noteFor(link.from, situation).label} to ${noteFor(link.to, situation).label}`}</title>
                      </line>
                    ) : null}
                    <line
                      x1={port.x1}
                      y1={port.y1}
                      x2={port.x2}
                      y2={port.y2}
                      className={link.bad ? 'is-bad' : link.quiet ? 'is-quiet' : undefined}
                      markerEnd={marker}
                    />
                  </g>
                )
              })}
              {draft && draftFrom ? (
                <line
                  x1={draftFrom.x + NODE_W}
                  y1={draftFrom.y + NODE_H / 2}
                  x2={draft.x}
                  y2={draft.y}
                  className="is-draft"
                />
              ) : null}
            </svg>
            {spots.map((spot) => {
              const meta = noteFor(spot.id, situation)
              return (
                <div
                  key={spot.id}
                  className={`edge-board__node edge-board__node--${meta.tone}${dragId === spot.id ? ' edge-board__node--drag' : ''}`}
                  style={{ left: spot.x, top: spot.y }}
                  onPointerDown={(event) => onNodePointerDown(spot.id, event)}
                >
                  {spot.id === 'client' ||
                  (mode === 'suggest' && (spot.id === 'waf' || spot.id === 'lb' || spot.id === 'gw' || spot.id === 'nat')) ? null : (
                    <button
                      type="button"
                      className="edge-board__x"
                      aria-label={`Remove ${meta.label}`}
                      onClick={() => {
                        if (mode === 'suggest') togglePiece(spot.id)
                        else toggleSpot(spot.id)
                      }}
                    >
                      ×
                    </button>
                  )}
                  <strong>{meta.label}</strong>
                  <span>{meta.note}</span>
                  {mode === 'check' ? (
                    <button
                      type="button"
                      className="edge-board__port"
                      aria-label={`Draw a wire from ${meta.label}`}
                      onPointerDown={(event) => onPortPointerDown(spot.id, event)}
                    />
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className={broken ? 'edge-play__verdict edge-play__verdict--bad' : 'edge-play__verdict'} aria-live="polite">
        <p className="edge-kicker">
          {typeName} · {broken ? 'Breaks' : 'Holds'}
        </p>
        {broken ? null : <p>{holdsText(situation, boardPieces, boardEdge)}</p>}
        {issues.length > 0 ? (
          <ul className="edge-play__issues">
            {issues.map((item) => (
              <li key={item.text} className={item.tone === 'warn' ? 'edge-play__warn' : undefined}>
                {item.text}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
