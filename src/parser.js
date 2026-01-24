// Parse markdown and extract gum.jsx code blocks

// Matches ```gum or ```gum.jsx with optional [key=value,...] options
const GUM_FENCE_REGEX = /```(?:gum|gum\.jsx) *(?:\[([^\]]*)\])?\n([\s\S]*?)```/g;

function parseOptions(optString) {
  if (!optString) return {};
  const opts = {};
  for (const part of optString.split(',')) {
    const [key, value] = part.split('=').map(s => s.trim());
    if (key && value !== undefined) {
      // Parse numeric values
      const num = Number(value);
      opts[key] = isNaN(num) ? value : num;
    }
  }
  return opts;
}

export function parseMarkdown(content) {
  const segments = [];
  let lastIndex = 0;
  let match;

  // Reset regex state
  GUM_FENCE_REGEX.lastIndex = 0;

  while ((match = GUM_FENCE_REGEX.exec(content)) !== null) {
    // Add text before this code block
    if (match.index > lastIndex) {
      segments.push({
        type: 'markdown',
        content: content.slice(lastIndex, match.index),
      });
    }

    // Add the gum.jsx code block with options
    segments.push({
      type: 'gum',
      content: match[2].trim(),
      options: parseOptions(match[1]),
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last code block
  if (lastIndex < content.length) {
    segments.push({
      type: 'markdown',
      content: content.slice(lastIndex),
    });
  }

  return segments;
}
