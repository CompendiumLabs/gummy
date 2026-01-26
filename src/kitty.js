// Kitty graphics protocol implementation
// https://sw.kovidgoyal.net/kitty/graphics-protocol/

const CHUNK_SIZE = 4096;

export function encodeImage(pngBuffer) {
  return pngBuffer.toString('base64');
}

export function formatImage(pngBuffer) {
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
