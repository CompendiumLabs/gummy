// Custom marked renderer for terminal output with gum.jsx support

import { readFileSync } from 'fs';
import { parseGum, renderGum, rasterizeSvg } from './parser.js';
import { formatImage, color } from './kitty.js';

const HEADING_COLORS = ['magenta', 'blue', 'green', 'red', 'cyan', 'yellow'];

// Parse space-delimited key=value options from string
function parseOptions(str) {
  const opts = {};
  for (const part of str.split(/\s+/)) {
    const eq = part.indexOf('=');
    if (eq > 0) {
      const key = part.slice(0, eq);
      const value = part.slice(eq + 1);
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
function createRenderer(globalOpts = {}) {
  const renderer = {
    // Block elements
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      const prefix = '#'.repeat(depth);
      const clr = HEADING_COLORS[depth - 1] || 'magenta';
      return color(clr, `${prefix} ${text}`, true) + '\n\n';
    },

    paragraph({ tokens }) {
      const text = this.parser.parseInline(tokens);
      return `${text}\n\n`;
    },

    code({ text, lang }) {
      const [baseLang, ...rest] = (lang || '').split(/\s+/);

      if (isGumLang(baseLang)) {
        const options = parseOptions(rest.join(' '));
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

      return `\`\`\`${baseLang}\n${text}\n\`\`\`\n\n`;
    },

    blockquote({ tokens }) {
      const text = this.parser.parse(tokens).trim().replace(/\n/g, '\n> ');
      return `> ${text}\n\n`;
    },

    list({ items, ordered }) {
      return items.map((item, i) => {
        const bullet = ordered ? `${i + 1}. ` : '- ';
        const text = this.parser.parse(item.tokens).trim();
        return bullet + text;
      }).join('\n') + '\n\n';
    },

    listitem({ tokens }) {
      const text = this.parser.parse(tokens).trim();
      return `- ${text}\n`;
    },

    hr() {
      return '---\n\n';
    },

    // Inline elements
    strong({ tokens }) {
      const text = this.parser.parseInline(tokens);
      return `**${text}**`;
    },

    em({ tokens }) {
      const text = this.parser.parseInline(tokens);
      return `_${text}_`;
    },

    codespan({ text }) {
      return `\`${text}\``;
    },

    link({ href, tokens }) {
      const text = this.parser.parseInline(tokens);
      return `[${text}](${href})`;
    },

    image({ href, text }) {
      const isUrl = /^https?:\/\//.test(href);
      const ext = href.split('.').pop()?.toLowerCase();

      if (!isUrl && (ext === 'png' || ext === 'svg')) {
        try {
          const data = readFileSync(href);
          const opts = parseOptions(text || '');
          const png = ext === 'svg' ? rasterizeSvg(data, opts) : data;
          return formatImage(png);
        } catch (err) {
          return `Unable to load: ${href}\n\n`;
        }
      }

      return `External URL: ${href}\n\n`;
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

export { createRenderer }

