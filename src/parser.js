// Parse markdown and extract gum.jsx code blocks

import { createRequire } from 'module';
import { Resvg } from '@resvg/resvg-js';
import { runJSX } from 'gum-jsx/eval';
import { Svg, is_element, setTheme } from 'gum-jsx';

// Default SVG viewport size
const DEFAULT_SIZE = 750;

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

// Parse gum.jsx into an Svg element
function parseGum(code, theme='dark') {
  setTheme(theme);
  const elem0 = runJSX(code);
  const wrap = is_element(elem0) && !(elem0 instanceof Svg);
  const elem = wrap ? new Svg({ children: elem0, size: DEFAULT_SIZE }) : elem0;
  return elem;
}

// Build fitTo object from width/height options
function buildFitTo(width, height) {
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
function rasterizeSvg(svg, opts = {}) {
  const { width, height, ...rest } = opts;
  const fitTo = buildFitTo(width, height);
  const resvg = new Resvg(svg, { fitTo, ...rest });
  return resvg.render().asPng();
}

// Render gum.jsx Svg element to PNG data
function renderGum(elem, opts = {}) {
  // Render gum Element to SVG
  const svg = elem.svg();
  const { size } = elem;

  // Scale down intrinsic height
  let { width, height } = opts;
  if (size != null) {
    const [width0, height0] = size
    const scaleW = width / width0;
    const scaleH = height / height0;
    if (scaleW < scaleH) height = null;
    else width = null;
  }

  // Pass to resvg for rasterize
  return rasterizeSvg(svg, {
    width,
    height,
    font: FONT_ARGS
  });
}

export { parseGum, renderGum, rasterizeSvg }

