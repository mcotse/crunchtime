import { spawn, type ChildProcess } from 'node:child_process'
import { execSync } from 'node:child_process'
import { unlinkSync } from 'node:fs'

export const E2E_URL = 'http://localhost:5173'
export const TEST_DB = '/tmp/crunchtime-e2e.db'

let honoProc: ChildProcess | null = null
let viteProc: ChildProcess | null = null

/** Poll a URL until it responds (or throw after retries). */
async function waitForUrl(url: string, retries = 40, intervalMs = 500): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url)
      if (res.status < 500) return
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error(`${url} did not become ready after ${retries * intervalMs}ms`)
}

/** Vitest globalSetup: start servers + seed DB. */
export async function setup(): Promise<void> {
  // Wipe any leftover test DB
  for (const suffix of ['', '-shm', '-wal']) {
    try { unlinkSync(TEST_DB + suffix) } catch { /* ok */ }
  }

  // 1. Start Hono API server on port 3000
  honoProc = spawn(
    'npx',
    ['tsx', 'server/index.ts'],
    {
      env: { ...process.env, DB_PATH: TEST_DB, PORT: '3000' },
      stdio: 'pipe',
    },
  )
  honoProc.stderr?.on('data', (d) => process.stderr.write(d))

  await waitForUrl('http://localhost:3000/api/members')

  // 2. Seed test data into the test DB
  execSync('npx tsx server/seed.ts', {
    env: { ...process.env, DB_PATH: TEST_DB },
    encoding: 'utf-8',
  })

  // 3. Start Vite dev server on port 5173 (proxies /api → localhost:3000)
  viteProc = spawn(
    'npx',
    ['vite', '--port', '5173', '--strictPort'],
    {
      env: { ...process.env },
      stdio: 'pipe',
    },
  )
  viteProc.stderr?.on('data', (d) => process.stderr.write(d))

  await waitForUrl('http://localhost:5173')
}

/** Vitest globalTeardown: kill servers + delete test DB. */
export async function teardown(): Promise<void> {
  honoProc?.kill('SIGTERM')
  viteProc?.kill('SIGTERM')
  await new Promise((r) => setTimeout(r, 500)) // let processes exit
  for (const suffix of ['', '-shm', '-wal']) {
    try { unlinkSync(TEST_DB + suffix) } catch { /* ok */ }
  }
}
