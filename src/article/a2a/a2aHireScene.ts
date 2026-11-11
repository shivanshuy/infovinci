import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  EdgesGeometry,
  GridHelper,
  Group,
  Line,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  RingGeometry,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Vector3,
} from 'three'
import { mountGuideScene, readGuidePalette } from '../shared/guideThree'

export type HireStep = 'idle' | 'card' | 'send' | 'task' | 'done'

function makeLabel(text: string, fg: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (!ctx) return new Sprite()
  ctx.clearRect(0, 0, 512, 128)
  ctx.font = '700 44px Outfit, system-ui, sans-serif'
  ctx.fillStyle = fg
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 256, 64)
  const tex = new CanvasTexture(canvas)
  const sprite = new Sprite(
    new SpriteMaterial({ map: tex, transparent: true, depthTest: false }),
  )
  sprite.scale.set(3.4, 0.85, 1)
  return sprite
}

function makeSubLabel(text: string, color: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 96
  const ctx = canvas.getContext('2d')
  if (!ctx) return new Sprite()
  ctx.clearRect(0, 0, 512, 96)
  ctx.font = '600 26px ui-monospace, monospace'
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text.toUpperCase(), 256, 48)
  const tex = new CanvasTexture(canvas)
  const sprite = new Sprite(
    new SpriteMaterial({ map: tex, transparent: true, depthTest: false }),
  )
  sprite.scale.set(2.8, 0.52, 1)
  return sprite
}

function makeTag(text: string, bg: string, fg: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 384
  canvas.height = 96
  const ctx = canvas.getContext('2d')
  if (!ctx) return new Sprite()
  ctx.clearRect(0, 0, 384, 96)
  ctx.fillStyle = bg
  roundRect(ctx, 24, 18, 336, 60, 10)
  ctx.fill()
  ctx.font = '700 28px Outfit, system-ui, sans-serif'
  ctx.fillStyle = fg
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 192, 50)
  const tex = new CanvasTexture(canvas)
  const sprite = new Sprite(
    new SpriteMaterial({ map: tex, transparent: true, depthTest: false }),
  )
  sprite.scale.set(2.2, 0.55, 1)
  sprite.visible = false
  return sprite
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

type Pod = {
  group: Group
  accentMat: MeshStandardMaterial
  glowMat: MeshStandardMaterial
  ringMat: MeshBasicMaterial
  knob: Mesh
  ring: Mesh
}

function makeAgentPod(opts: {
  paper: string
  fg: string
  accent: string
  cap: string
  title: string
  sub: string
}): Pod {
  const group = new Group()
  const bodyMat = new MeshStandardMaterial({
    color: opts.paper,
    roughness: 0.42,
    metalness: 0.1,
  })
  const edgeMat = new LineBasicMaterial({ color: opts.fg, transparent: true, opacity: 0.5 })
  const accentMat = new MeshStandardMaterial({
    color: opts.cap,
    roughness: 0.32,
    metalness: 0.2,
  })

  const body = new Mesh(new BoxGeometry(1.95, 1.6, 1.3), bodyMat)
  body.position.y = 0.8
  body.castShadow = true
  body.receiveShadow = true
  group.add(body)

  const edges = new LineSegments(new EdgesGeometry(new BoxGeometry(1.95, 1.6, 1.3)), edgeMat)
  edges.position.y = 0.8
  group.add(edges)

  const base = new Mesh(
    new BoxGeometry(2.15, 0.12, 1.5),
    new MeshStandardMaterial({ color: opts.fg, roughness: 0.7 }),
  )
  base.position.y = 0.06
  base.receiveShadow = true
  group.add(base)

  const cap = new Mesh(new BoxGeometry(2.05, 0.18, 1.38), accentMat)
  cap.position.y = 1.68
  cap.castShadow = true
  group.add(cap)

  const screen = new Mesh(
    new BoxGeometry(1.4, 0.78, 0.06),
    new MeshStandardMaterial({ color: opts.fg, roughness: 0.55 }),
  )
  screen.position.set(0, 0.98, 0.67)
  group.add(screen)

  const glowMat = new MeshStandardMaterial({
    color: opts.accent,
    emissive: new Color(opts.accent),
    emissiveIntensity: 0.4,
    roughness: 0.35,
  })
  const glow = new Mesh(new BoxGeometry(1.1, 0.46, 0.04), glowMat)
  glow.position.set(0, 0.98, 0.71)
  group.add(glow)

  const antenna = new Mesh(
    new CylinderGeometry(0.045, 0.055, 0.58, 12),
    new MeshStandardMaterial({ color: opts.fg, roughness: 0.35, metalness: 0.3 }),
  )
  antenna.position.set(0.72, 2.05, 0)
  group.add(antenna)

  const knob = new Mesh(
    new SphereGeometry(0.13, 18, 18),
    new MeshStandardMaterial({
      color: opts.accent,
      emissive: new Color(opts.accent),
      emissiveIntensity: 0.55,
      roughness: 0.28,
      metalness: 0.3,
    }),
  )
  knob.position.set(0.72, 2.38, 0)
  group.add(knob)

  const ringMat = new MeshBasicMaterial({ color: opts.accent, transparent: true, opacity: 0 })
  const ring = new Mesh(new RingGeometry(1.2, 1.38, 56), ringMat)
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.03
  group.add(ring)

  const title = makeLabel(opts.title, opts.fg)
  title.position.set(0, -0.42, 0)
  group.add(title)

  const sub = makeSubLabel(opts.sub, opts.fg)
  sub.position.set(0, -0.82, 0)
  ;(sub.material as SpriteMaterial).opacity = 0.5
  group.add(sub)

  return { group, accentMat, glowMat, ringMat, knob, ring }
}

