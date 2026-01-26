#!/usr/bin/env tsx

// Gummy - Markdown pager with embedded gum.jsx visualizations

import { readFileSync } from 'fs';
import { marked } from 'marked';
import { program } from 'commander';
import { createRenderer } from './renderer.js';
import { parseGum, renderGum } from './parser.js';
import { formatImage } from './kitty.js';

interface Options {
  [key: string]: string | number;
}

function displayMarkdown(content: string, opts: Options = {}): void {
  const renderer = createRenderer(opts);
  // @ts-expect-error useNewRenderer is valid but not in types
  marked.use({ renderer, useNewRenderer: true });
  const output = marked(content) as string;
  process.stdout.write(output);
}

function displayGum(code: string, opts: Options = {}): void {
  const elem = parseGum(code);
  const png = renderGum(elem, opts);
  process.stdout.write(formatImage(png));
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
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
  .action(async (file: string | undefined, { jsx, ...rawOpts }: { jsx: boolean; width?: number; height?: number }) => {
    const content = file ? readFileSync(file, 'utf-8') : await readStdin();
    const opts: Options = {};
    if (rawOpts.width != null) opts.width = rawOpts.width;
    if (rawOpts.height != null) opts.height = rawOpts.height;
    const displayer = jsx ? displayGum : displayMarkdown;
    displayer(content, opts);
  });

program.parseAsync().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});
