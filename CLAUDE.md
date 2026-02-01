# Gummy - Project Context

Markdown pager that renders embedded gum.jsx visualizations inline in the terminal.

## Architecture

```
src/
  index.js    - CLI entrypoint, orchestrates parsing and rendering
  parser.js   - Handles evaluate and rendering (to PNG data) of gum.jsx
  renderer.js - A marked Renderer that echos most markdown and handles gum.jsx
  kitty.js    - Outputs images using Kitty graphics protocol
```

## Key Dependencies

- `gum-jsx` - Vector graphics DSL (local dependency at ../gum.jsx)
- `marked` - Markdown parser (we provide a custom renderer)

## Code Flow

1. **index.js**: Main entry point that either calls a markdown parser or a pure gum.jsx renderer
2. **display.js**: Evaluates gum.jsx code, renders to SVG, rasterizes to PNG
3. **renderer.js**: A basic marked Renderer that routes the gum.jsx routines
4. **terminal.js**: Base64 encodes PNG, outputs in 4KB chunks using Kitty escape sequences

## Gum.jsx Integration

- `evaluateGum(code, { theme, size })` - Parses and evaluates gum.jsx code, returns element tree
- `Svg` class - Wrapper element with `size: [width, height]` property
- `elem.svg()` - Generates SVG string from element tree

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

