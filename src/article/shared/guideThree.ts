import {
  AmbientLight,
  Color,
  DirectionalLight,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three'

export type GuidePalette = {
  bg: string
  paper: string
  fg: string
  accent: string
  fail: string
  muted: string
}

export function readGuidePalette(el: HTMLElement): GuidePalette {
  const css = getComputedStyle(el)
  const pick = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback
  return {
    bg: pick('--bg', '#f4f1ec'),
    paper: pick('--paper', '#fffdf8'),
    fg: pick('--fg', '#1c1916'),
    accent: pick('--accent', '#e4572e'),
    fail: pick('--fail-border', '#b42318'),
    muted: pick('--muted', '#6b645c'),
  }
}

export function mountGuideScene(host: HTMLElement, opts?: { fov?: number }) {
  const scene = new Scene()
  const camera = new PerspectiveCamera(opts?.fov ?? 42, 1, 0.1, 80)
  camera.position.set(0, 3.2, 9.5)
  camera.lookAt(0, 0.4, 0)

  const renderer = new WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.outputColorSpace = SRGBColorSpace
  host.appendChild(renderer.domElement)

  const ambient = new AmbientLight(0xffffff, 0.72)
  const key = new DirectionalLight(0xffffff, 1.25)
  key.position.set(5, 10, 6)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.camera.near = 0.5
  key.shadow.camera.far = 40
  key.shadow.camera.left = -10
  key.shadow.camera.right = 10
  key.shadow.camera.top = 10
  key.shadow.camera.bottom = -10
  const fill = new DirectionalLight(0xffffff, 0.35)
  fill.position.set(-6, 4, -3)
  scene.add(ambient, key, fill)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFSoftShadowMap

  const resize = () => {
    const w = host.clientWidth || 640
    const h = Math.max(220, host.clientHeight || 280)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
  }
  resize()

  let frame = 0
  let running = true
  const onFrame: Array<(t: number) => void> = []

  const loop = (t: number) => {
    if (!running) return
    frame = requestAnimationFrame(loop)
    for (const fn of onFrame) fn(t)
    renderer.render(scene, camera)
  }
  frame = requestAnimationFrame(loop)

  const ro = new ResizeObserver(resize)
  ro.observe(host)

  return {
    scene,
    camera,
    renderer,
    onFrame: (fn: (t: number) => void) => {
      onFrame.push(fn)
    },
    setBg: (hex: string) => {
      scene.background = new Color(hex)
      renderer.setClearColor(new Color(hex))
    },
    dispose: () => {
      running = false
      cancelAnimationFrame(frame)
      ro.disconnect()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
