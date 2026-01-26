// Custom marked renderer for terminal output with gum.jsx support

import { readFileSync } from 'fs';
import type { Tokens, RendererObject } from 'marked';
import { parseGum, renderGum, rasterizeSvg } from './parser.js';
import { formatImage, color } from './kitty.js';

const HEADING_COLORS = ['magenta', 'blue', 'green', 'red', 'cyan', 'yellow'];

interface Options {
  [key: string]: string | number;
}

// Parse space-delimited key=value options from string
function parseOptions(str: string): Options {
  const opts: Options = {};
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
function isGumLang(lang: string): boolean {
  return lang === 'gum' || lang === 'gum.jsx';
}

// Create renderer with given global options
export function createRenderer(globalOpts: Options = {}): RendererObject {
  return {
    // Block elements
    heading({ tokens, depth }: Tokens.Heading): string {
      const text = this.parser.parseInline(tokens);
      const prefix = '#'.repeat(depth);
      const clr = HEADING_COLORS[depth - 1] || 'magenta';
      return color(clr, `${prefix} ${text}`, true) + '\n\n';
    },

    paragraph({ tokens }: Tokens.Paragraph): string {
      const text = this.parser.parseInline(tokens);
      return `${text}\n\n`;
    },

    code({ text, lang }: Tokens.Code): string {
      const [baseLang, ...rest] = (lang || '').split(/\s+/);

      if (isGumLang(baseLang)) {
        const options = parseOptions(rest.join(' '));
        const renderOpts = { ...globalOpts, ...options };
        const theme: 'light' | 'dark' = options.theme === 'light' ? 'light' : 'dark';

        try {
          const elem = parseGum(text, theme);
          const png = renderGum(elem, renderOpts);
          return formatImage(png);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return `[gum.jsx error: ${message}]\n\n`;
        }
      }

      return `\`\`\`${baseLang}\n${text}\n\`\`\`\n\n`;
    },

    blockquote({ tokens }: Tokens.Blockquote): string {
      const text = this.parser.parse(tokens).trim().replace(/\n/g, '\n> ');
      return `> ${text}\n\n`;
    },

    list({ items, ordered }: Tokens.List): string {
      return items.map((item: Tokens.ListItem, i: number) => {
        const bullet = ordered ? `${i + 1}. ` : '- ';
        const text = this.parser.parse(item.tokens).trim();
        return bullet + text;
      }).join('\n') + '\n\n';
    },

    listitem({ tokens }: Tokens.ListItem): string {
      const text = this.parser.parse(tokens).trim();
      return `- ${text}\n`;
    },

    hr(): string {
      return '---\n\n';
    },

    // Inline elements
    strong({ tokens }: Tokens.Strong): string {
      const text = this.parser.parseInline(tokens);
      return `**${text}**`;
    },

    em({ tokens }: Tokens.Em): string {
      const text = this.parser.parseInline(tokens);
      return `_${text}_`;
    },

    codespan({ text }: Tokens.Codespan): string {
      return `\`${text}\``;
    },

    link({ href, tokens }: Tokens.Link): string {
      const text = this.parser.parseInline(tokens);
      return `[${text}](${href})`;
    },

    image({ href, text }: Tokens.Image): string {
      const isUrl = /^https?:\/\//.test(href);
      const ext = href.split('.').pop()?.toLowerCase();

      if (!isUrl && (ext === 'png' || ext === 'svg')) {
        try {
          const data = readFileSync(href);
          const opts = parseOptions(text || '');
          const png = ext === 'svg' ? rasterizeSvg(data, opts) : data;
          return formatImage(png);
        } catch {
          return `Unable to load: ${href}\n\n`;
        }
      }

      return `External URL: ${href}\n\n`;
    },

    text(token: Tokens.Text | Tokens.Escape): string {
      return token.text;
    },

    html(token: Tokens.HTML | Tokens.Tag): string {
      return 'text' in token ? token.text : '';
    },

    br(): string {
      return '\n';
    }
  };
}
