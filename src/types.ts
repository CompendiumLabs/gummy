// Shared types for gummy

type Theme = 'light' | 'dark';
type Size = number | [number, number];

interface Options {
  width?: number;
  height?: number;
  theme?: Theme;
  size?: Size;
  font?: any;
}

export { Options, Theme, Size }

