// Shared types for gummy

const THEMES = ['light', 'dark'] as const
type Theme = typeof THEMES[number]
type Size = number | [number, number]

interface Options {
  width?: number
  height?: number
  theme?: Theme
  size?: Size
  font?: any
}

function isTheme(value: string): value is Theme {
  return THEMES.includes(value as Theme)
}

export { Options, Theme, Size, isTheme }
