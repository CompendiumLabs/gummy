// combined display routines

import { marked } from 'marked'
import { createRenderer } from './renderer'
import { parseGum, renderGum } from './parser'
import { formatImage } from './kitty'
import { type Options } from './types'

function displayMarkdown(content: string, opts: Options = {}): string {
  const renderer = createRenderer(opts)
  marked.use({ renderer })
  return marked(content) as string
}

function displayGum(code: string, opts: Options = {}): string {
  let { theme, size, width, height, imageId } = opts
  const elem = parseGum(code, { theme, size })
  const png = renderGum(elem, { width, height })
  return formatImage(png, imageId)
}

export { displayMarkdown, displayGum }
