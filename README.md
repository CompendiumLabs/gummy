# Gummy

Markdown pager with embedded [gum.jsx](https://github.com/CompendiumLabs/gum.jsx) visualizations for terminals supporting the Kitty graphics protocol.

## Install

```bash
npm install
npm link
```

## Usage

```bash
gummy document.md
```

Or pipe from stdin:

```bash
cat document.md | gummy
```

## Gum Code Blocks

Embed gum.jsx visualizations using fenced code blocks:

```gum
<Plot xlim={[0, 2*pi]} ylim={[-1.5, 1.5]} aspect={2} margin>
  <SymLine fy={sin} stroke={blue} />
</Plot>
```

### Options

Specify rendering options in brackets after the language tag. Note that these aren't displayed by GitHub, you have to look at the actual file to see them. But this file will render properly with `gummy`.

```gum [width=600]
<Circle fill={blue} />
```

```gum [height=300]
<Circle fill={red} />
```

```gum [width=800, height=400]
<Circle fill={green} />
```

```gum [theme=light]
<Circle fill={purple} />
```

Options:
- `width` - max width in pixels
- `height` - max height in pixels
- `theme` - `dark` (default) or `light`

## Requirements

- Terminal with Kitty graphics protocol support (kitty, ghostty, foot, etc.)
- JavaScript runtime (node, bun, etc.)
