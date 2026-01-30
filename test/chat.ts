#!/usr/bin/env npx tsx

import { readFileSync } from 'fs'
import { displayMarkdown, displayGum } from '../src/display'
import { ansi } from '../src/kitty'

import { generateText, stepCountIs, type UserModelMessage, type ModelMessage, type SystemModelMessage, type LanguageModel } from 'ai'
import { createAnthropic, anthropic } from '@ai-sdk/anthropic'

// environment variables
const ANTHROPIC_MODEL = 'claude-sonnet-4-5-20250929'
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const GUM_JSX_SKILL_ID = process.env.GUM_JSX_SKILL_ID

//
// prompt state
//

class StringBuffer {
  private buffer: string
  private cursorPos: number

  constructor() {
    this.buffer = ''
    this.cursorPos = 0
  }

  get(): string {
    return this.buffer
  }

  len(): number {
    return this.buffer.length
  }

  pos(): number {
    return this.cursorPos
  }

  atStart(): boolean {
    return this.cursorPos === 0
  }

  atEnd(): boolean {
    return this.cursorPos === this.buffer.length
  }

  clear(): void {
    this.buffer = ''
    this.cursorPos = 0
  }

  moveHome(): void {
    this.cursorPos = 0
  }

  moveEnd(): void {
    this.cursorPos = this.buffer.length
  }

  moveLeft(): void {
    this.cursorPos--
  }

  moveRight(): void {
    this.cursorPos++
  }

  insert(char: string): void {
    this.buffer = this.buffer.slice(0, this.cursorPos) + char + this.buffer.slice(this.cursorPos)
    this.cursorPos++
  }

  delete(): void {
    this.buffer = this.buffer.slice(0, this.cursorPos - 1) + this.buffer.slice(this.cursorPos)
    this.cursorPos--
  }
}

//
// chat client
//

class ChatClient {
  model: LanguageModel
  messages: ModelMessage[]
  tools: any | null
  providerOptions: any | null

  constructor(model: LanguageModel, { system, skills }: { system?: string | null, skills?: any[] | null }) {
    this.model = model
    this.tools = skills ? {
      code_execution: anthropic.tools.codeExecution_20250825(),
    } : null
    this.providerOptions = skills ? {
      anthropic: {
        container: { skills },
      },
     } : null
    this.messages = system ? [
      { role: 'system', content: system } as SystemModelMessage
    ] : []
  }

  async reply(prompt: string, { steps = 5 }: { steps?: number } = { }) : Promise<string> {
    // create the user message
    const user = { role: 'user', content: prompt } as UserModelMessage
    this.messages.push(user)

    // submit the request
    const response = await generateText({
      model,
      prompt: this.messages,
      tools: this.tools,
      providerOptions: this.providerOptions,
      stopWhen: stepCountIs(steps),
    })

    // update the message history
    const reply = response.response?.messages ?? []
    this.messages.push(...reply)

    // return the response text
    return response.text
  }
}

// choose the model
const client = createAnthropic({ apiKey: ANTHROPIC_API_KEY })
const model = client(ANTHROPIC_MODEL)

// make the gum skill
const gum_skill = { type: 'custom', skillId: GUM_JSX_SKILL_ID, version: 'latest' }
const system = readFileSync('prompt/system.md', 'utf8').trim()

// make the chat client
const chat = new ChatClient(model, { system, skills: [ gum_skill ] })

//
// gum header
//

const logo = `
<Box margin={0.05} rounded clip border={10} border_stroke="#444">
  <HStack>
    <Box padding={0.2} fill="#444">
      <Text color={white}>GUM</Text>
    </Box>
    <Box padding={0.3} fill="#222">
      <Graph ylim={[-1.5, 1.5]} aspect={2}>
        <SymPoints
          fy={sin} xlim={[0, 2*pi]} size={0.5} N={30}
          shape={x => <Square rounded={0.1} spin={r2d*x} stroke-width={3} />}
        />
      </Graph>
    </Box>
  </HStack>
</Box>
`

// prompt start
const header = displayGum(logo, { size: 1000, height: 250 })
const prompt = ansi('»', { color: 'blue', bold: true }) + ' '
const buffer = new StringBuffer()

//
// prompt drawing
//

