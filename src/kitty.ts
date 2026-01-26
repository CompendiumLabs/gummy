// Kitty graphics protocol implementation
// https://sw.kovidgoyal.net/kitty/graphics-protocol/

const CHUNK_SIZE = 4096;

// ANSI color codes
const COLORS: Record<string, number> = {
  magenta: 95,
  green: 92,
  cyan: 96,
  yellow: 93,
  blue: 94,
  red: 91,
};

export function color(name: string, text: string, bold = false): string {
  const code = COLORS[name] || 0;
  const prefix = bold ? '\x1b[1m' : '';
  return `${prefix}\x1b[${code}m${text}\x1b[0m`;
}

export function encodeImage(pngBuffer: Buffer): string {
  return pngBuffer.toString('base64');
}

export function formatImage(pngBuffer: Buffer): string {
  const base64 = encodeImage(pngBuffer);
  let result = '';

  for (let i = 0; i < base64.length; i += CHUNK_SIZE) {
    const chunk = base64.slice(i, i + CHUNK_SIZE);
    const isFirst = i === 0;
    const isLast = i + CHUNK_SIZE >= base64.length;
    const control = isFirst
      ? `f=100,a=T,m=${isLast ? 0 : 1}`
      : `m=${isLast ? 0 : 1}`;

    result += `\x1b_G${control};${chunk}\x1b\\`;
  }

  return result + '\n';
}
