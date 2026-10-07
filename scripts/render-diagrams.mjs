// Renders every Mermaid diagram tagged <!-- diagram: name --> in README.md and docs/*.md to docs/diagrams/<name>.png.
// Usage: node scripts/render-diagrams.mjs   (uses mmdc if installed, otherwise npx @mermaid-js/mermaid-cli)
import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'docs', 'diagrams')
const sources = ['README.md', ...fs.readdirSync(path.join(root, 'docs')).filter(f => f.endsWith('.md')).map(f => `docs/${f}`)]
// The diagrams are dark cards, so the PNGs sit on the app's stage navy.
const BACKGROUND = '#0b0e1f'

const hasMmdc = spawnSync('mmdc', ['--version'], { stdio: 'ignore' }).status === 0
const [cmd, ...cmdArgs] = hasMmdc ? ['mmdc'] : ['npx', '-y', '@mermaid-js/mermaid-cli']

fs.mkdirSync(outDir, { recursive: true })
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mockify-diagrams-'))
let count = 0

// Reuse an installed Chrome instead of making puppeteer download its own.
const chrome = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find(p => p && fs.existsSync(p))
const browserArgs = []
if (chrome) {
  const config = path.join(tmp, 'puppeteer.json')
  fs.writeFileSync(config, JSON.stringify({ executablePath: chrome, headless: 'shell' }))
  browserArgs.push('-p', config)
}

for (const source of sources) {
  const md = fs.readFileSync(path.join(root, source), 'utf8')
  for (const [, name, code] of md.matchAll(/<!-- diagram: ([\w-]+) -->\s*```mermaid\n([\s\S]*?)```/g)) {
    const input = path.join(tmp, `${name}.mmd`)
    const output = path.join(outDir, `${name}.png`)
    fs.writeFileSync(input, code)
    execFileSync(cmd, [...cmdArgs, ...browserArgs, '-q', '-i', input, '-o', output, '-b', BACKGROUND, '-s', '2', '-w', '1400'], { stdio: 'inherit' })
    console.log(`✓ ${path.relative(root, output)}  (from ${source})`)
    count++
  }
}

fs.rmSync(tmp, { recursive: true, force: true })
console.log(count ? `Rendered ${count} diagrams.` : 'No tagged diagrams found.')
