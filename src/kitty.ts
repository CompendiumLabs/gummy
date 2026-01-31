// Kitty graphics protocol implementation
// https://sw.kovidgoyal.net/kitty/graphics-protocol/

import { readFileSync, watch } from 'fs'

// Kitty graphics protocol constants
const CHUNK_SIZE = 4096
const CURSOR_HOME = '\x1b[H'
const DELETE_IMAGE = '\x1b_Ga=d,d=i,i=1,q=1\x1b\\'
const ALT_SCREEN_ON = '\x1b[?1049h'
const ALT_SCREEN_OFF = '\x1b[?1049l'

// ANSI color codes
const ANSI_LO: Record<string, number> = { gray: 0, red: 1, green: 2, yellow: 3, blue: 4, magenta: 5, cyan: 6, white: 7 }
const ANSI_HI: Record<string, number> = { gray: 8, red: 9, green: 10, yellow: 11, blue: 12, magenta: 13, cyan: 14, white: 15 }

type Color = keyof typeof ANSI_HI | number

function color(name: Color): number {
  return typeof name === 'string' ? ANSI_HI[name] : name
}

function ansi(text: string, { fg = null, bg = null, bold = false, italic = false }: { fg?: Color | null, bg?: Color | null, bold?: boolean, italic?: boolean } = {}): string {
  const pre_fg = fg != null ? `\x1b[38;5;${color(fg)}m` : ''
  const pre_bg = bg != null ? `\x1b[48;5;${color(bg)}m` : ''
  const pre_bold = bold ? '\x1b[1m' : ''
  const pre_italic = italic ? '\x1b[3m' : ''
  const post_reset = '\x1b[0m'
  return `${pre_bold}${pre_italic}${pre_fg}${pre_bg}${text}${post_reset}`
}

function encodeImage(pngBuffer: Buffer): string {
  return pngBuffer.toString('base64')
}

function formatImage(pngBuffer: Buffer, imageId?: number): string {
  const idParam = imageId != null ? `,i=${imageId}` : ''
  const base64 = encodeImage(pngBuffer)

  let result = ''
  for (let i = 0; i < base64.length; i += CHUNK_SIZE) {
    const chunk = base64.slice(i, i + CHUNK_SIZE)
    const isFirst = i === 0
    const isLast = i + CHUNK_SIZE >= base64.length
    const control = isFirst
      ? `f=100,a=T${idParam},q=1,m=${isLast ? 0 : 1}`
      : `m=${isLast ? 0 : 1}`

    result += `\x1b_G${control};${chunk}\x1b\\`
  }

  return result + '\n'
}

function watchAndRender(file: string, displayer: (content: string, imageId?: number) => string): void {
  function doRender(prefix: string, imageId: number | undefined) {
    const content = readFileSync(file, 'utf-8')
    const output = displayer(content, imageId)
    process.stdout.write(prefix + output)
  }

  // enable alternative screen and render
  process.stdout.write(ALT_SCREEN_ON)
  doRender(CURSOR_HOME, 1)

  // watch for file changes
  const watcher = watch(file, (event) => {
    if (event === 'change') {
      try {
        doRender(CURSOR_HOME + DELETE_IMAGE, 1)
      } catch (err) {
        console.error('Render error:', err)
      }
    }
  })

  // handle SIGINT
  process.on('SIGINT', () => {
    watcher.close()
    process.stdout.write(ALT_SCREEN_OFF)
    doRender(DELETE_IMAGE, undefined)
    process.exit(0)
  })
}

export { ansi, encodeImage, formatImage, watchAndRender, ANSI_LO, ANSI_HI }
