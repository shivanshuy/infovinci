import type { ArticleBlock, RichArticleDoc } from './types'
import { resolveArticleAsset } from './resolveAsset'

function TextBlock({ text }: { text: string }) {
  return <div className="iv-article__text">{text}</div>
}

function renderBlock(el: ArticleBlock, i: number) {
  if (el.type === 'header') {
    return (
      <h3 key={i} className="iv-article__h3">
        {el.text}
      </h3>
    )
  }
  if (el.type === 'subHeader') {
    return (
      <h4 key={i} className="iv-article__h4">
        {el.text}
      </h4>
    )
  }
  if (el.type === 'text') {
    return <TextBlock key={i} text={el.text} />
  }
  if (el.type === 'code') {
    return (
      <pre key={i} className="iv-article__pre">
        <code>{el.code}</code>
      </pre>
    )
  }
  if (el.type === 'image') {
    const url = resolveArticleAsset(el.src)
    return (
      <figure key={i} className="iv-article__figure">
        <img src={url} alt="" className="iv-article__img" loading="lazy" decoding="async" />
      </figure>
    )
  }
  if (el.type === 'reference') {
    return (
      <p key={i} className="iv-article__ref">
        <span className="iv-article__label">Reference — </span>
        <a href={el.href} target="_blank" rel="noopener noreferrer">
          {el.text}
        </a>
      </p>
    )
  }
  if (el.type === 'link') {
    return (
      <p key={i} className="iv-article__linkrow">
        <span className="iv-article__label">Go to — </span>
        <a href={el.href}>{el.text}</a>
      </p>
    )
  }
  return null
}

export function ArticleBody({ doc }: { doc: RichArticleDoc }) {
  return (
    <article className="iv-article">
      {doc.text ? <TextBlock text={doc.text} /> : null}
      {doc.contents?.map((el, i) => renderBlock(el, i))}
    </article>
  )
}
