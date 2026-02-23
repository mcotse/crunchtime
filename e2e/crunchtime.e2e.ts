import { describe, it, beforeEach, afterEach } from 'vitest'
import { expect } from 'vitest'
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
    ab.waitFor('text=Crunch Fund')
    const snap = ab.snapshot({ compact: true })
    expect(snap).toContain('Crunch Fund')
  })

  it('renders a dollar-amount balance', async () => {
    ab.open(APP)
    ab.waitFor('text=Crunch Fund')
    const snap = ab.snapshot({ compact: true })
    // Seeded members have non-zero balances; a $ amount must appear
    expect(snap).toMatch(/\$[\d,]/)
  })

  it('shows recent transactions on the Activity tab', async () => {
    ab.open(APP)
    ab.waitFor('text=Crunch Fund')
    // Home tab shows only balance summary — navigate to Activity for transactions
    ab.click('[aria-label="Activity"]')
    ab.waitFor('text=Recent Activity')
    const snap = ab.snapshot({ compact: true })
    // Seeded transactions include "Grocery Run" (see data/mockData.ts)
    expect(snap).toContain('Grocery Run')
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
    ab.click('[aria-label="Activity"]')
    ab.waitFor('text=Recent Activity')
    const snap = ab.snapshot({ compact: true })
    expect(snap).toContain('Recent Activity')
  })

  it('navigates to the Analytics tab', () => {
    ab.click('[aria-label="Analytics"]')
    ab.waitFor('text=Analytics')
    const snap = ab.snapshot({ compact: true })
    expect(snap).toContain('Analytics')
  })

  it('navigates to the Settings tab', () => {
    ab.click('[aria-label="Settings"]')
    ab.waitFor('text=Settings')
    const snap = ab.snapshot({ compact: true })
    expect(snap).toContain('Settings')
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

    // Click the "Add Transaction" button on the home tab
    ab.click('text=Add Transaction')

    // Wait for the sheet to appear (title is "New Transaction")
    ab.waitFor('text=New Transaction')

    // Fill in the amount
    ab.fill('[placeholder="0.00"]', '42.50')

    // Fill in the description (placeholder text from AddTransactionSheet.tsx)
    ab.fill('[placeholder="What is this for?"]', uniqueDesc)

    // Submit via the pinned CTA button (aria-label added to disambiguate)
    ab.click('[aria-label="Submit transaction"]')

    // Navigate to Activity tab — SSE delivers the new transaction
    ab.click('[aria-label="Activity"]')
    ab.waitFor(`text=${uniqueDesc}`)

    const snap = ab.snapshot({ compact: true })
    expect(snap).toContain(uniqueDesc)
    expect(snap).toContain('42.50')
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
    ab.click('[aria-label="Settings"]')
    ab.waitFor('text=Settings')

    // Click the edit (pencil) button (aria-label added to SettingsTab.tsx)
    ab.click('[aria-label="Edit group name"]')

    // Wait for the input to appear and fill the new name
    ab.waitFor('input')
    ab.fill('input', newName)

    // Save (aria-label added to SettingsTab.tsx)
    ab.click('[aria-label="Save group name"]')

    // Navigate back to Home and verify the new name appears
    ab.click('[aria-label="Home"]')
    ab.waitFor(`text=${newName}`)

    const snap = ab.snapshot({ compact: true })
    expect(snap).toContain(newName)
  })
})
