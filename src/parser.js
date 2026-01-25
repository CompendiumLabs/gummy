// Parse markdown and extract gum.jsx code blocks

import { runJSX } from 'gum-jsx/eval';
import { Svg, is_element, setTheme } from 'gum-jsx';

// Defaults for Svg
const DEFAULT_SIZE = 750;

// Matches ```gum or ```gum.jsx with optional [key=value,...] options
const GUM_FENCE_REGEX = /```(?:gum|gum\.jsx) *(?:\[([^\]]*)\])?\n([\s\S]*?)```/g;

function parseOptions(optString) {
  if (!optString) return {};
  const opts = {};
  for (const part of optString.split(',')) {
    const [key, value] = part.split('=').map(s => s.trim());
    if (key && value) {
      const num = Number(value);
      opts[key] = isNaN(num) ? value : num;
    }
  }
  return opts;
}

function parseGum(code, theme='dark') {
  setTheme(theme);
  const elem0 = runJSX(code);
  const wrap = is_element(elem0) && !(elem0 instanceof Svg);
  const elem = wrap ? new Svg({ children: elem0, size: DEFAULT_SIZE }) : elem0;
  return elem;
}

function parseMarkdown(content) {
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
    const options = parseOptions(match[1]);
    const code = match[2].trim();

    // Get theme information
    const { theme = 'dark' } = options;

    // Parse and add tree or error
    try {
      const elem = parseGum(code, theme);
      segments.push({
        type: 'gum',
        code,
        elem,
        options,
      });
    } catch (err) {
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

export { parseMarkdown, parseGum }

