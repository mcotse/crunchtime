# Own-Vote "You" Pill Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show a small "You" pill badge next to the option text on any option the current user voted for inside `PollCard`.

**Architecture:** Pure UI change in `PollCard.tsx`. Add a `flex-shrink-0` `"You"` span rendered conditionally when `isVoted === true`, positioned between the option text and the percentage. No data model, API, or backend changes needed.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vitest 3, `@testing-library/react`, `jsdom`

---

### Task 1: Install frontend testing dependencies

No test infrastructure exists for React components yet. This task wires it up.

**Files:**
- Modify: `package.json`
- Create: `vitest.frontend.config.ts`

**Step 1: Install packages**

```bash
cd /Users/mcotse/.superset/worktrees/crunchtime/own-vote
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Expected: packages added to `devDependencies` in `package.json`.

**Step 2: Create `vitest.frontend.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
```

**Step 3: Create `src/test-setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

**Step 4: Add script to `package.json`**

In the `"scripts"` block, add:

```json
"test:frontend": "vitest run --config vitest.frontend.config.ts",
"test:frontend:watch": "vitest --config vitest.frontend.config.ts"
```

**Step 5: Commit**

```bash
git add vitest.frontend.config.ts src/test-setup.ts package.json package-lock.json
git commit -m "chore: add frontend component testing setup (vitest + @testing-library/react + jsdom)"
```

---

### Task 2: Write the failing test

**Files:**
- Create: `src/components/__tests__/PollCard.test.tsx`

**Step 1: Create test file**

```tsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PollCard } from '../PollCard'
import { Poll } from '../../data/pollsData'
import { Member } from '../../data/mockData'

const members: Member[] = [
  { id: 'u1', name: 'Alice', initials: 'AL', color: '#e74c3c', phone: '', email: '' },
  { id: 'u2', name: 'Bob',   initials: 'BO', color: '#3498db', phone: '', email: '' },
]

const basePoll: Poll = {
  id: 'poll1',
  emoji: '🍕',
  title: 'Where should we eat?',
  creatorId: 'u1',
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
  isArchived: false,
  allowMembersToAddOptions: true,
  allowMultiSelect: false,
  options: [
    { id: 'o1', text: 'Italian', voterIds: ['u1'] },
    { id: 'o2', text: 'Japanese', voterIds: ['u2'] },
  ],
}

describe('PollCard – own vote "You" pill', () => {
  it('shows "You" on the option the current user voted for', () => {
    render(
      <PollCard
        poll={basePoll}
        members={members}
        currentUserId="u1"
        onTap={() => {}}
        onVote={() => {}}
      />
    )
    expect(screen.getByText('You')).toBeInTheDocument()
  })

  it('does not show "You" on options the current user did not vote for', () => {
    render(
      <PollCard
        poll={basePoll}
        members={members}
        currentUserId="u1"
        onTap={() => {}}
        onVote={() => {}}
      />
    )
    // Only one "You" pill should exist — on Italian, not Japanese
    expect(screen.getAllByText('You')).toHaveLength(1)
  })

  it('shows no "You" pill when the current user has not voted', () => {
    const unvotedPoll: Poll = {
      ...basePoll,
      options: [
        { id: 'o1', text: 'Italian', voterIds: [] },
        { id: 'o2', text: 'Japanese', voterIds: [] },
      ],
    }
    render(
      <PollCard
        poll={unvotedPoll}
        members={members}
        currentUserId="u1"
        onTap={() => {}}
        onVote={() => {}}
      />
    )
    expect(screen.queryByText('You')).not.toBeInTheDocument()
  })

  it('shows "You" on multiple options when multi-select is on and user voted for both', () => {
    const multiPoll: Poll = {
      ...basePoll,
      allowMultiSelect: true,
      options: [
        { id: 'o1', text: 'Italian',  voterIds: ['u1'] },
        { id: 'o2', text: 'Japanese', voterIds: ['u1'] },
      ],
    }
    render(
      <PollCard
        poll={multiPoll}
        members={members}
        currentUserId="u1"
        onTap={() => {}}
        onVote={() => {}}
      />
    )
    expect(screen.getAllByText('You')).toHaveLength(2)
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
npm run test:frontend
```

Expected output: 4 tests FAIL with errors like:
- `Unable to find an element with the text: You`
- Or similar "not found" assertion failures

---

### Task 3: Implement the "You" pill in PollCard

**Files:**
- Modify: `src/components/PollCard.tsx:218-240`

**Step 1: Locate the option row flex div**

Inside the `poll.options.map(...)` block, find the inner flex row:

```tsx
<div className="flex items-center gap-3">
  <div className={`flex-shrink-0 w-5 h-5 rounded-full ...`}>
    {isVoted && <CheckIcon ... />}
  </div>
  <span className={`flex-1 text-sm font-medium truncate ...`}>
    {option.text}
  </span>
  <span className={`text-sm font-semibold tabular-nums ...`}>
    {pct}%
  </span>
</div>
```

**Step 2: Add the "You" pill between option text and percentage**

Replace the `<div className="flex items-center gap-3">` block with:

```tsx
<div className="flex items-center gap-3">
  <div
    className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isVoted ? 'bg-black dark:bg-white border-black dark:border-white' : 'border-gray-300 dark:border-gray-600'}`}
  >
    {isVoted && (
      <CheckIcon
        size={11}
        className="text-white dark:text-black"
        strokeWidth={3}
      />
    )}
  </div>
  <span
    className={`flex-1 text-sm font-medium truncate ${isVoted ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}
  >
    {option.text}
  </span>
  {isVoted && (
    <span className="flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-black dark:bg-white text-white dark:text-black leading-none">
      You
    </span>
  )}
  <span
    className={`text-sm font-semibold tabular-nums flex-shrink-0 ${isLeading && !isOpen ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}
  >
    {pct}%
  </span>
</div>
```

**Step 3: Run tests to green**

```bash
npm run test:frontend
```

Expected: 4 tests PASS.

**Step 4: Also run server tests to confirm nothing regressed**

```bash
npm test
```

Expected: all server tests PASS.

**Step 5: Commit**

```bash
git add src/components/PollCard.tsx src/components/__tests__/PollCard.test.tsx
git commit -m "feat: show 'You' pill badge on own voted option in PollCard"
```

---

### Task 4: Update docs

**Files:**
- Modify: `docs/polls.md`

**Step 1: Add to the UI Behavior section**

In `docs/polls.md`, under `### UI Behavior`, add:

```markdown
- **"You" pill** on PollCard — the option(s) the current user voted for show a small `You` badge inline next to the option text, between the label and the percentage.
```

**Step 2: Commit**

```bash
git add docs/polls.md
git commit -m "docs: document You pill badge in polls UI behavior"
```
