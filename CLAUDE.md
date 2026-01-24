# Gummy - Project Context

Markdown pager that renders embedded gum.jsx visualizations inline in the terminal.

## Architecture

```
src/
  index.js    - CLI entrypoint, orchestrates parsing and rendering
  parser.js   - Extracts markdown and gum code blocks, evaluates gum.jsx
  renderer.js - Converts gum elements to PNG via resvg
  kitty.js    - Outputs images using Kitty graphics protocol
```

## Key Dependencies

- `gum-jsx` - Vector graphics DSL (local dependency at ../gum.jsx)
- `@resvg/resvg-js` - SVG to PNG rasterization
- `marked` + `marked-terminal` - Markdown rendering for terminal

## Code Flow

1. **parser.js**: Regex extracts ```` ```gum ```` blocks with optional `[key=value]` options
2. **parser.js**: Calls `runJSX()` to evaluate code, wraps in `Svg` if needed, stores `elem` and `elem.size`
3. **index.js**: Iterates segments, renders markdown with marked, passes gum elements to renderer
4. **renderer.js**: Uses `elem.size` for constraint calculations, calls `elem.svg()`, rasterizes with Resvg
5. **kitty.js**: Base64 encodes PNG, outputs in 4KB chunks using Kitty escape sequences

## Gum.jsx Integration

- `runJSX(code)` - Parses and evaluates gum.jsx code, returns element tree
- `Svg` class - Wrapper element with `size: [width, height]` property
- `elem.svg()` - Generates SVG string from element tree
- `setTheme(theme)` - Sets global theme ('dark' or 'light') before SVG generation

## Code Fence Syntax

```
```gum [width=600, height=400, theme=dark]
<Circle fill={blue} />
```
```

Options are parsed in `parseOptions()` and merged with global opts in index.js.

## Testing

```bash
node src/index.js test/test.md
```

Requires a terminal with Kitty graphics protocol support.

