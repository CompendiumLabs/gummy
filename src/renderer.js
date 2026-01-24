// Render gum.jsx code to PNG buffer

import { Resvg } from '@resvg/resvg-js';
import { evaluateGum } from 'gum-jsx/eval';

export async function renderGumToPng(gumCode, opts = {}) {
  const { width = 800, theme = 'dark' } = opts;

  // Evaluate gum.jsx to SVG
  const elem = evaluateGum(gumCode, { theme });
  const svg = elem.svg();

  // Rasterize SVG to PNG
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
  });
  const pngData = resvg.render();
  return pngData.asPng();
}