function clearLine(): void {
  process.stdout.write('\r\x1b[K')
}

function redrawInput(): void {
  clearLine()
  process.stdout.write(prompt + buffer.get())
  const cursorOffset = buffer.len() - buffer.pos()
  if (cursorOffset > 0) {
    process.stdout.write(`\x1b[${cursorOffset}D`)
  }
}

//
// start/stop routines
//

function startup(): void {
  process.stdin.setRawMode(true)
  process.stdout.write('\x1b[>1u') // enable kitty keyboard protocol
  process.stdout.write(header)
  process.stdout.write(prompt)
}

function cleanup(): void {
  process.stdout.write('\n')
  process.stdout.write('\x1b[<u') // disable kitty keyboard protocol
  process.stdin.setRawMode(false)
  process.exit(0)
}

//
// key parsing (handles both legacy and Kitty keyboard protocol)
//

type KeyId = 'CtrlC' | 'Enter' | 'Left' | 'Right' | 'Home' | 'End' | 'Backspace' | 'Delete' | 'Char'
type ParsedKey = { key: 'Char', char: string } | { key: Exclude<KeyId, 'Char'> } | null

function parseKey(seq: string): ParsedKey {
  // Ctrl+C
  if (seq === '\x03' || /^\x1b\[99;\d+u$/.test(seq)) {
    return { key: 'CtrlC' }
  }
  // Enter
  if (seq === '\r' || /^\x1b\[13(;\d+)?u$/.test(seq)) {
    return { key: 'Enter' }
  }
  // Left arrow
  if (seq === '\x1b[D' || /^\x1b\[1;\d+D$/.test(seq)) {
    return { key: 'Left' }
  }
  // Right arrow
  if (seq === '\x1b[C' || /^\x1b\[1;\d+C$/.test(seq)) {
    return { key: 'Right' }
  }
  // Home
  if (seq === '\x1b[H' || seq === '\x1b[1~' || /^\x1b\[1;\d+H$/.test(seq)) {
    return { key: 'Home' }
  }
  // End
  if (seq === '\x1b[F' || seq === '\x1b[4~' || /^\x1b\[1;\d+F$/.test(seq)) {
    return { key: 'End' }
  }
  // Backspace
  if (seq === '\x7f' || seq === '\b' || /^\x1b\[127(;\d+)?u$/.test(seq)) {
    return { key: 'Backspace' }
  }
  // Delete
  if (seq === '\x1b[3~' || /^\x1b\[3;\d+~$/.test(seq)) {
    return { key: 'Delete' }
  }
  // Printable ASCII
  if (seq.length === 1 && seq >= ' ' && seq <= '~') {
    return { key: 'Char', char: seq }
  }
  return null
}

//
// input handler
//

process.stdin.on('data', async (data: Buffer) => {
  const seq = data.toString()
  const parsed = parseKey(seq)
  if (!parsed) return

  switch (parsed.key) {
    case 'CtrlC':
      cleanup()
      break
    case 'Enter':
      clearLine()
      const input = buffer.get()
      if (input.trim()) {
        const input_render = displayMarkdown(input)
        process.stdout.write(input_render)
        const reply = await chat.reply(input_render)
        const reply_render = displayMarkdown(reply)
        process.stdout.write(reply_render)
      }
      buffer.clear()
      process.stdout.write(prompt)
      break
    case 'Left':
      if (buffer.pos() > 0) {
        buffer.moveLeft()
        process.stdout.write('\x1b[D')
      }
      break
    case 'Right':
      if (buffer.pos() < buffer.len()) {
        buffer.moveRight()
        process.stdout.write('\x1b[C')
      }
      break
    case 'Home':
      buffer.moveHome()
      redrawInput()
      break
    case 'End':
      buffer.moveEnd()
      redrawInput()
      break
    case 'Backspace':
      if (!buffer.atStart()) {
        buffer.delete()
        redrawInput()
      }
      break
    case 'Delete':
      if (!buffer.atEnd()) {
        buffer.delete()
        redrawInput()
      }
      break
    case 'Char':
      buffer.insert(parsed.char)
      if (buffer.atEnd()) {
        process.stdout.write(parsed.char)
      } else {
        redrawInput()
      }
      break
  }
})

//
// engage
//

process.on('SIGINT', cleanup)
startup()
