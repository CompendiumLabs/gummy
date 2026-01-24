// Render gum.jsx code to PNG buffer

import { Resvg } from '@resvg/resvg-js';
import { evaluateGum } from 'gum-jsx/eval';

export async function renderGumToPng(gumCode, opts = {}) {
  const { width, height, theme = 'dark' } = opts;

  // Evaluate gum.jsx to SVG
  const elem = evaluateGum(gumCode, { theme });
  const svg = elem.svg();

  // Determine fitTo mode based on constraints
  let fitTo;
  if (width && height) {
    // Both constraints: need to determine which is more limiting
    // Get SVG natural dimensions to calculate aspect ratio
    const probe = new Resvg(svg);
    const natural = probe.innerBBox();
    if (natural && natural.width > 0 && natural.height > 0) {
      const scaleW = width / natural.width;
      const scaleH = height / natural.height;
      // Use the more constraining dimension
      fitTo = scaleW < scaleH
        ? { mode: 'width', value: width }
        : { mode: 'height', value: height };
    } else {
      // Fallback to width if we can't determine natural size
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
