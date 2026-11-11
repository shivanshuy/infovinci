declare module 'three' {
  export const ACESFilmicToneMapping: number
  export const PCFSoftShadowMap: number
  export const SRGBColorSpace: string
  export const DoubleSide: number

  export class Vector2 {
    x: number
    y: number
    constructor(x?: number, y?: number)
  }

  export class Vector3 {
    x: number
    y: number
    z: number
    constructor(x?: number, y?: number, z?: number)
    set(x: number, y: number, z: number): this
    copy(v: Vector3): this
    clone(): Vector3
    lerp(v: Vector3, alpha: number): this
    lerpVectors(v1: Vector3, v2: Vector3, alpha: number): this
    add(v: Vector3): this
    normalize(): this
    multiplyScalar(s: number): this
    setScalar(s: number): this
    length(): number
  }

  export class Color {
    constructor(color?: string | number)
    set(color: string | number): this
    setStyle(style: string): this
    copy(color: Color): this
    lerp(color: Color, alpha: number): this
  }

  export class Object3D {
    position: Vector3
    rotation: { x: number; y: number; z: number }
    parent: Object3D | null
    children: Object3D[]
    userData: Record<string, unknown>
    castShadow: boolean
    receiveShadow: boolean
    visible: boolean
    scale: Vector3
    add(...objects: Object3D[]): this
    remove(...objects: Object3D[]): this
    traverse(callback: (object: Object3D) => void): void
  }

  export class Camera extends Object3D {}

  export class BufferGeometry {
    dispose(): void
    setFromPoints(points: Vector3[]): this
  }

  export class BoxGeometry extends BufferGeometry {
    constructor(width?: number, height?: number, depth?: number)
  }
  export class PlaneGeometry extends BufferGeometry {
    constructor(width?: number, height?: number)
  }
  export class CylinderGeometry extends BufferGeometry {
    constructor(
      radiusTop?: number,
      radiusBottom?: number,
      height?: number,
      radialSegments?: number,
    )
  }
  export class RingGeometry extends BufferGeometry {
    constructor(innerRadius?: number, outerRadius?: number, thetaSegments?: number)
  }
  export class SphereGeometry extends BufferGeometry {
    constructor(radius?: number, widthSegments?: number, heightSegments?: number)
  }
  export class EdgesGeometry extends BufferGeometry {
    constructor(geometry: BufferGeometry)
  }

  export class Material {
    dispose(): void
  }

  export class LineBasicMaterial extends Material {
    color: Color
    transparent: boolean
    opacity: number
    constructor(parameters?: object)
  }

  export class MeshStandardMaterial extends Material {
    color: Color
    emissive: Color
    emissiveIntensity: number
    roughness: number
    metalness: number
    opacity: number
    transparent: boolean
    depthWrite: boolean
    constructor(parameters?: object)
  }

  export class MeshBasicMaterial extends Material {
    color: Color
    transparent: boolean
    opacity: number
    side: number
    constructor(parameters?: object)
  }

  export class Mesh extends Object3D {
    geometry: BufferGeometry
    material: Material | Material[]
    constructor(geometry: BufferGeometry, material: Material)
  }

  export class LineSegments extends Object3D {
    geometry: BufferGeometry
    material: Material | Material[]
    constructor(geometry: BufferGeometry, material: Material)
  }

  export class Line extends LineSegments {}

  export class Group extends Object3D {}

  export class Scene extends Object3D {
    background: Color | string | null
  }

  export class GridHelper extends LineSegments {
    constructor(size: number, divisions: number, color1?: Color, color2?: Color)
  }

  export class AmbientLight extends Object3D {
    constructor(color?: number, intensity?: number)
  }

  export class DirectionalLight extends Object3D {
    intensity: number
    castShadow: boolean
    shadow: {
      mapSize: { set(width: number, height: number): void }
      camera: {
        near: number
        far: number
        left: number
        right: number
        top: number
        bottom: number
      }
    }
    constructor(color?: number, intensity?: number)
  }

  export class PerspectiveCamera extends Camera {
    aspect: number
    constructor(fov?: number, aspect?: number, near?: number, far?: number)
    updateProjectionMatrix(): void
    lookAt(x: number | Vector3, y?: number, z?: number): void
  }

  export class WebGLRenderer {
    outputColorSpace: string
    toneMapping: number
    toneMappingExposure: number
    shadowMap: { enabled: boolean; type: number }
    domElement: HTMLCanvasElement
    constructor(parameters?: { canvas?: HTMLCanvasElement; antialias?: boolean; alpha?: boolean })
    setPixelRatio(value: number): void
    setSize(width: number, height: number, updateStyle?: boolean): void
    setClearColor(color: Color): void
    setAnimationLoop(callback: (() => void) | null): void
    render(scene: Object3D, camera: Camera): void
    dispose(): void
  }

  export class CanvasTexture {
    needsUpdate: boolean
    constructor(image: HTMLCanvasElement)
    dispose(): void
  }

  export class SpriteMaterial extends Material {
    map: CanvasTexture | null
    transparent: boolean
    depthTest: boolean
    opacity: number
    constructor(parameters?: object)
  }

  export class Sprite extends Object3D {
    material: SpriteMaterial
    constructor(material?: SpriteMaterial)
  }

  export class Raycaster {
    setFromCamera(pointer: Vector2, camera: Camera): void
    intersectObjects(
      objects: Object3D[],
      recursive?: boolean,
    ): { object: Object3D }[]
  }
}

declare module 'three/addons/controls/OrbitControls.js' {
  import { Camera, Vector3 } from 'three'
  export class OrbitControls {
    target: Vector3
    enableDamping: boolean
    dampingFactor: number
    enableZoom: boolean
    maxPolarAngle: number
    minDistance: number
    maxDistance: number
    constructor(camera: Camera, domElement?: HTMLElement)
    update(): void
    dispose(): void
  }
}
