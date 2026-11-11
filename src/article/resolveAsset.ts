/** Map `./foo.png`-style paths to files under `/article-assets/`. */
export function resolveArticleAsset(src: string): string {
  const s = src.trim()
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  const name = s.replace(/^\.\//, '')
  return `/article-assets/${name}`
}
