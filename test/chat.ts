#!/usr/bin/env npx tsx

import { marked } from 'marked';
import { appendFileSync, writeFileSync } from 'fs';
import { createRenderer } from '../src/renderer.js';
import type { Options } from '../src/types.js';

writeFileSync('input.txt', ''); // Clear on start

const promptHeight = 7;
const promptPrefix = '> ';
let rows = process.stdout.rows ?? 24;
let cols = process.stdout.columns ?? 80;

let inputBuffer = '';
let cursorPos = 0;

function setScrollRegion(): void {
  process.stdout.write(`\x1b[1;${rows - promptHeight}r`);
}

function resetScrollRegion(): void {
  process.stdout.write(`\x1b[r`);
}

function moveTo(row: number, col: number): void {
  process.stdout.write(`\x1b[${row};${col}H`);
}

function clearPromptArea(): void {
  moveTo(rows - promptHeight + 1, 1);
  process.stdout.write(`\x1b[J`);
}

function drawPromptBox(): void {
  clearPromptArea();
  const line = '─'.repeat(cols);
  moveTo(rows - promptHeight + 1, 1);
  process.stdout.write(line);
  redrawInput();
}

function redrawInput(): void {
  // Clear input area (lines 2+ of prompt box)
  for (let i = 2; i <= promptHeight; i++) {
    moveTo(rows - promptHeight + i, 1);
    process.stdout.write(' '.repeat(cols));
  }

  // Draw input with prefix
  const lines = inputBuffer.split('\n');
  const maxLines = promptHeight - 1;

  for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
    moveTo(rows - promptHeight + 2 + i, 1);
    const prefix = i === 0 ? promptPrefix : '  ';
    process.stdout.write(prefix + lines[i]);
  }

  // Position cursor
  let charsBeforeCursor = cursorPos;
  let cursorLine = 0;
  let cursorCol = promptPrefix.length;

  for (let i = 0; i < lines.length; i++) {
    if (charsBeforeCursor <= lines[i].length) {
      cursorLine = i;
      cursorCol = (i === 0 ? promptPrefix.length : 2) + charsBeforeCursor;
      break;
    }
    charsBeforeCursor -= lines[i].length + 1; // +1 for newline
  }

  moveTo(rows - promptHeight + 2 + cursorLine, cursorCol + 1);
}

function addToScrollRegion(text: string): void {
  process.stdout.write(`\x1b[s`); // save cursor
  moveTo(rows - promptHeight, 1); // bottom of scroll region
  process.stdout.write(text);
  process.stdout.write(`\x1b[u`); // restore cursor
}

function renderMarkdown(content: string, opts: Options = {}): string {
  const renderer = createRenderer(opts);
  marked.use({ renderer });
  return marked(content) as string;
}

function setup(): void {
  process.stdout.write('\x1b[?1049h'); // alternate screen buffer
  process.stdout.write('\x1b[>1u'); // enable kitty keyboard protocol
  process.stdout.write('\x1b[2J'); // clear screen
  setScrollRegion();
  moveTo(1, 1);
  drawPromptBox();
}

function cleanup(): void {
  process.stdout.write('\x1b[<u'); // disable kitty keyboard protocol
  resetScrollRegion();
  process.stdout.write('\x1b[?1049l'); // exit alternate screen buffer
  process.exit(0);
}

// Handle resize
process.stdout.on('resize', () => {
  rows = process.stdout.rows ?? 24;
  cols = process.stdout.columns ?? 80;
  resetScrollRegion();
  setScrollRegion();
  drawPromptBox();
});

process.on('SIGINT', cleanup);

process.stdin.setRawMode(true);

process.stdin.on('data', (key: Buffer) => {
  const seq = key.toString();
  const hex = [...key].map(b => b.toString(16).padStart(2, '0')).join(' ');
  appendFileSync('input.txt', `${JSON.stringify(seq)} [${hex}]\n`);

  if (seq === '\x03' || seq === '\x1b[99;5u') { // Ctrl+C
    cleanup();
  } else if (seq === '\n') { // Shift+Enter - newline
    inputBuffer = inputBuffer.slice(0, cursorPos) + '\n' + inputBuffer.slice(cursorPos);
    cursorPos++;
    redrawInput();
  } else if (seq === '\r') { // Enter - submit
    if (inputBuffer.trim()) {
      const rendered = renderMarkdown(inputBuffer);
      addToScrollRegion(rendered);
    }
    inputBuffer = '';
    cursorPos = 0;
    drawPromptBox();
  } else if (seq === '\x1b[D') { // Left arrow
    if (cursorPos > 0) {
      cursorPos--;
      redrawInput();
    }
  } else if (seq === '\x1b[C') { // Right arrow
    if (cursorPos < inputBuffer.length) {
      cursorPos++;
      redrawInput();
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
    redrawInput();
  }
});

setup();