function pointOnCable(t: number, leftX: number, rightX: number) {
  const x = leftX + (rightX - leftX) * t
  const y = 1.2 + Math.sin(t * Math.PI) * 0.95
  const z = Math.sin(t * Math.PI * 2) * 0.12
  return new Vector3(x, y, z)
}

export function createA2aHireScene(host: HTMLElement) {
  const palette = readGuidePalette(host)
  const api = mountGuideScene(host, { fov: 34 })
  api.setBg(palette.bg)
  api.camera.position.set(0.2, 5.1, 12.4)
  api.camera.lookAt(0, 1.0, 0)

  const ground = new Mesh(
    new BoxGeometry(15, 0.1, 8),
    new MeshStandardMaterial({ color: palette.paper, roughness: 0.95, metalness: 0 }),
  )
  ground.position.y = -0.05
  ground.receiveShadow = true
  api.scene.add(ground)

  const grid = new GridHelper(13, 26, new Color(palette.muted), new Color(palette.muted))
  grid.position.y = 0.02
  const gridMat = grid.material as LineBasicMaterial | LineBasicMaterial[]
  if (Array.isArray(gridMat)) {
    gridMat.forEach((m) => {
      m.transparent = true
      m.opacity = 0.25
    })
  } else {
    gridMat.transparent = true
    gridMat.opacity = 0.25
  }
  api.scene.add(grid)

  const left = makeAgentPod({
    paper: palette.paper,
    fg: palette.fg,
    accent: palette.accent,
    cap: palette.accent,
    title: "Priya's agent",
    sub: 'A2A client',
  })
  left.group.position.set(-3.7, 0, 0)

  const right = makeAgentPod({
    paper: palette.paper,
    fg: palette.fg,
    accent: palette.accent,
    cap: palette.fg,
    title: "Harbor's agent",
    sub: 'remote hire',
  })
  right.group.position.set(3.7, 0, 0)

  const cablePts: Vector3[] = []
  for (let i = 0; i <= 32; i++) {
    cablePts.push(pointOnCable(i / 32, -2.55, 2.55))
  }
  const cableGeo = new BufferGeometry().setFromPoints(cablePts)
  const cableMat = new LineBasicMaterial({
    color: palette.accent,
    transparent: true,
    opacity: 0.7,
  })
  const cable = new Line(cableGeo, cableMat)
  api.scene.add(cable)

  const guide = new Mesh(
    new BoxGeometry(5.4, 0.03, 0.35),
    new MeshStandardMaterial({
      color: palette.accent,
      transparent: true,
      opacity: 0.12,
      roughness: 1,
    }),
  )
  guide.position.set(0, 0.08, 0)
  api.scene.add(guide)

  const packetMat = new MeshStandardMaterial({
    color: palette.accent,
    emissive: new Color(palette.accent),
    emissiveIntensity: 0.7,
    roughness: 0.25,
    metalness: 0.35,
  })
  const packet = new Mesh(new SphereGeometry(0.22, 24, 24), packetMat)
  packet.visible = false
  packet.castShadow = true
  api.scene.add(packet)

  const packetHalo = new Mesh(
    new SphereGeometry(0.38, 20, 20),
    new MeshBasicMaterial({ color: palette.accent, transparent: true, opacity: 0.18 }),
  )
  packetHalo.visible = false
  api.scene.add(packetHalo)

  const fog = new Group()
  fog.visible = false
  fog.position.set(3.7, 2.55, 0)
  for (let i = 0; i < 5; i++) {
    const blob = new Mesh(
      new SphereGeometry(0.35 + i * 0.08, 16, 16),
      new MeshStandardMaterial({
        color: palette.accent,
        transparent: true,
        opacity: 0.2,
        roughness: 1,
        depthWrite: false,
      }),
    )
    blob.position.set((i - 2) * 0.22, (i % 2) * 0.15, (i % 3) * 0.1 - 0.1)
    fog.add(blob)
  }
  const fogTag = makeTag('private tools', palette.fg, palette.paper)
  fogTag.position.set(0, 0.85, 0)
  fogTag.visible = true
  fog.add(fogTag)
  api.scene.add(fog)

  const tag = makeTag('Agent Card', palette.accent, '#ffffff')
  tag.position.set(0, 2.7, 0)
  api.scene.add(tag)

  const gapPlate = new Mesh(
    new BoxGeometry(1.6, 0.04, 1.1),
    new MeshStandardMaterial({
      color: palette.fg,
      transparent: true,
      opacity: 0.08,
      roughness: 1,
    }),
  )
  gapPlate.position.set(0, 0.06, 1.8)
  api.scene.add(gapPlate)

  api.scene.add(left.group, right.group)

  let step: HireStep = 'idle'
  let animT = 0
  let flying = false
  let flyFrom = 0
  let flyTo = 1
  let pulse = 0

  const setLit = (pod: Pod, on: boolean, capColor: string) => {
    pod.accentMat.color.set(capColor)
    pod.glowMat.emissiveIntensity = on ? 0.85 : 0.25
    pod.ringMat.opacity = on ? 0.55 : 0.08
  }

  const placePacket = (t: number) => {
    const p = pointOnCable(t, -2.55, 2.55)
    packet.position.copy(p)
    packetHalo.position.copy(p)
  }

  const setStep = (next: HireStep) => {
    step = next
    flying = false
    animT = 0
    packet.visible = false
    packetHalo.visible = false
    fog.visible = false
    tag.visible = false
    cableMat.opacity = 0.35
    setLit(left, false, palette.accent)
    setLit(right, false, palette.fg)

    if (next === 'idle') {
      cableMat.opacity = 0.25
    } else if (next === 'card') {
      setLit(right, true, palette.accent)
      packet.visible = true
      packetHalo.visible = true
      flying = true
      flyFrom = 1
      flyTo = 0
      placePacket(1)
      rewriteTag(tag, 'Agent Card', palette.accent, '#ffffff')
      cableMat.opacity = 0.85
    } else if (next === 'send') {
      setLit(left, true, palette.accent)
      packet.visible = true
      packetHalo.visible = true
      flying = true
      flyFrom = 0
      flyTo = 1
      placePacket(0)
      rewriteTag(tag, 'SendMessage', palette.fg, palette.paper)
      cableMat.opacity = 0.9
    } else if (next === 'task') {
      setLit(right, true, palette.accent)
      fog.visible = true
      packet.visible = true
      packetHalo.visible = true
      placePacket(0.72)
      rewriteTag(tag, 'Task · WORKING', palette.accent, '#ffffff')
      cableMat.opacity = 0.55
    } else if (next === 'done') {
      setLit(left, true, palette.accent)
      setLit(right, true, palette.accent)
      packet.visible = true
      packetHalo.visible = true
      flying = true
      flyFrom = 1
      flyTo = 0
      placePacket(1)
      rewriteTag(tag, 'Artifact', palette.accent, '#ffffff')
      cableMat.opacity = 0.9
    }
  }

  api.onFrame((t) => {
    const s = t * 0.001
    pulse = 0.5 + Math.sin(s * 3.2) * 0.5
    left.group.position.y = Math.sin(s * 1.1) * 0.04
    right.group.position.y = Math.sin(s * 1.1 + 1.4) * 0.04
    left.knob.position.y = 2.38 + Math.sin(s * 4) * 0.03
    right.knob.position.y = 2.38 + Math.sin(s * 4 + 0.8) * 0.03

    if (step === 'task') {
      fog.rotation.y = s * 0.4
      fog.children.forEach((child, i) => {
        if (child instanceof Mesh) {
          child.position.y = (i % 2) * 0.15 + Math.sin(s * 2 + i) * 0.08
        }
      })
      packet.position.y = pointOnCable(0.72, -2.55, 2.55).y + Math.sin(s * 3) * 0.1
      packetHalo.position.copy(packet.position)
      packetMat.emissiveIntensity = 0.45 + pulse * 0.4
    }

    if (flying) {
      animT = Math.min(1, animT + 0.016)
      const eased = animT * animT * (3 - 2 * animT)
      const u = flyFrom + (flyTo - flyFrom) * eased
      placePacket(u)
      packet.rotation.y = s * 4
      if (animT >= 1) {
        flying = false
        if (step === 'card') setLit(left, true, palette.accent)
        if (step === 'send') setLit(right, true, palette.accent)
        if (step === 'done') setLit(left, true, palette.accent)
      }
    }

    if (packet.visible) {
      packetHalo.scale.setScalar(1 + pulse * 0.25)
      ;(packetHalo.material as MeshBasicMaterial).opacity = 0.12 + pulse * 0.12
      tag.position.set(packet.position.x, packet.position.y + 0.7, packet.position.z)
    }

  })

  return {
    setStep,
    dispose: api.dispose,
  }
}

function rewriteTag(sprite: Sprite, text: string, bg: string, fg: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 384
  canvas.height = 96
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, 384, 96)
  ctx.fillStyle = bg
  roundRect(ctx, 24, 18, 336, 60, 10)
  ctx.fill()
  ctx.font = '700 28px Outfit, system-ui, sans-serif'
  ctx.fillStyle = fg
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 192, 50)
  const tex = new CanvasTexture(canvas)
  tex.needsUpdate = true
  const mat = sprite.material as SpriteMaterial
  mat.map?.dispose()
  mat.map = tex
  sprite.visible = true
}
