#!/usr/bin/env npx tsx

import { appendFileSync, writeFileSync } from 'fs';
import { displayMarkdown, displayGum } from '../src/display.js';
import { color } from '../src/kitty.ts';

// nuke log file
writeFileSync('input.txt', '');

//
// prompt state
//

class StringBuffer {
  private buffer: string;
  private cursorPos: number;

  constructor() {
    this.buffer = '';
    this.cursorPos = 0;
  }

  get(): string {
    return this.buffer;
  }

  len(): number {
    return this.buffer.length;
  }

  pos(): number {
    return this.cursorPos;
  }

  atStart(): boolean {
    return this.cursorPos === 0;
  }

  atEnd(): boolean {
    return this.cursorPos === this.buffer.length;
  }

  clear(): void {
    this.buffer = '';
    this.cursorPos = 0;
  }

  moveHome(): void {
    this.cursorPos = 0;
  }

  moveEnd(): void {
    this.cursorPos = this.buffer.length;
  }

  moveLeft(): void {
    this.cursorPos--;
  }

  moveRight(): void {
    this.cursorPos++;
  }

  insert(char: string): void {
    this.buffer = this.buffer.slice(0, this.cursorPos) + char + this.buffer.slice(this.cursorPos);
    this.cursorPos++;
  }

  delete(): void {
    this.buffer = this.buffer.slice(0, this.cursorPos - 1) + this.buffer.slice(this.cursorPos);
    this.cursorPos--;
  }
}

//
// gum header
//

const logo = `
<Box margin={0.05} rounded clip border={10} border_stroke="#444">
  <HStack>
    <Box padding={0.2} fill="#444">
      <Text color={white}>GUM</Text>
    </Box>
    <Box padding={0.3} fill="#222">
      <Graph ylim={[-1.5, 1.5]} aspect={2}>
        <SymPoints
          fy={sin} xlim={[0, 2*pi]} size={0.5} N={30}
          shape={x => <Square rounded={0.1} spin={r2d*x} stroke-width={3} />}
        />
      </Graph>
    </Box>
  </HStack>
</Box>
`

// prompt start
const header = displayGum(logo, { height: 250 });
const prompt = color('blue', '»', true) + ' ';
const buffer = new StringBuffer();

//
// prompt drawing
//

function clearLine(): void {
  process.stdout.write('\r\x1b[K');
}

function redrawInput(): void {
  clearLine();
  process.stdout.write(prompt + buffer.get());
  const cursorOffset = buffer.len() - buffer.pos();
  if (cursorOffset > 0) {
    process.stdout.write(`\x1b[${cursorOffset}D`);
  }
}

//
// start/stop routines
//

function startup(): void {
  process.stdin.setRawMode(true);
  process.stdout.write('\x1b[>1u'); // enable kitty keyboard protocol
  process.stdout.write(header);
  process.stdout.write(prompt);
}

function cleanup(): void {
  process.stdout.write('\n');
  process.stdout.write('\x1b[<u'); // disable kitty keyboard protocol
  process.stdin.setRawMode(false);
  process.exit(0);
}

//
// input handler
//

process.stdin.on('data', (key: Buffer) => {
  const seq = key.toString();

  // log the input to a file
  const hex = [...key].map(b => b.toString(16).padStart(2, '0')).join(' ');
  appendFileSync('input.txt', `${JSON.stringify(seq)} [${hex}]\n`);

  if (seq === '\x03' || seq === '\x1b[99;5u') { // Ctrl+C
    cleanup();
  } else if (seq === '\r') { // Enter - submit
    clearLine();
    const input = buffer.get();
    if (input.trim()) {
      const rendered = displayMarkdown(input);
      process.stdout.write(rendered);
    }
    buffer.clear();
    process.stdout.write(prompt);
  } else if (seq === '\x1b[D') { // Left arrow
    if (buffer.pos() > 0) {
      buffer.moveLeft();
      process.stdout.write(seq);
    }
  } else if (seq === '\x1b[C') { // Right arrow
    if (buffer.pos() < buffer.len()) {
      buffer.moveRight();
      process.stdout.write(seq);
    }
  } else if (seq === '\x1b[H' || seq === '\x1b[1~') { // Home
    buffer.moveHome();
    redrawInput();
  } else if (seq === '\x1b[F' || seq === '\x1b[4~') { // End
    buffer.moveEnd();
    redrawInput();
  } else if (seq === '\x7f' || seq === '\b') { // Backspace
    if (!buffer.atStart()) {
      buffer.delete();
      redrawInput();
    }
  } else if (seq === '\x1b[3~') { // Delete
    if (!buffer.atEnd()) {
      buffer.delete();
      redrawInput();
    }
  } else if (seq.length === 1 && seq >= ' ' && seq <= '~') { // Printable ASCII
    buffer.insert(seq);
    if (buffer.atEnd()) {
      process.stdout.write(seq);
    } else {
      redrawInput();
    }
  }
});

//
// engage
//

process.on('SIGINT', cleanup);
startup();
