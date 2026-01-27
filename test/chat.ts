#!/usr/bin/env npx tsx

import { marked } from 'marked';
import { appendFileSync, writeFileSync } from 'fs';
import { createRenderer } from '../src/renderer.js';
import type { Options } from '../src/types.js';
import { color } from '../src/kitty.ts';

writeFileSync('input.txt', ''); // Clear on start

const prompt = color('blue', '» ', true);
let inputBuffer = '';
let cursorPos = 0;

function clearLine(): void {
  process.stdout.write('\r\x1b[K');
}

function redrawInput(): void {
  clearLine();
  process.stdout.write(prompt + inputBuffer);
  // Position cursor
  const cursorOffset = inputBuffer.length - cursorPos;
  if (cursorOffset > 0) {
    process.stdout.write(`\x1b[${cursorOffset}D`);
  }
}

function renderMarkdown(content: string, opts: Options = {}): string {
  const renderer = createRenderer(opts);
  marked.use({ renderer });
  return marked(content) as string;
}

function cleanup(): void {
  process.stdout.write('\n');
  process.stdout.write('\x1b[<u'); // disable kitty keyboard protocol
  process.stdin.setRawMode(false);
  process.exit(0);
}

process.on('SIGINT', cleanup);

process.stdin.setRawMode(true);
process.stdout.write('\x1b[>1u'); // enable kitty keyboard protocol
process.stdout.write(prompt);

process.stdin.on('data', (key: Buffer) => {
  const seq = key.toString();
  const hex = [...key].map(b => b.toString(16).padStart(2, '0')).join(' ');
  appendFileSync('input.txt', `${JSON.stringify(seq)} [${hex}]\n`);

  if (seq === '\x03' || seq === '\x1b[99;5u') { // Ctrl+C
    cleanup();
  } else if (seq === '\r') { // Enter - submit
    clearLine();
    if (inputBuffer.trim()) {
      const rendered = renderMarkdown(inputBuffer);
      process.stdout.write(rendered);
    }
    inputBuffer = '';
    cursorPos = 0;
    process.stdout.write(prompt);
  } else if (seq === '\x1b[D') { // Left arrow
    if (cursorPos > 0) {
      cursorPos--;
      process.stdout.write(seq);
    }
  } else if (seq === '\x1b[C') { // Right arrow
    if (cursorPos < inputBuffer.length) {
      cursorPos++;
      process.stdout.write(seq);
    }
  } else if (seq === '\x1b[H' || seq === '\x1b[1~') { // Home
    cursorPos = 0;
    redrawInput();
  } else if (seq === '\x1b[F' || seq === '\x1b[4~') { // End
    cursorPos = inputBuffer.length;
    redrawInput();
  } else if (seq === '\x7f' || seq === '\b') { // Backspace
    if (cursorPos > 0) {
      inputBuffer = inputBuffer.slice(0, cursorPos - 1) + inputBuffer.slice(cursorPos);
      cursorPos--;
      redrawInput();
    }
  } else if (seq === '\x1b[3~') { // Delete
    if (cursorPos < inputBuffer.length) {
      inputBuffer = inputBuffer.slice(0, cursorPos) + inputBuffer.slice(cursorPos + 1);
      redrawInput();
    }
  } else if (seq.length === 1 && seq >= ' ' && seq <= '~') { // Printable ASCII
    inputBuffer = inputBuffer.slice(0, cursorPos) + seq + inputBuffer.slice(cursorPos);
    cursorPos++;
    if (cursorPos === inputBuffer.length) {
      process.stdout.write(seq);
    } else {
      redrawInput();
    }
  }
});
