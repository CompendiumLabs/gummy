// Kitty graphics protocol implementation
// https://sw.kovidgoyal.net/kitty/graphics-protocol/

const CHUNK_SIZE = 4096

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

function formatImage(pngBuffer: Buffer): string {
  const base64 = encodeImage(pngBuffer)
  let result = ''

  for (let i = 0; i < base64.length; i += CHUNK_SIZE) {
    const chunk = base64.slice(i, i + CHUNK_SIZE)
    const isFirst = i === 0
    const isLast = i + CHUNK_SIZE >= base64.length
    const control = isFirst
      ? `f=100,a=T,m=${isLast ? 0 : 1}`
      : `m=${isLast ? 0 : 1}`

    result += `\x1b_G${control};${chunk}\x1b\\`
  }

  return result + '\n'
}

export { ansi, encodeImage, formatImage, ANSI_LO, ANSI_HI }
