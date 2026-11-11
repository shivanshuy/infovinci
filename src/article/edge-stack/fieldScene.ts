import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  Object3D,
  DirectionalLight,
  DoubleSide,
  EdgesGeometry,
  GridHelper,
  Group,
  Line,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Material,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  RingGeometry,
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

export type FieldStation = 'request' | 'waf' | 'lb' | 'gw' | 'appA' | 'appB'
export type FieldTone = 'run' | 'deny' | 'ok' | 'skip'
export type FieldCamera = 'iso' | 'front' | 'top'

export type FieldView = {
  active: FieldStation
  tone: FieldTone
  dim: FieldStation[]
  isolated: FieldStation | null
  exploded: boolean
  snap: boolean
}

type StationNode = {
  id: FieldStation
  group: Group
  body: MeshStandardMaterial
  edges: LineBasicMaterial
  ring: MeshBasicMaterial
  home: Vector3
  height: number
}

type Palette = {
  bg: string
  paper: string
  panel: string
  fg: string
  accent: string
  fail: string
  grid: string
}

const SPECS: { id: FieldStation; at: [number, number]; size: [number, number, number]; knob?: boolean; pegs?: boolean }[] = [
  { id: 'request', at: [-5.1, -0.15], size: [1.35, 0.42, 0.9] },
  { id: 'waf', at: [-2.7, -0.15], size: [1.15, 1.2, 0.95], knob: true },
  { id: 'lb', at: [-0.15, -0.15], size: [1.7, 0.58, 1.15], pegs: true },
  { id: 'appA', at: [2.85, -1.65], size: [0.9, 1.65, 0.8] },
  { id: 'gw', at: [-0.15, 1.85], size: [1.15, 1.0, 0.85] },
  { id: 'appB', at: [2.85, 1.7], size: [0.9, 1.45, 0.8] },
]

const LINKS: [FieldStation, FieldStation][] = [
  ['request', 'waf'],
  ['waf', 'lb'],
  ['lb', 'appA'],
  ['lb', 'gw'],
  ['gw', 'appB'],
]

function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement)
  const pick = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback
  return {
    bg: pick('--bg', '#ffffff'),
    paper: pick('--paper', '#fafafa'),
    panel: pick('--panel-bg', '#f3f3f3'),
    fg: pick('--fg', '#0a0a0a'),
    accent: pick('--accent', '#f35422'),
    fail: pick('--fail-border', '#c2410c'),
    grid: pick('--border-strong', '#cfcfcf'),
  }
}

export class FieldScene {
  private readonly renderer: WebGLRenderer
  private readonly scene = new Scene()
  private readonly camera: PerspectiveCamera
  private readonly controls: OrbitControls
  private readonly raycaster = new Raycaster()
  private readonly pointer = new Vector2()
  private readonly stations = new Map<FieldStation, StationNode>()
  private readonly cables: { line: Line; from: FieldStation; to: FieldStation }[] = []
  private readonly packet: Mesh
  private readonly packetMat: MeshStandardMaterial
  private readonly grid: GridHelper
  private readonly groundMat: MeshStandardMaterial
  private readonly keyLight: DirectionalLight
  private readonly hemi: AmbientLight
  private readonly look = new Vector3(-0.4, 0.45, 0.35)
  private readonly packetTarget = new Vector3()
  private view: FieldView = {
    active: 'request',
    tone: 'run',
    dim: [],
    isolated: null,
    exploded: false,
    snap: false,
  }
  private palette = readPalette()
  private disposed = false
  private dragged = false
  private downX = 0
  private downY = 0
  private readonly ro: ResizeObserver
  private readonly themeObserver: MutationObserver
  private readonly onPointerDown: (event: PointerEvent) => void
  private readonly onPointerMove: (event: PointerEvent) => void
  private readonly onPointerUp: (event: PointerEvent) => void
  private readonly canvas: HTMLCanvasElement
  private readonly onPick: (id: FieldStation) => void

