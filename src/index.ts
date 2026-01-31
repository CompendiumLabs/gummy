#!/usr/bin/env tsx

// Gummy - Markdown pager with embedded gum.jsx visualizations

import { readFileSync } from 'fs'
import { program } from 'commander'
import { type Theme, type Options, isTheme } from './types'
import { displayMarkdown, displayGum } from './display'
import { watchAndRender } from './kitty'

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer)
  }
  return Buffer.concat(chunks).toString('utf-8')
}

function validateTheme(theme: string | undefined) : Theme | undefined {
  if (theme == null) return
  if (!isTheme(theme)) throw new Error(`Invalid theme: ${theme}`)
  return theme as Theme
}

program
  .name('gummy')
  .description('Markdown pager with embedded gum.jsx visualizations')
  .argument('[file]', 'Markdown file to render (reads from stdin if not provided)')
  .option('-W, --width <pixels>', 'Max width for gum blocks', parseInt)
  .option('-H, --height <pixels>', 'Max height for gum blocks', parseInt)
  .option('-t, --theme <name>', 'Theme to use for gum.jsx')
  .option('-s, --size <pixels>', 'Coordinate size for SVG', parseInt)
  .option('-j, --jsx', 'Render pure gum.jsx', undefined)
  .option('-w, --watch', 'Watch file for changes and auto-refresh', false)
  .action(async (file: string | undefined, { jsx, width, height, theme: theme0, size, watch: watchMode }: { jsx?: boolean, width?: number, height?: number, theme?: string, size?: number, watch?: boolean }) => {
    const theme = validateTheme(theme0)
    const opts: Options = { width, height, theme, size }

    // default to jsx if file is a .jsx file
    jsx ??= file != null && file.endsWith('.jsx')

    // render in watch mode or normal mode
    if (watchMode) {
      if (!file || !jsx) {
        console.error('Watch mode requires gum.jsx file')
        process.exit(1)
      }
      watchAndRender(file, (content, imageId) => displayGum(content, { ...opts, imageId }))
    } else {
      const content = file ? readFileSync(file, 'utf-8') : await readStdin()
      const displayer = jsx ? displayGum : displayMarkdown
      const output = displayer(content, opts)
      process.stdout.write(output)
    }
  })

program.parseAsync().catch((err: Error) => {
  console.error(err)
  process.exit(1)
})
