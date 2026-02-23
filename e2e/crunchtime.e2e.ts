import { describe, it, beforeEach, afterEach, expect } from 'vitest'
import { AgentBrowser } from './helpers/AgentBrowser'
import { E2E_URL } from './helpers/server'

const APP = E2E_URL  // http://localhost:5173

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reset the group name back to the seed value via API (for settings tests). */
async function resetGroupName(): Promise<void> {
  await fetch('http://localhost:3000/api/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groupName: 'Crunch Fund' }),
  })
}

// ---------------------------------------------------------------------------
// Suite: Home tab
// ---------------------------------------------------------------------------

describe('Home tab', () => {
  let ab: AgentBrowser

  beforeEach(() => { ab = new AgentBrowser() })
  afterEach(() => ab.close())

  it('renders the group name from the API', async () => {
    ab.open(APP)
    // Wait for the React app to fetch and render data from /api/settings
    ab.waitFor('text=Crunch Fund')
    const snap = ab.snapshot({ compact: true })
    expect(snap).toContain('Crunch Fund')
  })

  it('renders a dollar-amount balance', async () => {
    ab.open(APP)
    ab.waitFor('text=Crunch Fund')
    const snap = ab.snapshot({ compact: true })
    // Seeded members have non-zero balances; a $ amount must appear
    expect(snap).toMatch(/\$\d/)
  })

  it('shows recent transactions', async () => {
    ab.open(APP)
    ab.waitFor('text=Crunch Fund')
    const snap = ab.snapshot({ compact: true })
    // Seeded transactions include "Groceries" (see data/mockData.ts)
    expect(snap).toContain('Groceries')
  })
})

// ---------------------------------------------------------------------------
// Suite: Tab navigation
// ---------------------------------------------------------------------------

describe('Tab navigation', () => {
  let ab: AgentBrowser

  beforeEach(() => {
    ab = new AgentBrowser()
    ab.open(APP)
    ab.waitFor('text=Crunch Fund')
  })
  afterEach(() => ab.close())

  it('navigates to the Activity tab and shows the transaction feed', () => {
    // The tab bar uses button labels: Home, Activity, Members, Analytics, Settings
    ab.click('text=Activity')
    ab.waitFor('text=All Transactions')
    const snap = ab.snapshot({ compact: true })
    expect(snap).toContain('All Transactions')
  })

  it('navigates to the Members tab and lists members', () => {
    ab.click('text=Members')
    ab.waitFor('text=Members')
    const snap = ab.snapshot({ compact: true })
    // Seeded member: Alice Osei (see data/mockData.ts)
    expect(snap).toContain('Alice Osei')
  })

  it('navigates to the Analytics tab', () => {
    ab.click('text=Analytics')
    ab.waitFor('text=Spending by Category')
    const snap = ab.snapshot({ compact: true })
    expect(snap).toContain('Spending by Category')
  })

  it('navigates to the Settings tab', () => {
    ab.click('text=Settings')
    ab.waitFor('text=Group Name')
    const snap = ab.snapshot({ compact: true })
    expect(snap).toContain('Group Name')
    expect(snap).toContain('Dark Mode')
  })
})

// ---------------------------------------------------------------------------
// Suite: Add Transaction flow
// ---------------------------------------------------------------------------

describe('Add Transaction', () => {
  let ab: AgentBrowser

  beforeEach(() => {
    ab = new AgentBrowser()
    ab.open(APP)
    ab.waitFor('text=Crunch Fund')
  })
  afterEach(() => ab.close())

  it('opens the sheet, submits a transaction, and it appears in the Activity feed', () => {
    const uniqueDesc = `E2E Test ${Date.now()}`

    // Click the + (add transaction) button on the home tab
    // The button has aria-label="Add transaction" in HomeTab.tsx
    ab.click('[aria-label="Add transaction"]')

    // Wait for the sheet to appear
    ab.waitFor('text=Add Transaction')

    // Fill in the amount
    ab.fill('[placeholder="0.00"]', '42.50')

    // Fill in the description
    ab.fill('[placeholder="What was this for?"]', uniqueDesc)

    // The first member is pre-selected; no need to change the dropdown

    // Submit
    ab.click('text=Add Transaction')

    // Sheet should close and SSE delivers the new transaction
    // Navigate to Activity tab to see the feed
    ab.click('text=Activity')
    ab.waitFor(`text=${uniqueDesc}`)

    const snap = ab.snapshot({ compact: true })
    expect(snap).toContain(uniqueDesc)
    expect(snap).toContain('$42.50')
  })
})

// ---------------------------------------------------------------------------
// Suite: Settings — edit group name
// ---------------------------------------------------------------------------

describe('Settings: edit group name', () => {
  let ab: AgentBrowser

  beforeEach(async () => {
    await resetGroupName()
    ab = new AgentBrowser()
    ab.open(APP)
    ab.waitFor('text=Crunch Fund')
  })

  afterEach(async () => {
    ab.close()
    await resetGroupName()
  })

  it('updates the group name and reflects it on the Home tab', () => {
    const newName = `Weekend Fund ${Date.now().toString().slice(-4)}`

    // Navigate to Settings
    ab.click('text=Settings')
    ab.waitFor('text=Group Name')

    // Click the edit (pencil) button next to the group name
    ab.click('[aria-label="Edit"]')

    // Clear and fill the name input
    ab.fill('[aria-label="Save"]', '')  // focus the input first
    // The input appears next to the save button; fill by placeholder pattern
    ab.click('text=Settings')  // re-focus the page (avoids stale refs)
    // Better: use the visible input that appears when editing
    ab.click('[aria-label="Edit"]')
    ab.waitFor('input')
    ab.fill('input', newName)

    // Save
    ab.click('[aria-label="Save"]')

    // Navigate back to Home
    ab.click('text=Home')
    ab.waitFor(`text=${newName}`)

    const snap = ab.snapshot({ compact: true })
    expect(snap).toContain(newName)
  })
})
