// Kitty graphics protocol implementation
// https://sw.kovidgoyal.net/kitty/graphics-protocol/

const CHUNK_SIZE = 4096;

export function encodeImage(pngBuffer) {
  return pngBuffer.toString('base64');
}

export function writeImage(pngBuffer, opts = {}) {
  const base64 = encodeImage(pngBuffer);
  const chunks = [];

  for (let i = 0; i < base64.length; i += CHUNK_SIZE) {
    chunks.push(base64.slice(i, i + CHUNK_SIZE));
  }

  chunks.forEach((chunk, i) => {
    const isLast = i === chunks.length - 1;
    const control = i === 0
      ? `f=100,a=T,m=${isLast ? 0 : 1}`
      : `m=${isLast ? 0 : 1}`;

    process.stdout.write(`\x1b_G${control};${chunk}\x1b\\`);
  });

  // Newline after image
  process.stdout.write('\n');
}
