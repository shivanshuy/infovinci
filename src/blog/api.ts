import type { RichArticleDoc } from '../article/types'
import type { BlogPost } from './posts'

/** Base URL for infovinci-serve (empty = same origin; use Vite proxy in dev). */
export function getInfovinciServeBase(): string {
  return (import.meta.env.VITE_INFOVINCI_SERVE_URL as string | undefined)?.replace(/\/$/, '') ?? ''
}

export type PostSummaryApi = {
  id: string
  slug: string
  title: string
  dateISO: string
  category: string
  summary: string
  imageVariant: number
}

export type PaginatedPostsApi = {
  items: PostSummaryApi[]
  total: number
  page: number
  pageSize: number
}

export type PostFullApi = {
  id: string
  slug: string
  title: string
  dateISO: string
  category: string
  summary: string
  body: string
  imageVariant: number
  richDoc: RichArticleDoc | Record<string, unknown> | unknown[] | null
}

function apiUrl(path: string): string {
  const base = getInfovinciServeBase().replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  if (!base) {
    return `/api${p}`
  }
  return `${base}${p}`
}

export async function fetchPostsPage(
  page: number,
  pageSize: number,
  query = '',
): Promise<PaginatedPostsApi> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  const search = query.trim()
  if (search) {
    params.set('q', search)
  }
  const url = `${apiUrl('/posts')}?${params}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    throw new Error(`posts ${res.status}`)
  }
  return res.json() as Promise<PaginatedPostsApi>
}

export async function fetchPostById(id: string): Promise<PostFullApi> {
  const path = apiUrl(`/post/${encodeURIComponent(id)}`)
  const res = await fetch(path, { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    throw new Error(`post ${res.status}`)
  }
  return res.json() as Promise<PostFullApi>
}

function clampImageVariant(n: number): BlogPost['imageVariant'] {
  const v = Number.isFinite(n) ? Math.floor(n) : 1
  const c = ((v - 1) % 9) + 1
  return c as BlogPost['imageVariant']
}

/** Normalizes API payload into the app’s BlogPost shape (includes `id`). */
export function postFullToBlogPost(p: PostFullApi): BlogPost {
  const m = p.richDoc
  const richDoc =
    m && typeof m === 'object' && !Array.isArray(m) && 'header' in (m as object)
      ? (m as RichArticleDoc)
      : undefined

  return {
    id: String(p.id),
    slug: p.slug,
    title: p.title,
    dateISO: p.dateISO,
    category: p.category,
    summary: p.summary,
    body: p.body ?? '',
    imageVariant: clampImageVariant(p.imageVariant),
    richDoc,
  }
}

export function postSummaryToCardPost(p: PostSummaryApi): BlogPost & { id: string } {
  return {
    id: String(p.id),
    slug: p.slug,
    title: p.title,
    dateISO: p.dateISO,
    category: p.category,
    summary: p.summary,
    body: '',
    imageVariant: clampImageVariant(p.imageVariant),
  }
}
