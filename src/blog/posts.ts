import { v5 as uuidv5 } from 'uuid'
import type { RichArticleDoc } from '../article/types'
import { BUNDLED_ARTICLES } from '../article/registry'

/** Namespace UUID for deterministic ids for bundled posts (optional offline fallback). */
export const STATIC_POST_ID_NAMESPACE = 'a8f5f167-f44e-4c55-9b8d-3c8e2f1a9b0c'

export type BlogPost = {
  /** Present when loaded from API or when using static fallback with stable ids. */
  id?: string
  slug: string
  title: string
  dateISO: string
  category: string
  summary: string
  /** Plain text when structured body is absent. */
  body: string
  imageVariant: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
  /** Structured long-form content (blocks: text, code, images, …). */
  richDoc?: RichArticleDoc
}

function summarizeArticle(doc: RichArticleDoc): string {
  const lead = (doc.text ?? '').replace(/\s+/g, ' ').trim()
  if (lead.length >= 80) {
    return lead.length > 220 ? `${lead.slice(0, 217)}…` : lead
  }
  const firstText = doc.contents?.find((c) => c.type === 'text') as
    | { type: 'text'; text: string }
    | undefined
  const s = (firstText?.text ?? lead).replace(/\s+/g, ' ').trim()
  return s.length > 220 ? `${s.slice(0, 217)}…` : s || doc.header
}

function variantForSlug(slug: string): BlogPost['imageVariant'] {
  let h = 0
  for (let i = 0; i < slug.length; i++) {
    h = (h + slug.charCodeAt(i) * (i + 3)) % 9
  }
  return (h + 1) as BlogPost['imageVariant']
}

export function stablePostIdFromSlug(slug: string): string {
  return uuidv5(slug, STATIC_POST_ID_NAMESPACE)
}

export const POSTS: BlogPost[] = BUNDLED_ARTICLES.map(({ slug, dateISO, category, doc }) => ({
  id: stablePostIdFromSlug(slug),
  slug,
  title: doc.header,
  dateISO,
  category,
  summary: summarizeArticle(doc),
  body: '',
  imageVariant:
    slug === 'edge-stack' ? 5 : slug === 'pii-in-agents' ? 7 : slug === 'a2a' ? 8 : slug === 'a2ui' ? 9 : variantForSlug(slug),
  richDoc: doc,
}))

export function getPostBySlug(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug)
}

/** Resolve `/post/:id` when `id` is a slug or a stable v5 id for bundled posts. */
export function getPostByRouteParam(routeId: string): BlogPost | undefined {
  const bySlug = getPostBySlug(routeId)
  if (bySlug) return bySlug
  return POSTS.find((p) => p.id === routeId)
}

export function postsByRecent(): BlogPost[] {
  return [...POSTS].sort((a, b) => b.dateISO.localeCompare(a.dateISO))
}

export type BlogPostWithId = BlogPost & { id: string }

export function staticPostsWithIds(): BlogPostWithId[] {
  return postsByRecent().map((p) => ({
    ...p,
    id: p.id ?? stablePostIdFromSlug(p.slug),
  }))
}
