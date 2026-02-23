import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'

export class AgentBrowser {
  readonly session: string

  constructor(session = randomUUID()) {
    this.session = session
  }

  /** Shell-quote a string using single quotes so CSS attribute selectors work. */
  private static q(s: string): string {
    return "'" + s.replace(/'/g, "'\\''") + "'"
  }

  private run(cmd: string, timeoutMs = 15_000): string {
    return execSync(
      `npx agent-browser ${cmd} --session ${this.session}`,
      { encoding: 'utf-8', timeout: timeoutMs },
    )
  }

  /** Navigate to a URL and wait for the page to be interactive. */
  open(url: string): void {
    this.run(`open ${AgentBrowser.q(url)}`)
  }

  /**
   * Get the accessibility-tree snapshot.
   * Returns the raw text output (element refs like @e1, @e2 + labels).
   */
  snapshot(opts: { interactive?: boolean; compact?: boolean } = {}): string {
    const flags = [
      opts.interactive ? '-i' : '',
      opts.compact ? '-c' : '',
    ]
      .filter(Boolean)
      .join(' ')
    return this.run(`snapshot ${flags}`)
  }

  /** Click an element identified by an @ref, CSS selector, or text= selector. */
  click(selector: string): void {
    this.run(`click ${AgentBrowser.q(selector)}`)
  }

  /** Clear an input and type a value (by @ref or CSS selector). */
  fill(selector: string, value: string): void {
    this.run(`fill ${AgentBrowser.q(selector)} ${AgentBrowser.q(value)}`)
  }

  /** Choose a <select> option by visible text value. */
  select(selector: string, value: string): void {
    this.run(`select ${AgentBrowser.q(selector)} ${AgentBrowser.q(value)}`)
  }

  /** Get the text content of an element (by @ref or CSS selector). */
  getText(selector: string): string {
    return this.run(`get text ${AgentBrowser.q(selector)}`).trim()
  }

  /**
   * Block until an element matching `selector` appears in the DOM.
   * Throws if it doesn't appear within `timeoutMs`.
   */
  waitFor(selector: string, timeoutMs = 8_000): void {
    this.run(`wait ${AgentBrowser.q(selector)} --timeout ${timeoutMs}`, timeoutMs + 2_000)
  }

  /** Destroy this browser session (frees daemon resources). */
  close(): void {
    try {
      execSync(`npx agent-browser session delete ${this.session}`, {
        encoding: 'utf-8',
        timeout: 5_000,
      })
    } catch {
      // Ignore — the session may have already expired.
    }
  }
}
