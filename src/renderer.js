// Render gum.jsx element to PNG buffer

import { Resvg } from '@resvg/resvg-js';

export async function renderGumToPng(elem, naturalHeightsize, opts = {}) {
  const { width, height } = opts;

  // Generate SVG from pre-evaluated element
  const svg = elem.svg();
  const { size: size0 } = svg;

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

  // Rasterize SVG to PNG
  const resvg = new Resvg(svg, { fitTo });
  const pngData = resvg.render();
  return pngData.asPng();
}
