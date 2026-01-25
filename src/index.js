#!/usr/bin/env node

// Gummy - Markdown pager with embedded gum.jsx visualizations

import { readFileSync } from 'fs';
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';
import { program } from 'commander';
import { parseMarkdown, parseGum } from './parser.js';
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
      if (segment.error) {
        console.error(`[gum.jsx error: ${segment.error.message}]`);
        continue;
      }
      try {
        const renderOpts = { ...opts, ...segment.options };
        const png = await renderGumToPng(segment.elem, renderOpts);
        writeImage(png);
      } catch (err) {
        console.error(`[gum.jsx error: ${err.message}]`);
      }
    }
  }
}

async function renderGum(code, opts = {}) {
  const elem = parseGum(code);
  const png = await renderGumToPng(elem, opts);
  writeImage(png);
}

program
  .name('gummy')
  .description('Markdown pager with embedded gum.jsx visualizations')
  .argument('[file]', 'Markdown file to render (reads from stdin if not provided)')
  .option('-W, --width <pixels>', 'Max width for gum blocks', parseInt)
  .option('-H, --height <pixels>', 'Max height for gum blocks', parseInt)
  .option('-j, --jsx', 'Render pure gum.jsx', false)
  .action(async (file, opts) => {
    const { jsx } = opts;
    let content;
    if (!file) {
      const chunks = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk);
      }
      content = Buffer.concat(chunks).toString('utf-8');
    } else {
      content = readFileSync(file, 'utf-8');
    }
    if (jsx) {
      await renderGum(content, opts);
    } else {
      await render(content, opts);
    }
  });

program.parseAsync().catch(err => {
  console.error(err);
  process.exit(1);
});

