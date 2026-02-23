import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.DB_PATH = ':memory:'
})

describe('db schema', () => {
  it('creates members table', async () => {
    const { default: db } = await import('../db.js')
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='members'").get()
    expect(row).toBeTruthy()
  })

  it('creates transactions table', async () => {
    const { default: db } = await import('../db.js')
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'").get()
    expect(row).toBeTruthy()
  })

  it('seeds group_name setting', async () => {
    const { default: db } = await import('../db.js')
    const row = db.prepare("SELECT value FROM settings WHERE key='group_name'").get() as { value: string }
    expect(row.value).toBe('Crunch Fund')
  })
})