  constructor(canvas: HTMLCanvasElement, onPick: (id: FieldStation) => void) {
    this.canvas = canvas
    this.onPick = onPick
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.toneMapping = 0
    this.renderer.toneMappingExposure = 1
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = PCFSoftShadowMap

    this.camera = new PerspectiveCamera(32, 1, 0.1, 80)
    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.enableZoom = false
    this.controls.maxPolarAngle = Math.PI / 2.05
    this.controls.minDistance = 5
    this.controls.maxDistance = 18
    this.controls.target.copy(this.look)
    this.setCamera('iso')

    this.hemi = new AmbientLight(0xffffff, 0.72)
    this.scene.add(this.hemi)
    this.keyLight = new DirectionalLight(0xffffff, 2.1)
    this.keyLight.position.set(6, 11, 5)
    this.keyLight.castShadow = true
    this.keyLight.shadow.mapSize.set(1024, 1024)
    this.keyLight.shadow.camera.near = 1
    this.keyLight.shadow.camera.far = 28
    this.keyLight.shadow.camera.left = -10
    this.keyLight.shadow.camera.right = 10
    this.keyLight.shadow.camera.top = 10
    this.keyLight.shadow.camera.bottom = -10
    this.scene.add(this.keyLight)

    this.groundMat = new MeshStandardMaterial({ color: this.palette.paper, roughness: 1, metalness: 0 })
    const ground = new Mesh(new PlaneGeometry(22, 22), this.groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.02
    ground.receiveShadow = true
    this.scene.add(ground)

    this.grid = new GridHelper(16, 16, new Color(this.palette.grid), new Color(this.palette.grid))
    this.grid.position.y = 0
    this.scene.add(this.grid)

    for (const spec of SPECS) {
      this.stations.set(spec.id, this.makeStation(spec))
    }

    const cableMat = () => new LineBasicMaterial({ color: this.palette.accent, transparent: true, opacity: 0.85 })
    for (const [from, to] of LINKS) {
      const a = this.stations.get(from)
      const b = this.stations.get(to)
      if (!a || !b) continue
      const geo = new BufferGeometry().setFromPoints([
        new Vector3(a.home.x, 0.04, a.home.z),
        new Vector3(b.home.x, 0.04, b.home.z),
      ])
      const line = new Line(geo, cableMat())
      this.scene.add(line)
      this.cables.push({ line, from, to })
    }

    this.packetMat = new MeshStandardMaterial({
      color: this.palette.accent,
      emissive: this.palette.accent,
      emissiveIntensity: 0.6,
      roughness: 0.35,
    })
    this.packet = new Mesh(new CylinderGeometry(0.16, 0.16, 0.1, 20), this.packetMat)
    this.packet.castShadow = true
    this.scene.add(this.packet)

    this.applyPalette()
    this.resize()

    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(canvas.parentElement ?? canvas)

    this.themeObserver = new MutationObserver(() => {
      this.palette = readPalette()
      this.applyPalette()
      this.applyView(true)
    })
    this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    this.onPointerDown = (event) => {
      this.dragged = false
      this.downX = event.clientX
      this.downY = event.clientY
    }
    this.onPointerMove = (event) => {
      if (Math.hypot(event.clientX - this.downX, event.clientY - this.downY) > 5) this.dragged = true
    }
    this.onPointerUp = (event) => {
      if (this.dragged) return
      const id = this.pick(event)
      if (id) this.onPick(id)
    }
    canvas.addEventListener('pointerdown', this.onPointerDown)
    canvas.addEventListener('pointermove', this.onPointerMove)
    canvas.addEventListener('pointerup', this.onPointerUp)

    this.renderer.setAnimationLoop(() => this.frame())
  }

  setView(view: FieldView) {
    this.view = view
    this.applyView(view.snap)
  }

  setCamera(which: FieldCamera) {
    const target = this.look
    this.controls.target.copy(target)
    if (which === 'front') this.camera.position.set(target.x, 4.2, 12)
    else if (which === 'top') this.camera.position.set(target.x, 13, target.z + 0.2)
    else this.camera.position.set(4.8, 8.4, 7.4)
    this.controls.update()
  }

  resize() {
    const parent = this.canvas.parentElement
    if (!parent) return
    const width = parent.clientWidth
    const height = parent.clientHeight
    if (width < 2 || height < 2) return
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.renderer.setAnimationLoop(null)
    this.ro.disconnect()
    this.themeObserver.disconnect()
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
    this.canvas.removeEventListener('pointermove', this.onPointerMove)
    this.canvas.removeEventListener('pointerup', this.onPointerUp)
    this.controls.dispose()
    const geometries = new Set<BufferGeometry>()
    const materials = new Set<Material>()
    this.scene.traverse((obj) => {
      if (obj instanceof Mesh || obj instanceof LineSegments || obj instanceof Line) {
        geometries.add(obj.geometry)
        const material = obj.material
        if (Array.isArray(material)) material.forEach((item) => materials.add(item))
        else materials.add(material)
      }
    })
    geometries.forEach((geometry) => geometry.dispose())
    materials.forEach((material) => material.dispose())
    this.renderer.dispose()
  }

  private makeStation(spec: (typeof SPECS)[number]): StationNode {
    const group = new Group()
    group.position.set(spec.at[0], 0, spec.at[1])
    const [w, h, d] = spec.size
    const body = new MeshStandardMaterial({ color: this.palette.panel, roughness: 0.62, metalness: 0.04 })
    const mesh = new Mesh(new BoxGeometry(w, h, d), body)
    mesh.position.y = h / 2
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData.station = spec.id
    const edges = new LineBasicMaterial({ color: this.palette.fg })
    const wire = new LineSegments(new EdgesGeometry(mesh.geometry), edges)
    wire.position.y = h / 2
    group.add(mesh, wire)

    if (spec.knob) {
      const knob = new Mesh(new CylinderGeometry(0.22, 0.22, 0.12, 20), body)
      knob.position.y = h + 0.06
      knob.castShadow = true
      knob.userData.station = spec.id
      group.add(knob)
    }
    if (spec.pegs) {
      for (const x of [-0.42, 0.42]) {
        const peg = new Mesh(new CylinderGeometry(0.1, 0.1, 0.28, 16), body)
        peg.position.set(x, h + 0.14, 0.1)
        peg.castShadow = true
        peg.userData.station = spec.id
        group.add(peg)
      }
    }

    const ringMat = new MeshBasicMaterial({
      color: this.palette.fg,
      transparent: true,
      opacity: 0.28,
      side: DoubleSide,
    })
    const ring = new Mesh(new RingGeometry(Math.max(w, d) * 0.42, Math.max(w, d) * 0.52, 28), ringMat)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.025
    group.add(ring)

    this.scene.add(group)
    return { id: spec.id, group, body, edges, ring: ringMat, home: group.position.clone(), height: h }
  }

  private applyPalette() {
    this.renderer.setClearColor(new Color(this.palette.bg))
    this.groundMat.color.setStyle(this.palette.paper)
    const gridMat = this.grid.material
    const grids = Array.isArray(gridMat) ? gridMat : [gridMat]
    for (const mat of grids) {
      if (mat instanceof LineBasicMaterial) mat.color.setStyle(this.palette.grid)
    }
    for (const node of this.stations.values()) {
      node.edges.color.setStyle(this.palette.fg)
    }
  }

  private applyView(snap: boolean) {
    const dim = new Set(this.view.dim)
    const lift = snap ? 1 : 0.14
    for (const node of this.stations.values()) {
      const on = node.id === this.view.active
      const denied = on && (this.view.tone === 'deny' || this.view.tone === 'skip')
      const faded = dim.has(node.id) && !on
      const idle = new Color(this.palette.panel).lerp(new Color(this.palette.fg), 0.16)
      node.body.color.copy(denied ? new Color(this.palette.fail) : on ? new Color(this.palette.accent) : idle)
      node.body.depthWrite = !faded
      node.body.emissive.setStyle(on ? (denied ? this.palette.fail : this.palette.accent) : '#000000')
      node.body.emissiveIntensity = on ? 0.42 : 0
      node.body.opacity = faded ? 0.34 : 1
      node.body.transparent = faded
      node.edges.opacity = faded ? 0.35 : 0.9
      node.edges.transparent = true
      node.ring.color.setStyle(denied ? this.palette.fail : on ? this.palette.accent : this.palette.fg)
      node.ring.opacity = on ? 0.95 : faded ? 0.12 : 0.28

      const target = node.home.clone()
      if (this.view.exploded || this.view.isolated === node.id) {
        const away = new Vector3(node.home.x, 0, node.home.z)
        if (away.length() < 0.2) away.set(1, 0, 0)
        away.normalize()
        const spread = this.view.isolated === node.id ? 0.35 : 1.15
        target.add(away.multiplyScalar(spread))
        target.y += this.view.isolated === node.id ? 1.25 : 0.35
      }
      if (snap) node.group.position.copy(target)
      else node.group.position.lerp(target, lift)
    }

    for (const cable of this.cables) {
      const mat = cable.line.material
      if (!(mat instanceof LineBasicMaterial)) continue
      const quiet = dim.has(cable.from) || dim.has(cable.to)
      mat.color.setStyle(this.palette.accent)
      mat.opacity = quiet ? 0.12 : 0.75
    }

    const node = this.stations.get(this.view.active)
    if (!node) return
    this.packetTarget.set(node.group.position.x, node.height + 0.32 + node.group.position.y, node.group.position.z)
    this.packetMat.color.setStyle(this.view.tone === 'deny' ? this.palette.fail : this.palette.accent)
    this.packetMat.emissive.setStyle(this.view.tone === 'deny' ? this.palette.fail : this.palette.accent)
    if (snap) this.packet.position.copy(this.packetTarget)
  }

  private pick(event: PointerEvent): FieldStation | null {
    const rect = this.canvas.getBoundingClientRect()
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const hits = this.raycaster.intersectObjects(this.scene.children, true)
    for (const hit of hits) {
      let current: Object3D | null = hit.object
      while (current) {
        const station = current.userData.station as FieldStation | undefined
        if (station) return station
        current = current.parent
      }
    }
    return null
  }

  private frame() {
    if (this.disposed) return
    const node = this.stations.get(this.view.active)
    if (node && !this.view.snap) {
      this.packetTarget.set(
        node.group.position.x,
        node.height + 0.32 + node.group.position.y,
        node.group.position.z,
      )
      this.packet.position.lerp(this.packetTarget, 0.16)
      for (const station of this.stations.values()) {
        const target = station.home.clone()
        if (this.view.exploded || this.view.isolated === station.id) {
          const away = new Vector3(station.home.x, 0, station.home.z)
          if (away.length() < 0.2) away.set(1, 0, 0)
          away.normalize()
          const spread = this.view.isolated === station.id ? 0.35 : 1.15
          target.add(away.multiplyScalar(spread))
          target.y += this.view.isolated === station.id ? 1.25 : 0.35
        }
        station.group.position.lerp(target, 0.12)
      }
    }
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }
}
