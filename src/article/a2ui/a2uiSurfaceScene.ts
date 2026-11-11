import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  EdgesGeometry,
  GridHelper,
  Group,
  Line,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Vector3,
} from 'three'
import { mountGuideScene, readGuidePalette } from '../shared/guideThree'

export type SurfaceStep = 'blank' | 'bones' | 'filled' | 'action' | 'html-bad'

function makeLabel(text: string, color: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 96
  const ctx = canvas.getContext('2d')
  if (!ctx) return new Sprite()
  ctx.clearRect(0, 0, 512, 96)
  ctx.font = '700 36px Outfit, system-ui, sans-serif'
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 256, 48)
  const tex = new CanvasTexture(canvas)
  const sprite = new Sprite(
    new SpriteMaterial({ map: tex, transparent: true, depthTest: false }),
  )
  sprite.scale.set(2.8, 0.52, 1)
  return sprite
}

function rewriteTag(sprite: Sprite, text: string, bg: string, fg: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 420
  canvas.height = 96
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, 420, 96)
  ctx.fillStyle = bg
  const r = 12
  ctx.beginPath()
  ctx.moveTo(30 + r, 18)
  ctx.arcTo(390, 18, 390, 78, r)
  ctx.arcTo(390, 78, 30, 78, r)
  ctx.arcTo(30, 78, 30, 18, r)
  ctx.arcTo(30, 18, 390, 18, r)
  ctx.closePath()
  ctx.fill()
  ctx.font = '700 28px Outfit, system-ui, sans-serif'
  ctx.fillStyle = fg
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 210, 50)
  const tex = new CanvasTexture(canvas)
  tex.needsUpdate = true
  const mat = sprite.material as SpriteMaterial
  mat.map?.dispose()
  mat.map = tex
  sprite.visible = true
}

