// Parse markdown and extract gum.jsx code blocks

import { runJSX } from 'gum-jsx/eval';
import { Svg, is_element, setTheme } from 'gum-jsx';

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
  return opts;s
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

    // Parse and evaluate the gum code
    const code = match[2].trim();
    const options = parseOptions(match[1]);

    // Get theme information
    const { theme = 'dark' } = options;
    setTheme(theme);

    try {
      let elem = runJSX(code);

      // Wrap in Svg if not already (like evaluateGum does)
      if (is_element(elem) && !(elem instanceof Svg)) {
        elem = new Svg({ children: elem });
      }

      // Add the gum.jsx code block with evaluated element
      segments.push({
        type: 'gum',
        code,
        elem,
        size: elem?.size,
        options,
      });
    } catch (err) {
      // Store error for later handling
      segments.push({
        type: 'gum',
        code,
        error: err,
        options,
      });
    }

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
