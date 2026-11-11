export type ArticleBlock =
  | { type: 'header'; text: string }
  | { type: 'subHeader'; text: string }
  | { type: 'text'; text: string }
  | { type: 'code'; code: string }
  | { type: 'image'; src: string }
  | { type: 'reference'; href: string; text: string }
  | { type: 'link'; href: string; text: string }

/** Structured long-form doc (header, lead text, block contents). */
export type RichArticleDoc = {
  header: string
  text?: string
  contents?: ArticleBlock[]
}
