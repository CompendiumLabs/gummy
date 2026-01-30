// Kitty graphics protocol implementation
// https://sw.kovidgoyal.net/kitty/graphics-protocol/

const CHUNK_SIZE = 4096

// ANSI color codes
const FG_COLORS: Record<string, number> = { gray: 90, red: 91, green: 92, yellow: 93, blue: 94, magenta: 95, cyan: 96, white: 97 }
const BG_COLORS: Record<string, number> = { gray: 100, red: 101, green: 102, yellow: 103, blue: 104, magenta: 105, cyan: 106, white: 107 }

function ansi(text: string, { fg = null, bg = null, bold = false, italic = false }: { fg?: string | null, bg?: string | null, bold?: boolean, italic?: boolean } = {}): string {
  const fg_code = fg != null ? (FG_COLORS[fg] ?? 0) : 0
  const bg_code = bg != null ? (BG_COLORS[bg] ?? 0) : 0
  const pre_fg = fg_code > 0 ? `\x1b[${fg_code}m` : ''
  const pre_bg = bg_code > 0 ? `\x1b[${bg_code}m` : ''
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

export { ansi, encodeImage, formatImage }
