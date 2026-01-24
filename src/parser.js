// Parse markdown and extract gum.jsx code blocks

const GUM_FENCE_REGEX = /```(?:gum|gum\.jsx)\n([\s\S]*?)```/g;

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

    // Add the gum.jsx code block
    segments.push({
      type: 'gum',
      content: match[1].trim(),
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
