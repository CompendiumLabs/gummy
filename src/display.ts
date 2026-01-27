// combined display routines

import { marked } from 'marked';
import { createRenderer } from './renderer.js';
import { parseGum, renderGum } from './parser.js';
import { formatImage } from './kitty.js';
import { type Options } from './types.js';

function displayMarkdown(content: string, opts: Options = {}): string {
  const renderer = createRenderer(opts);
  marked.use({ renderer });
  return marked(content) as string;
}

function displayGum(code: string, opts: Options = {}): string {
  const { theme, size, width, height } = opts
  const elem = parseGum(code, { theme, size });
  const png = renderGum(elem, { width, height });
  return formatImage(png);
}

export { displayMarkdown, displayGum }
