// Custom marked renderer for terminal output with gum.jsx support

import { readFileSync } from 'fs'
import type { Tokens, RendererObject } from 'marked'
import { rasterizeSvg } from 'gum-jsx/render'
import { formatImage } from 'gum-jsx/term'

import { displayGum } from './display'
import { ansi } from './terminal'
import type { Options } from './types'

const HEADING_COLORS = ['magenta', 'blue', 'green', 'red', 'cyan', 'yellow']

// Parse space-delimited key=value options from string
function parseOptions(str: string): Options {
  const opts: Options = {}
  for (const part of str.split(/\s+/)) {
    const eq = part.indexOf('=')
    if (eq > 0) {
      const key = part.slice(0, eq)
      const value = part.slice(eq + 1)
      if (key == 'size' || key == 'width' || key == 'height') {
        opts[key] = Number(value)
      } else if (key == 'theme' && (value == 'light' || value == 'dark')) {
        opts.theme = value
      }
    }
  }
  return opts
}

// Check if language is gum/gum.jsx
function isGumLang(lang: string): boolean {
  return lang === 'gum' || lang === 'gum.jsx'
}

// Create renderer with given global options
export function createRenderer(globalOpts: Options = {}): RendererObject {
  return {
    // Block elements
    heading({ tokens, depth }: Tokens.Heading): string {
      const text = this.parser.parseInline(tokens)
      const prefix = '#'.repeat(depth)
      const clr = HEADING_COLORS[depth - 1] || 'magenta'
      return ansi(`${prefix} ${text}`, { fg: clr, bold: true }) + '\n\n'
    },

    paragraph({ tokens }: Tokens.Paragraph): string {
      const text = this.parser.parseInline(tokens)
      return `${text}\n\n`
    },

    code({ text, lang }: Tokens.Code): string {
      const [baseLang, ...rest] = (lang || '').split(/\s+/)
      const localOpts = parseOptions(rest.join(' '))
      const opts = { ...globalOpts, ...localOpts }

      if (isGumLang(baseLang)) {
        try {
          return displayGum(text, opts)
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          return `[gum.jsx error: ${message}]\n\n`
        }
      }

      return `\`\`\`${ansi(baseLang, { fg: 'blue' })}\n${ansi(text, { fg: 'gray' })}\n\`\`\`\n\n`
    },

    blockquote({ tokens }: Tokens.Blockquote): string {
      const text = this.parser.parse(tokens).trim().replace(/\n/g, '\n > ')
      return ` > ${text}\n\n`
    },

    list({ items, ordered }: Tokens.List): string {
      return items.map((item: Tokens.ListItem, i: number) => {
        const bullet = ordered ? ` ${i + 1}. ` : ' — '
        const text = this.parser.parse(item.tokens).trim()
        return bullet + text
      }).join('\n') + '\n\n'
    },

    hr(): string {
      return '---\n\n'
    },

    // Inline elements
    strong({ tokens }: Tokens.Strong): string {
      const text = this.parser.parseInline(tokens)
      return ansi(`**${text}**`, { bold: true })
    },

    em({ tokens }: Tokens.Em): string {
      const text = this.parser.parseInline(tokens)
      return ansi(`_${text}_`, { fg: 'gray', italic: true, bold: true })
    },

    codespan({ text }: Tokens.Codespan): string {
      return `\`${ansi(text, { fg: 'blue' })}\``
    },

    link({ href, tokens }: Tokens.Link): string {
      const text = this.parser.parseInline(tokens)
      return `[${ansi(text, { fg: 'blue' })}](${ansi(href, { fg: 'gray' })}`
    },

    image({ href, text }: Tokens.Image): string {
      const isUrl = /^https?:\/\//.test(href)
      const ext = href.split('.').pop()?.toLowerCase()

      if (isUrl) return ansi(`[External URL: ${href}]`, { fg: 'gray' })

      try {
        if (ext === 'png') {
          const png = readFileSync(href)
          return formatImage(png)
        } else if (ext == 'svg') {
          const svg = readFileSync(href, 'utf8')
          const opts = parseOptions(text || '')
          const png = rasterizeSvg(svg, opts)
          return formatImage(png)
        } else if (ext == 'jsx') {
          const data = readFileSync(href, 'utf8')
          const opts = parseOptions(text || '')
          return displayGum(data, opts)
        } else {
          return ansi(`[Unsupported image type: ${ext}]`, { fg: 'gray' })
        }
      } catch {
        return ansi(`[Unable to load image: ${href}]`, { fg: 'gray' })
      }
    },

    text(token: Tokens.Text | Tokens.Escape): string {
      if ('tokens' in token) {
        return this.parser.parseInline(token.tokens ?? [])
      } else {
        return token.text
      }
    },

    html(token: Tokens.HTML | Tokens.Tag): string {
      return 'text' in token ? token.text : ''
    },

    br(): string {
      return '\n'
    }
  }
}
