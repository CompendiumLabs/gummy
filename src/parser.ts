// Parse markdown and extract gum.jsx code blocks

import { createRequire } from 'module';
import { Resvg } from '@resvg/resvg-js';
import { evaluateGum } from 'gum-jsx/eval';
import type { Svg } from 'gum-jsx';
import type { Options, Theme, Size } from './types.js';

// Resolve font paths from gum-jsx package
const require = createRequire(import.meta.url);
const fontSans = require.resolve('gum-jsx/fonts/IBMPlexSans-Variable.ttf');
const fontMono = require.resolve('gum-jsx/fonts/IBMPlexMono-Regular.ttf');

// Store font arguments for resvg conversion
const FONT_ARGS = {
  fontFiles: [fontSans, fontMono],
  loadSystemFonts: false,
  defaultFontFamily: 'IBM Plex Sans',
  sansSerifFamily: 'IBM Plex Sans',
  monospaceFamily: 'IBM Plex Mono',
};

type FitTo =
  | { mode: 'original' }
  | { mode: 'width'; value: number }
  | { mode: 'height'; value: number };

// Parse gum.jsx into an Svg element
export function parseGum(code: string, { theme = 'dark', size = [1000, 500] } : { theme?: Theme, size?: Size }): Svg {
  return evaluateGum(code, { theme, size });
}

// Build fitTo object from width/height options
function buildFitTo(width?: number, height?: number): FitTo {
  if (height != null && width != null) {
    return { mode: 'width', value: width }; // prefer width when both specified
  } else if (height != null) {
    return { mode: 'height', value: height };
  } else if (width != null) {
    return { mode: 'width', value: width };
  }
  return { mode: 'original' };
}

// Rasterize SVG buffer/string to PNG
export function rasterizeSvg(svg: string | Buffer, opts: Options = {}): Buffer {
  const { width, height, font } = opts;
  const fitTo = buildFitTo(width, height);
  const resvg = new Resvg(svg, { fitTo, font });
  return resvg.render().asPng();
}

// Render gum.jsx Svg element to PNG data
export function renderGum(elem: Svg, opts: Options = {}): Buffer {
  // Render gum Element to SVG
  const svg = elem.svg();
  const { size } = elem;

  // Scale down intrinsic height
  let { width, height } = opts;
  if (size != null && width != null && height != null) {
    const [width0, height0] = size;
    const scaleW = width / width0;
    const scaleH = height / height0;
    if (scaleW < scaleH) height = undefined;
    else width = undefined;
  }

  // Pass to resvg for rasterize
  return rasterizeSvg(svg, { width, height, font: FONT_ARGS });
}
