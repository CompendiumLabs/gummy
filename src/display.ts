// combined display routines

import { marked } from 'marked'
import { evaluateGum } from 'gum-jsx/eval'
import { rasterizeSvg } from 'gum-jsx/render'
import { formatImage } from 'gum-jsx/term'

import { createRenderer } from './renderer'
import type { Options, Theme, Size } from './types'

function displayMarkdown(content: string, opts: Options = {}): string {
  const renderer = createRenderer(opts)
  marked.use({ renderer })
  return marked(content) as string
}

function displayGum(code: string, { theme = 'dark', size = [1000, 500], width, height, imageId }: { theme?: Theme, size?: Size, width?: number, height?: number, imageId?: number } = {}): string {
  const elem = evaluateGum(code, { theme, size })
  const svg = elem.svg()
  const png = rasterizeSvg(svg, { size: elem.size, width, height })
  return formatImage(png, { imageId })
}

export { displayMarkdown, displayGum }
