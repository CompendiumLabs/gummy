// Custom marked renderer for terminal output with gum.jsx support

import { parseGum, renderGum } from './parser.js';
import { formatImage } from './kitty.js';

// Parse [key=value,...] options from info string
function parseOptions(infoString) {
  const match = infoString.match(/\[([^\]]*)\]/);
  if (!match) return {};
  const opts = {};
  for (const part of match[1].split(',')) {
    const [key, value] = part.split('=').map(s => s.trim());
    if (key && value) {
      const num = Number(value);
      opts[key] = isNaN(num) ? value : num;
    }
  }
  return opts;
}

// Check if language is gum/gum.jsx
function isGumLang(lang) {
  return lang === 'gum' || lang === 'gum.jsx';
}

// Create renderer with given global options
export function createRenderer(globalOpts = {}) {
  const renderer = {
    // Block elements
    heading({ text, depth }) {
      const prefix = '#'.repeat(depth) + ' ';
      return prefix + text + '\n\n';
    },

    paragraph({ text }) {
      return text + '\n\n';
    },

    code({ text, lang }) {
      const baseLang = lang?.split(/\s|\[/)[0] || '';

      if (isGumLang(baseLang)) {
        const options = parseOptions(lang || '');
        const renderOpts = { ...globalOpts, ...options };
        const { theme = 'dark' } = options;

        try {
          const elem = parseGum(text, theme);
          const png = renderGum(elem, renderOpts);
          return formatImage(png);
        } catch (err) {
          return `[gum.jsx error: ${err.message}]\n\n`;
        }
      }

      return '```' + (baseLang || '') + '\n' + text + '\n```\n\n';
    },

    blockquote({ text }) {
      return '> ' + text.trim().replace(/\n/g, '\n> ') + '\n\n';
    },

    list({ items, ordered }) {
      return items.map((item, i) => {
        const bullet = ordered ? `${i + 1}. ` : '- ';
        return bullet + item.text;
      }).join('\n') + '\n\n';
    },

    listitem({ text }) {
      return '- ' + text + '\n';
    },

    hr() {
      return '---\n\n';
    },

    // Inline elements
    strong({ text }) {
      return '**' + text + '**';
    },

    em({ text }) {
      return '_' + text + '_';
    },

    codespan({ text }) {
      return '`' + text + '`';
    },

    link({ href, text }) {
      return `[${text}](${href})`;
    },

    image({ href, text }) {
      return `![${text}](${href})`;
    },

    text({ text }) {
      return text;
    },

    html({ text }) {
      return text;
    },

    br() {
      return '\n';
    }
  };

  return renderer;
}
