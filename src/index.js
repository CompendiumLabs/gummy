#!/usr/bin/env node

// Gummy - Markdown pager with embedded gum.jsx visualizations

import { readFileSync } from 'fs';
import { marked } from 'marked';
import { program } from 'commander';
import { createRenderer } from './renderer.js';
import { parseGum, renderGum } from './parser.js';
import { formatImage } from './kitty.js';

function displayMarkdown(content, opts = {}) {
  const renderer = createRenderer(opts);
  marked.use({ renderer, useNewRenderer: true });
  const output = marked(content);
  process.stdout.write(output);
}

function displayGum(code, opts = {}) {
  const elem = parseGum(code);
  const png = renderGum(elem, opts);
  process.stdout.write(formatImage(png));
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

program
  .name('gummy')
  .description('Markdown pager with embedded gum.jsx visualizations')
  .argument('[file]', 'Markdown file to render (reads from stdin if not provided)')
  .option('-W, --width <pixels>', 'Max width for gum blocks', parseInt)
  .option('-H, --height <pixels>', 'Max height for gum blocks', parseInt)
  .option('-j, --jsx', 'Render pure gum.jsx', false)
  .action(async (file, { jsx, ...opts }) => {
    const content = file ? readFileSync(file, 'utf-8') : await readStdin();
    const displayer = jsx ? displayGum : displayMarkdown;
    displayer(content, opts);
  });

program.parseAsync().catch(err => {
  console.error(err);
  process.exit(1);
});

