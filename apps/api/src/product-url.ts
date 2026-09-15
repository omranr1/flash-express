export function normalizeProductUrl(value: unknown): string {
  let url = String(value ?? '').trim().replace(/^<|>$/g, '')
  const embedded = url.match(/https?:\/\/[^\s<>]+/i)
  if (embedded) url = embedded[0]
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`
  return url.replace(/[،؛。]+$/u, '').replace(/[.!?]+$/u, '')
}
