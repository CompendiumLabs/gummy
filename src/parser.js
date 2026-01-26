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

// Parse gum.jsx into an Svg element
function parseGum(code, theme='dark') {
  setTheme(theme);
  const elem0 = runJSX(code);
  const wrap = is_element(elem0) && !(elem0 instanceof Svg);
  const elem = wrap ? new Svg({ children: elem0, size: DEFAULT_SIZE }) : elem0;
  return elem;
}

// Rasterize SVG buffer/string to PNG
function rasterizeSvg(svg, opts = {}) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'original' },
    ...opts,
  });
  return resvg.render().asPng();
}

// Render gum.jsx Svg element to PNG data
function renderGum(elem, opts = {}) {
  const { width, height } = opts;

  // Generate SVG from pre-evaluated element
  const svg = elem.svg();
  const { size: size0 } = elem;

  // Determine fitTo mode based on constraints
  let fitTo;
  if (width != null && height != null) {
    if (size0 != null) {
      const [width0, height0] = size0;
      const scaleW = width / width0;
      const scaleH = height / height0;
      fitTo = scaleW < scaleH
        ? { mode: 'width', value: width }
        : { mode: 'height', value: height };
    } else {
      fitTo = { mode: 'width', value: width };
    }
  } else if (height != null) {
    fitTo = { mode: 'height', value: height };
  } else if (width != null) {
    fitTo = { mode: 'width', value: width };
  } else {
    fitTo = { mode: 'original' };
  }

  // Rasterize SVG to PNG with gum-jsx fonts
  return rasterizeSvg(svg, {
    fitTo,
    font: {
      fontFiles: [fontSans, fontMono],
      loadSystemFonts: false,
      defaultFontFamily: 'IBM Plex Sans',
      sansSerifFamily: 'IBM Plex Sans',
      monospaceFamily: 'IBM Plex Mono',
    },
  });
}

export { parseGum, renderGum, rasterizeSvg }

