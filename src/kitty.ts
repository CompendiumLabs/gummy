// Kitty graphics protocol implementation
// https://sw.kovidgoyal.net/kitty/graphics-protocol/

const CHUNK_SIZE = 4096

// ANSI color codes
const ANSI_FG: Record<string, number> = { gray: 90, red: 91, green: 92, yellow: 93, blue: 94, magenta: 95, cyan: 96, white: 97 }
const ANSI_BG: Record<string, number> = { gray: 100, red: 101, green: 102, yellow: 103, blue: 104, magenta: 105, cyan: 106, white: 107 }

function ansi(text: string, { fg = null, bg = null, bold = false, italic = false }: { fg?: number | null, bg?: number | null, bold?: boolean, italic?: boolean } = {}): string {
  const pre_fg = fg != null ? `\x1b[38;5;${fg}m` : ''
  const pre_bg = bg != null ? `\x1b[48;5;${bg}m` : ''
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