export function createA2uiSurfaceScene(host: HTMLElement) {
  const palette = readGuidePalette(host)
  const api = mountGuideScene(host, { fov: 36 })
  api.setBg(palette.bg)
  api.camera.position.set(0.4, 4.2, 11.5)
  api.camera.lookAt(0.4, 1.2, 0)

  const ground = new Mesh(
    new BoxGeometry(14, 0.1, 7),
    new MeshStandardMaterial({ color: palette.paper, roughness: 0.95 }),
  )
  ground.position.y = -0.05
  ground.receiveShadow = true
  api.scene.add(ground)

  const grid = new GridHelper(12, 24, new Color(palette.muted), new Color(palette.muted))
  grid.position.y = 0.02
  const gMat = grid.material as LineBasicMaterial | LineBasicMaterial[]
  if (Array.isArray(gMat)) {
    gMat.forEach((m) => {
      m.transparent = true
      m.opacity = 0.22
    })
  } else {
    gMat.transparent = true
    gMat.opacity = 0.22
  }
  api.scene.add(grid)

  const agent = new Group()
  agent.position.set(-3.5, 0, 0)
  const agentBody = new Mesh(
    new BoxGeometry(1.8, 1.45, 1.15),
    new MeshStandardMaterial({ color: palette.paper, roughness: 0.42, metalness: 0.1 }),
  )
  agentBody.position.y = 0.78
  agentBody.castShadow = true
  agent.add(agentBody)
  agent.add(new LineSegments(new EdgesGeometry(new BoxGeometry(1.8, 1.45, 1.15)), new LineBasicMaterial({ color: palette.fg, transparent: true, opacity: 0.45 })))
  agent.children[1].position.y = 0.78
  const agentCap = new Mesh(
    new BoxGeometry(1.9, 0.16, 1.22),
    new MeshStandardMaterial({ color: palette.accent, roughness: 0.35, metalness: 0.2 }),
  )
  agentCap.position.y = 1.58
  agent.add(agentCap)
  const agentGlow = new Mesh(
    new BoxGeometry(1.1, 0.4, 0.04),
    new MeshStandardMaterial({
      color: palette.accent,
      emissive: new Color(palette.accent),
      emissiveIntensity: 0.5,
    }),
  )
  agentGlow.position.set(0, 0.95, 0.6)
  agent.add(agentGlow)
  const agentLabel = makeLabel("Priya's agent", palette.fg)
  agentLabel.position.set(0, -0.45, 0)
  agent.add(agentLabel)

  const phone = new Group()
  phone.position.set(3.0, 0.05, 0)
  const shell = new Mesh(
    new BoxGeometry(2.15, 3.55, 0.28),
    new MeshStandardMaterial({ color: palette.fg, roughness: 0.55, metalness: 0.15 }),
  )
  shell.position.y = 1.85
  shell.castShadow = true
  phone.add(shell)
  phone.add(
    new LineSegments(
      new EdgesGeometry(new BoxGeometry(2.15, 3.55, 0.28)),
      new LineBasicMaterial({ color: palette.muted, transparent: true, opacity: 0.5 }),
    ),
  )
  phone.children[1].position.y = 1.85

  const bezel = new Mesh(
    new BoxGeometry(1.95, 3.25, 0.04),
    new MeshStandardMaterial({ color: '#111111', roughness: 0.8 }),
  )
  bezel.position.set(0, 1.85, 0.14)
  phone.add(bezel)

  const screen = new Mesh(
    new PlaneGeometry(1.75, 2.95),
    new MeshStandardMaterial({ color: palette.paper, roughness: 0.85 }),
  )
  screen.position.set(0, 1.85, 0.17)
  phone.add(screen)

  const notch = new Mesh(
    new BoxGeometry(0.55, 0.08, 0.03),
    new MeshStandardMaterial({ color: palette.fg, roughness: 0.5 }),
  )
  notch.position.set(0, 3.2, 0.18)
  phone.add(notch)

  const phoneLabel = makeLabel('Your renderer', palette.fg)
  phoneLabel.position.set(0, -0.2, 0)
  phone.add(phoneLabel)

  const widgetMats = [
    new MeshStandardMaterial({ color: palette.accent, roughness: 0.4, emissive: new Color(palette.accent), emissiveIntensity: 0.15 }),
    new MeshStandardMaterial({ color: palette.muted, roughness: 0.55 }),
    new MeshStandardMaterial({ color: palette.muted, roughness: 0.55 }),
    new MeshStandardMaterial({ color: palette.muted, roughness: 0.55 }),
    new MeshStandardMaterial({ color: palette.fg, roughness: 0.4 }),
  ]
  const widgets = [
    new Mesh(new BoxGeometry(1.45, 0.28, 0.07), widgetMats[0]),
    new Mesh(new BoxGeometry(1.45, 0.32, 0.07), widgetMats[1]),
    new Mesh(new BoxGeometry(1.45, 0.32, 0.07), widgetMats[2]),
    new Mesh(new BoxGeometry(1.45, 0.32, 0.07), widgetMats[3]),
    new Mesh(new BoxGeometry(1.15, 0.34, 0.08), widgetMats[4]),
  ]
  const homes = [
    new Vector3(0, 2.85, 0.22),
    new Vector3(0, 2.35, 0.22),
    new Vector3(0, 1.85, 0.22),
    new Vector3(0, 1.35, 0.22),
    new Vector3(0, 0.75, 0.22),
  ]
  widgets.forEach((w, i) => {
    w.position.copy(homes[i])
    w.visible = false
    w.castShadow = true
    phone.add(w)
  })

  const cablePts: Vector3[] = []
  for (let i = 0; i <= 24; i++) {
    const t = i / 24
    cablePts.push(
      new Vector3(
        -2.4 + t * 4.6,
        1.2 + Math.sin(t * Math.PI) * 0.7,
        Math.sin(t * Math.PI) * 0.15,
      ),
    )
  }
  const cable = new Line(
    new BufferGeometry().setFromPoints(cablePts),
    new LineBasicMaterial({ color: palette.accent, transparent: true, opacity: 0.55 }),
  )
  api.scene.add(cable)

  const packetMat = new MeshStandardMaterial({
    color: palette.accent,
    emissive: new Color(palette.accent),
    emissiveIntensity: 0.65,
    roughness: 0.3,
    metalness: 0.3,
  })
  const packet = new Mesh(new SphereGeometry(0.2, 20, 20), packetMat)
  packet.visible = false
  packet.castShadow = true

  const packetHalo = new Mesh(
    new SphereGeometry(0.34, 16, 16),
    new MeshBasicMaterial({ color: palette.accent, transparent: true, opacity: 0.16 }),
  )
  packetHalo.visible = false

  const danger = new Mesh(
    new BoxGeometry(1.55, 1.1, 0.14),
    new MeshStandardMaterial({
      color: palette.fail,
      emissive: new Color(palette.fail),
      emissiveIntensity: 0.35,
      roughness: 0.4,
    }),
  )
  danger.position.set(3.0, 1.9, 0.35)
  danger.visible = false

  const tag = new Sprite(
    new SpriteMaterial({ transparent: true, depthTest: false, map: null }),
  )
  tag.scale.set(2.4, 0.55, 1)
  tag.visible = false

  api.scene.add(agent, phone, packet, packetHalo, danger, tag)

  let step: SurfaceStep = 'blank'
  let flying = false
  let animT = 0
  const from = new Vector3()
  const to = new Vector3()

  const showWidgets = (mode: 'bones' | 'filled' | 'action') => {
    widgets.forEach((w, i) => {
      w.visible = true
      const mat = w.material as MeshStandardMaterial
      if (mode === 'bones') {
        mat.transparent = true
        mat.opacity = 0.4
        mat.color.set(i === 0 || i === 4 ? palette.accent : palette.muted)
        mat.emissiveIntensity = 0
      } else if (mode === 'filled') {
        mat.transparent = false
        mat.opacity = 1
        mat.color.set(i === 0 || i === 4 ? palette.accent : palette.fg)
        mat.emissiveIntensity = i === 0 ? 0.2 : 0
      } else {
        mat.transparent = false
        mat.opacity = 1
        mat.color.set(i === 4 ? palette.accent : palette.fg)
        mat.emissiveIntensity = i === 4 ? 0.55 : 0
      }
    })
  }

  const setStep = (next: SurfaceStep) => {
    step = next
    flying = false
    packet.visible = false
    packetHalo.visible = false
    danger.visible = false
    tag.visible = false
    widgets.forEach((w) => {
      w.visible = false
    })
    ;(screen.material as MeshStandardMaterial).color.set(palette.paper)
    ;(cable.material as LineBasicMaterial).opacity = 0.35

    if (next === 'blank') {
      rewriteTag(tag, 'createSurface', palette.fg, palette.paper)
      tag.position.set(-1.2, 2.4, 0)
    } else if (next === 'bones') {
      showWidgets('bones')
      packet.visible = true
      packetHalo.visible = true
      flying = true
      animT = 0
      from.set(-2.4, 1.2, 0)
      to.set(2.2, 2.4, 0.3)
      rewriteTag(tag, 'updateComponents', palette.accent, '#ffffff')
      ;(cable.material as LineBasicMaterial).opacity = 0.85
    } else if (next === 'filled') {
      showWidgets('filled')
      packet.visible = true
      packetHalo.visible = true
      packet.position.set(0.2, 1.8, 0.4)
      packetHalo.position.copy(packet.position)
      rewriteTag(tag, 'updateDataModel', palette.accent, '#ffffff')
      tag.position.set(0.2, 2.5, 0.4)
      ;(cable.material as LineBasicMaterial).opacity = 0.7
    } else if (next === 'action') {
      showWidgets('action')
      packet.visible = true
      packetHalo.visible = true
      flying = true
      animT = 0
      from.set(2.3, 0.9, 0.35)
      to.set(-2.5, 1.1, 0)
      rewriteTag(tag, 'action', palette.fg, palette.paper)
      ;(cable.material as LineBasicMaterial).opacity = 0.9
    } else if (next === 'html-bad') {
      danger.visible = true
      ;(screen.material as MeshStandardMaterial).color.set(palette.fail)
      rewriteTag(tag, 'agent HTML — bad', palette.fail, '#ffffff')
      tag.position.set(3.0, 3.2, 0.4)
      ;(cable.material as LineBasicMaterial).opacity = 0.15
    }
  }

  api.onFrame((t) => {
    const s = t * 0.001
    agent.rotation.y = Math.sin(s * 0.55) * 0.05
    phone.rotation.y = Math.sin(s * 0.45 + 0.7) * 0.07
    const pulse = 0.5 + Math.sin(s * 3) * 0.5

    if (flying) {
      animT = Math.min(1, animT + 0.018)
      const eased = animT * animT * (3 - 2 * animT)
      packet.position.lerpVectors(from, to, eased)
      packet.position.y += Math.sin(eased * Math.PI) * 0.45
      packetHalo.position.copy(packet.position)
      tag.position.set(packet.position.x, packet.position.y + 0.55, packet.position.z)
      if (animT >= 1) flying = false
    } else if (packet.visible && step === 'filled') {
      packet.rotation.y = s * 1.6
      packetHalo.scale.setScalar(1 + pulse * 0.2)
      tag.position.set(packet.position.x, packet.position.y + 0.55, packet.position.z)
    }

    if (packet.visible) {
      ;(packetHalo.material as MeshBasicMaterial).opacity = 0.1 + pulse * 0.12
      packetMat.emissiveIntensity = 0.45 + pulse * 0.35
    }
    if (danger.visible) {
      danger.position.y = 1.9 + Math.sin(s * 4) * 0.05
    }
  })

  return { setStep, dispose: api.dispose }
}
