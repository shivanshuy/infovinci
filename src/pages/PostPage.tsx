import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchPostById, postFullToBlogPost } from '../blog/api'
import { getPostByRouteParam, type BlogPost } from '../blog/posts'
import { ArticleBody } from '../article/ArticleBody'
import { EdgeStackGuide } from '../article/edge-stack/EdgeStackGuide'
import { PiiGuide } from '../article/pii/PiiGuide'
import { A2aGuide } from '../article/a2a/A2aGuide'
import { A2uiGuide } from '../article/a2ui/A2uiGuide'
import { A2A_SLUG, A2UI_SLUG, EDGE_STACK_SLUG, PII_AGENTS_SLUG } from '../article/registry'

export function PostPage() {
  const { id } = useParams()
  const [post, setPost] = useState<BlogPost | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setPost(null)
      setError(null)
      return
    }

    let cancelled = false
    setPost(undefined)
    setError(null)

    ;(async () => {
      try {
        const full = await fetchPostById(id)
        if (cancelled) return
        setPost(postFullToBlogPost(full))
        setError(null)
      } catch {
        const local = getPostByRouteParam(id)
        if (cancelled) return
        if (local) {
          setPost(local)
          setError(null)
        } else {
          setPost(null)
          setError('not_found')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id])

  if (post === undefined) {
    return (
      <div className="page page--post">
        <span className="kicker">Loading</span>
        <p className="lead">Fetching article…</p>
      </div>
    )
  }

  if (!post || error === 'not_found') {
    return (
      <div className="page page--post">
        <span className="kicker">Not found</span>
        <p className="lead">That post doesn’t exist.</p>
        <Link className="app__header-nav-link" to="/">
          Back home
        </Link>
      </div>
    )
  }

  return (
    <div className="page page--post">
      <span className="kicker">{post.category}</span>
      <h2 style={{ margin: '0 0 0.35rem', fontFamily: "'Outfit', var(--sans)" }}>
        {post.title}
      </h2>
      <p className="lead" style={{ marginBottom: '1rem' }}>
        {new Date(post.dateISO).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>

      {post.slug === EDGE_STACK_SLUG ? (
        <div className="panel panel--article">
          <EdgeStackGuide />
        </div>
      ) : post.slug === PII_AGENTS_SLUG ? (
        <div className="panel panel--article">
          <PiiGuide />
        </div>
      ) : post.slug === A2A_SLUG ? (
        <div className="panel panel--article">
          <A2aGuide />
        </div>
      ) : post.slug === A2UI_SLUG ? (
        <div className="panel panel--article">
          <A2uiGuide />
        </div>
      ) : post.richDoc ? (
        <div className="panel panel--article">
          <ArticleBody doc={post.richDoc} />
        </div>
      ) : (
        <div className="panel">
          <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{post.body}</p>
        </div>
      )}

      <div style={{ marginTop: '1rem' }}>
        <Link className="app__header-nav-link" to="/">
          ← Back to feed
        </Link>
      </div>
    </div>
  )
}
