// ansi terminal output

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

export { ansi, ANSI_LO, ANSI_HI }
