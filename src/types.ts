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
  imageId?: number
}

export { Options, Theme, Size }
