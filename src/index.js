#!/usr/bin/env node

// Gummy - Markdown pager with embedded gum.jsx visualizations

import { readFileSync } from 'fs';
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';
import { parseMarkdown } from './parser.js';
import { renderGumToPng } from './renderer.js';
import { writeImage } from './kitty.js';

marked.setOptions({
  renderer: new TerminalRenderer(),
});

async function render(content, opts = {}) {
  const segments = parseMarkdown(content);

  for (const segment of segments) {
    if (segment.type === 'markdown') {
      const rendered = marked(segment.content);
      process.stdout.write(rendered);
    } else if (segment.type === 'gum') {
      try {
        const png = await renderGumToPng(segment.content, opts);
        writeImage(png);
      } catch (err) {
        console.error(`[gum.jsx error: ${err.message}]`);
      }
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const file = args[0];

  if (!file) {
    // Read from stdin
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    const content = Buffer.concat(chunks).toString('utf-8');
    await render(content);
  } else {
    const content = readFileSync(file, 'utf-8');
    await render(content);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
