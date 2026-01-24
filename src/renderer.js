// Render gum.jsx element to PNG buffer

import { Resvg } from '@resvg/resvg-js';
import { setTheme } from 'gum-jsx';

export async function renderGumToPng(elem, size, opts = {}) {
  const { width, height, theme = 'dark' } = opts;

  // Set theme before generating SVG
  setTheme(theme);

  // Generate SVG from pre-evaluated element
  const svg = elem.svg();

  // Use element's native size for constraint calculations
  const [naturalWidth, naturalHeight] = size || [0, 0];

  // Determine fitTo mode based on constraints
  let fitTo;
  if (width && height) {
    // Both constraints: use the more limiting dimension
    if (naturalWidth > 0 && naturalHeight > 0) {
      const scaleW = width / naturalWidth;
      const scaleH = height / naturalHeight;
      fitTo = scaleW < scaleH
        ? { mode: 'width', value: width }
        : { mode: 'height', value: height };
    } else {
      fitTo = { mode: 'width', value: width };
    }
  } else if (height) {
    fitTo = { mode: 'height', value: height };
  } else if (width) {
    fitTo = { mode: 'width', value: width };
  } else {
    // Default: no constraints, use original size
    fitTo = { mode: 'original' };
  }

  // Rasterize SVG to PNG
  const resvg = new Resvg(svg, { fitTo });
  const pngData = resvg.render();
  return pngData.asPng();
}
