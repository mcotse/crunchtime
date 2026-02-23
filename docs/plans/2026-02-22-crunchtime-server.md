# Crunchtime Server Implementation Plan

> **For Claude:** REQUIRED: Use team-driven-development or executing-plans-with-teams to implement this plan.

**Goal:** Add a real Hono/SQLite/SSE backend to the Crunchtime React group-fund tracker so data persists, all members share live state, and the app is self-hosted behind Cloudflare Tunnel.

**Architecture:** Hono API server on Node.js serves both the static React build and all `/api/*` routes. SQLite (via `better-sqlite3`) persists members, transactions, and settings. Cloudflare Access handles auth by injecting a signed JWT header — the server verifies it and resolves the member on every request. Server-Sent Events push writes to all connected clients so no manual refresh is needed.

**Tech Stack:** React 18 + Vite, Hono + `@hono/node-server`, `better-sqlite3`, `jose` (JWT), `vitest` (tests), TypeScript throughout, `cloudflared` tunnel.

**Reference:** `docs/shaping.md` (full design) · `docs/slices.md` (slice breakdown + FE source snapshots)

---

## Task 0: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.server.json`
- Create: `vite.config.ts`

**Step 1: Write package.json**

```json
{
  "name": "crunchtime",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev:client": "vite",
    "dev:server": "node --experimental-strip-types --watch server/index.ts",
    "build": "tsc -p tsconfig.server.json && vite build",
    "seed": "node --experimental-strip-types server/seed.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@hono/node-server": "^1.13.7",
    "better-sqlite3": "^11.7.0",
    "hono": "^4.6.15",
    "jose": "^5.9.6",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "framer-motion": "^11.15.0",
    "lucide-react": "^0.477.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.12",
    "@types/node": "^22.13.4",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.2",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3",
    "vite": "^6.1.0",
    "vitest": "^3.0.6"
  }
}
```

**Step 2: Write tsconfig.json (client)**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src", "pages", "components", "data"]
}
```

**Step 3: Write tsconfig.server.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "noEmit": false,
    "outDir": "dist/server",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["server"]
}
```

**Step 4: Write vite.config.ts**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  build: {
    outDir: 'dist/client',
  },
})
```

**Step 5: Run install and verify**

```bash
npm install
```

Expected: `node_modules/` created, no errors.

**Step 6: Write tailwind.config.js + postcss.config.js**

`tailwind.config.js`:
```js
export default {
  content: ['./index.html', './pages/**/*.tsx', './components/**/*.tsx'],
  darkMode: 'class',
  theme: { extend: {} },
  plugins: [],
}
```

`postcss.config.js`:
```js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
```

**Step 7: Write index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Crunchtime</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 8: Write src/main.tsx + src/index.css**

`src/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BudgetApp } from '../pages/BudgetApp'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BudgetApp />
  </React.StrictMode>,
)
```

`src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 9: Commit**

```bash
git add -A
git commit -m "chore: project scaffold (Vite + Hono + TS)"
```

---

## Task 1: Mock Data + Type Definitions

**Files:**
- Create: `data/mockData.ts`

**Step 1: Write data/mockData.ts**

```ts
export interface Member {
  id: string
  name: string
  initials: string
  phone: string
  email: string
  color: string
  balance: number
}

export interface Transaction {
  id: string
  description: string
  amount: number
  memberId: string
  date: string
  category: string
  editHistory?: Array<{
    editedBy: string
    editedAt: string
    change: string
  }>
}

export const MEMBERS: Member[] = [
  { id: 'm1', name: 'Alice Osei', initials: 'AO', phone: '+1-555-0101', email: 'alice@example.com', color: '#6366f1', balance: 120 },
  { id: 'm2', name: 'Ben Kwame', initials: 'BK', phone: '+1-555-0102', email: 'ben@example.com', color: '#f59e0b', balance: -45 },
  { id: 'm3', name: 'Clara Mensah', initials: 'CM', phone: '+1-555-0103', email: 'clara@example.com', color: '#10b981', balance: 80 },
  { id: 'm4', name: 'David Asante', initials: 'DA', phone: '+1-555-0104', email: 'david@example.com', color: '#ef4444', balance: -30 },
]

export const TRANSACTIONS: Transaction[] = [
  { id: 't1', description: 'Groceries', amount: -60, memberId: 'm1', date: '2025-01-15T10:00:00Z', category: 'Food' },
  { id: 't2', description: 'Monthly contribution', amount: 200, memberId: 'm2', date: '2025-01-14T09:00:00Z', category: 'Income' },
  { id: 't3', description: 'Utilities', amount: -45, memberId: 'm3', date: '2025-01-13T14:00:00Z', category: 'Bills' },
  { id: 't4', description: 'Transport', amount: -30, memberId: 'm4', date: '2025-01-12T08:00:00Z', category: 'Transport' },
]
```

**Step 2: Commit**

```bash
git add data/mockData.ts
git commit -m "chore: add mock data + Member/Transaction types"
```

---

## Task 2: React UI Components (Stub Set)

**Files:**
- Create: `components/BalanceHeader.tsx`
- Create: `components/TabBar.tsx`
- Create: `components/HomeTab.tsx`
- Create: `components/FeedTab.tsx`
- Create: `components/MembersTab.tsx`
- Create: `components/AnalyticsTab.tsx`
- Create: `components/SettingsTab.tsx`
- Create: `components/AddTransactionSheet.tsx`
- Create: `components/ui/Button.tsx`
- Create: `components/ui/Input.tsx`
- Create: `pages/BudgetApp.tsx`

These are the pre-server-wiring versions from `docs/slices.md` "FE Source Reference".

**Step 1: Write components/ui/Button.tsx**

```tsx
import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost'
  size?: 'sm' | 'md'
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  const base = 'rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  const variants = {
    primary: 'bg-black text-white hover:bg-gray-800 focus:ring-black dark:bg-white dark:text-black',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-400',
  }
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-base' }
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />
}
```

**Step 2: Write components/ui/Input.tsx**

```tsx
import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
      <input
        ref={ref}
        className={`border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-700 dark:bg-gray-800 dark:text-white ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  ),
)
Input.displayName = 'Input'
```

**Step 3: Write components/BalanceHeader.tsx**

```tsx
import React from 'react'
import { PlusIcon } from 'lucide-react'

interface BalanceHeaderProps {
  balance: number
  onAddTransaction: () => void
}

export function BalanceHeader({ balance, onAddTransaction }: BalanceHeaderProps) {
  const fmt = (n: number) => `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  return (
    <header className="px-4 pt-4 pb-2 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Group Balance</p>
        <p className={`text-2xl font-bold ${balance >= 0 ? 'text-black dark:text-white' : 'text-red-500'}`}>
          {balance < 0 ? '-' : ''}{fmt(balance)}
        </p>
      </div>
      <button
        onClick={onAddTransaction}
        className="w-9 h-9 rounded-full bg-black dark:bg-white flex items-center justify-center"
        aria-label="Add transaction"
      >
        <PlusIcon size={18} className="text-white dark:text-black" />
      </button>
    </header>
  )
}
```

**Step 4: Write components/TabBar.tsx**

```tsx
import React from 'react'
import { HomeIcon, ActivityIcon, UsersIcon, BarChart2Icon, SettingsIcon } from 'lucide-react'

const TABS = [
  { id: 'home', icon: HomeIcon, label: 'Home' },
  { id: 'activity', icon: ActivityIcon, label: 'Activity' },
  { id: 'members', icon: UsersIcon, label: 'Members' },
  { id: 'analytics', icon: BarChart2Icon, label: 'Analytics' },
  { id: 'settings', icon: SettingsIcon, label: 'Settings' },
]

export function TabBar({ activeTab, onTabChange }: { activeTab: string; onTabChange: (id: string) => void }) {
  return (
    <nav className="border-t border-gray-100 dark:border-gray-800 flex">
      {TABS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
            activeTab === id ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-600'
          }`}
        >
          <Icon size={20} />
          {label}
        </button>
      ))}
    </nav>
  )
}
```

**Step 5: Write components/HomeTab.tsx**

```tsx
import React from 'react'
import { PlusIcon } from 'lucide-react'
import { Member, Transaction } from '../data/mockData'

interface HomeTabProps {
  members: Member[]
  transactions: Transaction[]
  balance: number
  onAddTransaction: () => void
  groupName: string
}

export function HomeTab({ members, transactions, balance, onAddTransaction, groupName }: HomeTabProps) {
  const fmt = (n: number) => `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  const recent = transactions.slice(0, 5)
  return (
    <div className="flex-1 flex flex-col">
      <div className="px-4 pt-6 pb-4 flex flex-col gap-1">
        <p className="text-sm text-gray-500 dark:text-gray-400">{groupName}</p>
        <p className={`text-4xl font-bold tracking-tight ${balance >= 0 ? '' : 'text-red-500'}`}>
          {balance < 0 ? '-' : ''}{fmt(balance)}
        </p>
        <p className="text-xs text-gray-400">{members.length} members</p>
      </div>
      <button
        onClick={onAddTransaction}
        className="mx-4 mb-4 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold flex items-center justify-center gap-2"
      >
        <PlusIcon size={18} /> Add Transaction
      </button>
      <div className="px-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Recent</p>
        {recent.map((tx) => {
          const m = members.find((m) => m.id === tx.memberId)
          return (
            <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-900">
              <div>
                <p className="text-sm font-medium">{tx.description}</p>
                <p className="text-xs text-gray-400">{m?.name}</p>
              </div>
              <p className={`text-sm font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {tx.amount >= 0 ? '+' : '-'}{fmt(tx.amount)}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

**Step 6: Write components/FeedTab.tsx**

```tsx
import React from 'react'
import { Member, Transaction } from '../data/mockData'

export function FeedTab({ transactions, members }: { transactions: Transaction[]; members: Member[] }) {
  const fmt = (n: number) => `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  return (
    <div className="flex-1 px-4 pt-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">All Transactions</p>
      {transactions.map((tx) => {
        const m = members.find((m) => m.id === tx.memberId)
        return (
          <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-900">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: m?.color }}>
                {m?.initials}
              </div>
              <div>
                <p className="text-sm font-medium">{tx.description}</p>
                <p className="text-xs text-gray-400">{m?.name} · {new Date(tx.date).toLocaleDateString()}</p>
              </div>
            </div>
            <p className={`text-sm font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {tx.amount >= 0 ? '+' : '-'}{fmt(tx.amount)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
```

**Step 7: Write components/MembersTab.tsx**

```tsx
import React from 'react'
import { Member } from '../data/mockData'

export function MembersTab({ members }: { members: Member[] }) {
  const fmt = (n: number) => `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  return (
    <div className="flex-1 px-4 pt-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Members</p>
      {members.map((m) => (
        <div key={m.id} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: m.color }}>
              {m.initials}
            </div>
            <div>
              <p className="text-sm font-medium">{m.name}</p>
              <p className="text-xs text-gray-400">{m.phone}</p>
            </div>
          </div>
          <p className={`text-sm font-semibold ${m.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {m.balance >= 0 ? '+' : '-'}{fmt(m.balance)}
          </p>
        </div>
      ))}
    </div>
  )
}
```

**Step 8: Write components/AnalyticsTab.tsx**

```tsx
import React from 'react'
import { Member, Transaction } from '../data/mockData'

export function AnalyticsTab({ members, transactions }: { members: Member[]; transactions: Transaction[] }) {
  const fmt = (n: number) => `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  const byCategory = transactions.reduce<Record<string, number>>((acc, tx) => {
    acc[tx.category] = (acc[tx.category] ?? 0) + tx.amount
    return acc
  }, {})
  return (
    <div className="flex-1 px-4 pt-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Spending by Category</p>
      {Object.entries(byCategory).map(([cat, total]) => (
        <div key={cat} className="flex justify-between py-2 border-b border-gray-50 dark:border-gray-900">
          <p className="text-sm font-medium">{cat}</p>
          <p className={`text-sm font-semibold ${total >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {total >= 0 ? '+' : '-'}{fmt(total)}
          </p>
        </div>
      ))}
    </div>
  )
}
```

**Step 9: Write components/SettingsTab.tsx (pre-server version)**

From `docs/slices.md` — V3 will add the PATCH fetch here.

```tsx
import React, { useState } from 'react'
import { PencilIcon, CheckIcon, MoonIcon, SunIcon } from 'lucide-react'
import { Member } from '../data/mockData'

interface SettingsTabProps {
  members: Member[]
  groupName: string
  onGroupNameChange: (name: string) => void
  isDark: boolean
  onToggleDark: () => void
}

export function SettingsTab({ members, groupName, onGroupNameChange, isDark, onToggleDark }: SettingsTabProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(groupName)

  const handleSaveName = () => {
    const trimmed = nameInput.trim()
    if (trimmed) onGroupNameChange(trimmed)
    setIsEditingName(false)
  }

  return (
    <div className="flex-1 px-4 pt-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Settings</p>

      <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-900">
        <p className="text-sm font-medium">Group Name</p>
        {isEditingName ? (
          <div className="flex items-center gap-2">
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="border border-gray-200 rounded px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
              autoFocus
            />
            <button onClick={handleSaveName} aria-label="Save">
              <CheckIcon size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-500">{groupName}</p>
            <button onClick={() => setIsEditingName(true)} aria-label="Edit">
              <PencilIcon size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-900">
        <p className="text-sm font-medium">Dark Mode</p>
        <button onClick={onToggleDark} aria-label="Toggle dark mode">
          {isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
        </button>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Members</p>
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 py-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: m.color }}>
              {m.initials}
            </div>
            <p className="text-sm">{m.name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 10: Write components/AddTransactionSheet.tsx (pre-server version)**

```tsx
import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XIcon } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Member } from '../data/mockData'

interface AddTransactionSheetProps {
  isOpen: boolean
  onClose: () => void
  members: Member[]
  onAdd: (transaction: any) => void
}

export function AddTransactionSheet({ isOpen, onClose, members, onAdd }: AddTransactionSheetProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [selectedMember, setSelectedMember] = useState(members[0]?.id ?? '')
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [showErrors, setShowErrors] = useState(false)
  const amountRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLInputElement>(null)

  const isValid = amount !== '' && parseFloat(amount) > 0 && description.trim() !== ''

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    onAdd({
      amount: type === 'expense' ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount)),
      description,
      memberId: selectedMember,
      date: new Date().toISOString(),
      category: 'General',
      id: Math.random().toString(36).substr(2, 9),
    })
    setAmount('')
    setDescription('')
    setShowErrors(false)
    onClose()
  }

  const handleCTAClick = () => {
    if (!isValid) {
      setShowErrors(true)
      if (!amount || parseFloat(amount) <= 0) amountRef.current?.focus()
      else if (!description.trim()) descriptionRef.current?.focus()
      return
    }
    const form = document.getElementById('transaction-form') as HTMLFormElement
    form?.requestSubmit()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-2xl p-6 max-w-md mx-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Transaction</h2>
              <button onClick={onClose}><XIcon size={20} /></button>
            </div>

            <form id="transaction-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex gap-2">
                {(['expense', 'income'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      type === t ? 'bg-black text-white dark:bg-white dark:text-black border-transparent' : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              <Input
                ref={amountRef}
                label="Amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                error={showErrors && (!amount || parseFloat(amount) <= 0) ? 'Enter a valid amount' : undefined}
              />

              <Input
                ref={descriptionRef}
                label="Description"
                placeholder="What was this for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                error={showErrors && !description.trim() ? 'Description required' : undefined}
              />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Member</label>
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </form>

            <Button className="w-full mt-4" onClick={handleCTAClick}>
              Add Transaction
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

**Step 11: Write pages/BudgetApp.tsx (pre-server version)**

```tsx
import React, { useState } from 'react'
import { MEMBERS, TRANSACTIONS, Transaction } from '../data/mockData'
import { BalanceHeader } from '../components/BalanceHeader'
import { TabBar } from '../components/TabBar'
import { HomeTab } from '../components/HomeTab'
import { FeedTab } from '../components/FeedTab'
import { MembersTab } from '../components/MembersTab'
import { AnalyticsTab } from '../components/AnalyticsTab'
import { SettingsTab } from '../components/SettingsTab'
import { AddTransactionSheet } from '../components/AddTransactionSheet'

export function BudgetApp() {
  const [activeTab, setActiveTab] = useState('home')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>(TRANSACTIONS)
  const [members, setMembers] = useState(MEMBERS)
  const [groupName, setGroupName] = useState('Crunch Fund')
  const [isDark, setIsDark] = useState(false)

  const totalBalance = members.reduce((sum, m) => sum + m.balance, 0)

  const handleAddTransaction = (newTransaction: Transaction) => {
    setTransactions([newTransaction, ...transactions])
    setMembers(
      members.map((m) =>
        m.id === newTransaction.memberId ? { ...m, balance: m.balance + newTransaction.amount } : m,
      ),
    )
  }

  return (
    <div className={`min-h-screen font-sans selection:bg-gray-200 ${isDark ? 'dark bg-gray-950 text-white' : 'bg-white text-black'}`}>
      <div className="max-w-md mx-auto min-h-screen relative flex flex-col">
        {activeTab !== 'home' && (
          <BalanceHeader balance={totalBalance} onAddTransaction={() => setIsSheetOpen(true)} />
        )}
        <main className="flex-1 flex flex-col">
          {activeTab === 'home' && (
            <HomeTab members={members} transactions={transactions} balance={totalBalance} onAddTransaction={() => setIsSheetOpen(true)} groupName={groupName} />
          )}
          {activeTab === 'activity' && <FeedTab transactions={transactions} members={members} />}
          {activeTab === 'members' && <MembersTab members={members} />}
          {activeTab === 'analytics' && <AnalyticsTab members={members} transactions={transactions} />}
          {activeTab === 'settings' && (
            <SettingsTab members={members} groupName={groupName} onGroupNameChange={setGroupName} isDark={isDark} onToggleDark={() => setIsDark((d) => !d)} />
          )}
        </main>
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        <AddTransactionSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} members={members} onAdd={handleAddTransaction} />
      </div>
    </div>
  )
}
```

**Step 12: Verify app compiles**

```bash
npm run dev:client
```

Expected: Vite dev server starts, app renders at `http://localhost:5173` with mock data.

**Step 13: Commit**

```bash
git add -A
git commit -m "feat: scaffold React UI with mock data"
```

---

## Task 3 (V1): SQLite DB + Schema + Seed

**Files:**
- Create: `server/db.ts`
- Create: `server/seed.ts`
- Create: `server/test/db.test.ts`

**Step 1: Write server/db.ts**

```ts
import Database from 'better-sqlite3'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.DB_PATH ?? path.join(__dirname, '..', 'crunchtime.db')

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id        TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    initials  TEXT NOT NULL,
    phone     TEXT NOT NULL,
    email     TEXT NOT NULL UNIQUE,
    color     TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id           TEXT PRIMARY KEY,
    description  TEXT NOT NULL,
    amount       REAL NOT NULL,
    member_id    TEXT NOT NULL REFERENCES members(id),
    date         TEXT NOT NULL,
    category     TEXT NOT NULL DEFAULT 'General',
    edit_history TEXT NOT NULL DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  INSERT OR IGNORE INTO settings (key, value) VALUES ('group_name', 'Crunch Fund');
`)

export default db
```

**Step 2: Write server/test/db.test.ts**

```ts
import { describe, it, expect, beforeAll } from 'vitest'
import { existsSync } from 'node:fs'

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
```

**Step 3: Run tests to verify they fail first, then pass**

```bash
npx vitest run server/test/db.test.ts
```

Expected: PASS (schema is created on import)

**Step 4: Write server/seed.ts**

```ts
import db from './db.js'
import { MEMBERS, TRANSACTIONS } from '../data/mockData.js'

// Clear existing data
db.exec('DELETE FROM transactions; DELETE FROM members;')

// Seed members (without balance — computed from transactions)
const insertMember = db.prepare(`
  INSERT OR REPLACE INTO members (id, name, initials, phone, email, color)
  VALUES (@id, @name, @initials, @phone, @email, @color)
`)
for (const m of MEMBERS) {
  insertMember.run(m)
}

// Seed transactions
const insertTx = db.prepare(`
  INSERT OR REPLACE INTO transactions (id, description, amount, member_id, date, category)
  VALUES (@id, @description, @amount, @memberId, @date, @category)
`)
for (const tx of TRANSACTIONS) {
  insertTx.run(tx)
}

console.log(`Seeded ${MEMBERS.length} members, ${TRANSACTIONS.length} transactions.`)
```

**Step 5: Run seed**

```bash
npm run seed
```

Expected: `Seeded 4 members, 4 transactions.`

**Step 6: Commit**

```bash
git add server/db.ts server/seed.ts server/test/db.test.ts
git commit -m "feat(v1): SQLite schema + seed script"
```

---

## Task 4 (V1): Read API Endpoints

**Files:**
- Create: `server/routes/members.ts`
- Create: `server/routes/transactions.ts`
- Create: `server/routes/me.ts`
- Create: `server/index.ts`
- Create: `server/test/api.test.ts`

**Step 1: Write server/routes/members.ts**

```ts
import { Hono } from 'hono'
import db from '../db.js'

export const membersRouter = new Hono()

membersRouter.get('/', (c) => {
  const rows = db.prepare(`
    SELECT
      m.id, m.name, m.initials, m.phone, m.email, m.color,
      COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.member_id = m.id), 0) AS balance
    FROM members m
  `).all()
  return c.json(rows)
})
```

**Step 2: Write server/routes/transactions.ts**

```ts
import { Hono } from 'hono'
import db from '../db.js'

export const transactionsRouter = new Hono()

transactionsRouter.get('/', (c) => {
  const rows = db.prepare(`
    SELECT id, description, amount, member_id as memberId, date, category, edit_history as editHistory
    FROM transactions
    ORDER BY date DESC
  `).all()
  return c.json(rows)
})
```

**Step 3: Write server/routes/me.ts (V1 stub)**

```ts
import { Hono } from 'hono'
import db from '../db.js'

export const meRouter = new Hono()

// V1 stub: returns first member. Replaced by real JWT lookup in V2.
meRouter.get('/', (c) => {
  const member = db.prepare(`
    SELECT
      m.id, m.name, m.initials, m.phone, m.email, m.color,
      COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.member_id = m.id), 0) AS balance
    FROM members m LIMIT 1
  `).get()
  if (!member) return c.json({ error: 'No members found' }, 404)
  return c.json(member)
})
```

**Step 4: Write server/index.ts**

```ts
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { membersRouter } from './routes/members.js'
import { transactionsRouter } from './routes/transactions.js'
import { meRouter } from './routes/me.js'

const app = new Hono()

app.route('/api/members', membersRouter)
app.route('/api/transactions', transactionsRouter)
app.route('/api/me', meRouter)

// Serve React build in production
app.use('/*', serveStatic({ root: './dist/client' }))

const PORT = Number(process.env.PORT ?? 3000)
serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Crunchtime server running on http://localhost:${PORT}`)
})

export { app }
```

**Step 5: Write server/test/api.test.ts**

```ts
import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.DB_PATH = ':memory:'
})

// Dynamically import after setting DB_PATH
async function getApp() {
  const { app } = await import('../index.js')
  return app
}

describe('GET /api/members', () => {
  it('returns array of members with balance', async () => {
    const app = await getApp()
    const res = await app.request('/api/members')
    expect(res.status).toBe(200)
    const body = await res.json() as any[]
    expect(Array.isArray(body)).toBe(true)
    // In-memory DB has no seeded data — array may be empty, but shape is correct
    if (body.length > 0) {
      expect(body[0]).toHaveProperty('id')
      expect(body[0]).toHaveProperty('balance')
    }
  })
})

describe('GET /api/transactions', () => {
  it('returns array sorted by date desc', async () => {
    const app = await getApp()
    const res = await app.request('/api/transactions')
    expect(res.status).toBe(200)
    const body = await res.json() as any[]
    expect(Array.isArray(body)).toBe(true)
  })
})

describe('GET /api/me', () => {
  it('returns 404 when no members exist', async () => {
    const app = await getApp()
    const res = await app.request('/api/me')
    expect(res.status).toBe(404)
  })
})
```

**Step 6: Run tests**

```bash
npx vitest run server/test/api.test.ts
```

Expected: All PASS.

**Step 7: Start server manually and verify endpoints**

```bash
npm run seed && node --experimental-strip-types server/index.ts
```

In another terminal:
```bash
curl http://localhost:3000/api/members | head -c 200
curl http://localhost:3000/api/transactions | head -c 200
curl http://localhost:3000/api/me | head -c 200
```

Expected: JSON arrays/objects returned.

**Step 8: Commit**

```bash
git add server/routes/ server/index.ts server/test/api.test.ts
git commit -m "feat(v1): GET /api/members, /api/transactions, /api/me"
```

---

## Task 5 (V1): Wire React App to API

**Files:**
- Modify: `pages/BudgetApp.tsx`

Replace mock data imports and `useState` initialization with API fetches on mount.

**Step 1: Modify pages/BudgetApp.tsx**

Replace the top of the file:
```tsx
// BEFORE
import { MEMBERS, TRANSACTIONS, Transaction } from '../data/mockData'
// ...
const [transactions, setTransactions] = useState<Transaction[]>(TRANSACTIONS)
const [members, setMembers] = useState(MEMBERS)
const [groupName, setGroupName] = useState('Crunch Fund')
```

With:
```tsx
import React, { useState, useEffect } from 'react'
import { Member, Transaction } from '../data/mockData'
import { BalanceHeader } from '../components/BalanceHeader'
import { TabBar } from '../components/TabBar'
import { HomeTab } from '../components/HomeTab'
import { FeedTab } from '../components/FeedTab'
import { MembersTab } from '../components/MembersTab'
import { AnalyticsTab } from '../components/AnalyticsTab'
import { SettingsTab } from '../components/SettingsTab'
import { AddTransactionSheet } from '../components/AddTransactionSheet'

export function BudgetApp() {
  const [activeTab, setActiveTab] = useState('home')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [groupName, setGroupName] = useState('Crunch Fund')
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/members').then((r) => r.json()),
      fetch('/api/transactions').then((r) => r.json()),
      fetch('/api/me').then((r) => r.json()),
    ]).then(([membersData, txData]) => {
      setMembers(membersData)
      setTransactions(txData)
    })
  }, [])

  // rest of component unchanged
```

**Step 2: Verify in browser**

With server running (`npm run seed && node --experimental-strip-types server/index.ts`) and Vite dev server running (`npm run dev:client`), open `http://localhost:5173`. The app should load data from the API, and data should survive page reload.

**Step 3: Commit**

```bash
git add pages/BudgetApp.tsx
git commit -m "feat(v1): wire React app to fetch from API on mount"
```

---

## Task 6 (V2): JWT Auth Middleware

**Files:**
- Create: `server/middleware/auth.ts`
- Create: `server/test/auth.test.ts`
- Modify: `server/routes/me.ts`
- Modify: `server/index.ts`

**Step 1: Write server/middleware/auth.ts**

```ts
import { createMiddleware } from 'hono/factory'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { Member } from '../../data/mockData.js'
import db from '../db.js'

const TEAM_DOMAIN = process.env.CF_TEAM_DOMAIN ?? ''

// Lazily instantiate the JWKS fetcher
let getJWKS: ReturnType<typeof createRemoteJWKSet> | null = null
function jwks() {
  if (!getJWKS) {
    getJWKS = createRemoteJWKSet(
      new URL(`https://${TEAM_DOMAIN}.cloudflareaccess.com/cdn-cgi/access/certs`),
    )
  }
  return getJWKS
}

export type Variables = { member: Member & { balance: number } }

export const authMiddleware = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const token = c.req.header('CF-Access-Jwt-Assertion')

  // In development (no CF_TEAM_DOMAIN set), skip auth and use first member
  if (!TEAM_DOMAIN) {
    const member = db.prepare(`
      SELECT m.id, m.name, m.initials, m.phone, m.email, m.color,
             COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.member_id = m.id), 0) AS balance
      FROM members m LIMIT 1
    `).get() as (Member & { balance: number }) | undefined
    if (member) c.set('member', member)
    return next()
  }

  if (!token) return c.json({ error: 'Unauthorized' }, 401)

  let email: string
  try {
    const { payload } = await jwtVerify(token, jwks())
    email = payload.email as string
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }

  const member = db.prepare(`
    SELECT m.id, m.name, m.initials, m.phone, m.email, m.color,
           COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.member_id = m.id), 0) AS balance
    FROM members m WHERE m.email = ?
  `).get(email) as (Member & { balance: number }) | undefined

  if (!member) return c.json({ error: 'Forbidden' }, 403)

  c.set('member', member)
  return next()
})
```

**Step 2: Write server/test/auth.test.ts**

```ts
import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.DB_PATH = ':memory:'
  // No CF_TEAM_DOMAIN set → dev mode (no auth)
  delete process.env.CF_TEAM_DOMAIN
})

describe('authMiddleware (dev mode)', () => {
  it('passes through when CF_TEAM_DOMAIN is not set', async () => {
    const { app } = await import('../index.js')
    const res = await app.request('/api/me')
    // In-memory DB has no members → 404
    expect(res.status).toBe(404)
  })
})
```

**Step 3: Run auth tests**

```bash
npx vitest run server/test/auth.test.ts
```

Expected: PASS.

**Step 4: Update server/routes/me.ts to use middleware member**

```ts
import { Hono } from 'hono'
import type { Variables } from '../middleware/auth.js'

export const meRouter = new Hono<{ Variables: Variables }>()

meRouter.get('/', (c) => {
  const member = c.get('member')
  if (!member) return c.json({ error: 'Not authenticated' }, 404)
  return c.json(member)
})
```

**Step 5: Register auth middleware globally in server/index.ts**

Add after imports:
```ts
import { authMiddleware } from './middleware/auth.js'
// ...
app.use('/api/*', authMiddleware)
```

**Step 6: Write cloudflared/config.yml (checked in, no secrets)**

```yaml
# Cloudflare Tunnel configuration
# Set CF_TEAM_DOMAIN env var to your team name (e.g. "myteam" for myteam.cloudflareaccess.com)
# Run: cloudflared tunnel --config cloudflared/config.yml run
tunnel: <TUNNEL_ID>
credentials-file: ~/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: <YOUR_HOSTNAME>
    service: http://localhost:3000
  - service: http_status:404
```

**Step 7: Commit**

```bash
git add server/middleware/ server/test/auth.test.ts server/routes/me.ts server/index.ts cloudflared/
git commit -m "feat(v2): JWT middleware (CF Access) + dev-mode bypass"
```

---

## Task 7 (V3): Write API Endpoints

**Files:**
- Modify: `server/routes/transactions.ts` (add POST)
- Create: `server/routes/settings.ts` (GET + PATCH)
- Modify: `server/index.ts` (register settings route)
- Create: `server/test/write.test.ts`

**Step 1: Add POST handler to server/routes/transactions.ts**

```ts
import { Hono } from 'hono'
import { randomUUID } from 'node:crypto'
import db from '../db.js'
import type { Variables } from '../middleware/auth.js'

export const transactionsRouter = new Hono<{ Variables: Variables }>()

transactionsRouter.get('/', (c) => {
  const rows = db.prepare(`
    SELECT id, description, amount, member_id as memberId, date, category, edit_history as editHistory
    FROM transactions ORDER BY date DESC
  `).all()
  return c.json(rows)
})

transactionsRouter.post('/', async (c) => {
  const body = await c.req.json<{ amount: unknown; description: unknown; memberId: unknown; date: unknown; category: unknown }>()

  if (typeof body.amount !== 'number' || isNaN(body.amount)) {
    return c.json({ error: 'amount must be a number' }, 400)
  }
  if (typeof body.description !== 'string' || !body.description.trim()) {
    return c.json({ error: 'description must be a non-empty string' }, 400)
  }
  if (typeof body.memberId !== 'string' || !body.memberId) {
    return c.json({ error: 'memberId required' }, 400)
  }

  const member = db.prepare('SELECT id FROM members WHERE id = ?').get(body.memberId)
  if (!member) return c.json({ error: 'memberId not found' }, 400)

  const id = randomUUID()
  const date = typeof body.date === 'string' ? body.date : new Date().toISOString()
  const category = typeof body.category === 'string' ? body.category : 'General'

  db.prepare(`
    INSERT INTO transactions (id, description, amount, member_id, date, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, body.description.trim(), body.amount, body.memberId, date, category)

  const tx = { id, description: body.description.trim(), amount: body.amount, memberId: body.memberId, date, category }
  return c.json(tx, 201)
})
```

**Step 2: Write server/routes/settings.ts**

```ts
import { Hono } from 'hono'
import db from '../db.js'

export const settingsRouter = new Hono()

settingsRouter.get('/', (c) => {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'group_name'").get() as { value: string } | undefined
  return c.json({ groupName: row?.value ?? 'Crunch Fund' })
})

settingsRouter.patch('/', async (c) => {
  const body = await c.req.json<{ groupName: unknown }>()
  if (typeof body.groupName !== 'string' || !body.groupName.trim()) {
    return c.json({ error: 'groupName must be a non-empty string' }, 400)
  }
  const name = body.groupName.trim()
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('group_name', ?)").run(name)
  return c.json({ groupName: name })
})
```

**Step 3: Register settings route in server/index.ts**

```ts
import { settingsRouter } from './routes/settings.js'
// ...
app.route('/api/settings', settingsRouter)
```

**Step 4: Write server/test/write.test.ts**

```ts
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'

beforeAll(() => {
  process.env.DB_PATH = ':memory:'
})

async function getApp() {
  const { app } = await import('../index.js')
  return app
}

async function seedMember() {
  const { default: db } = await import('../db.js')
  db.prepare(`
    INSERT OR IGNORE INTO members (id, name, initials, phone, email, color)
    VALUES ('m1', 'Alice', 'AO', '+1-555-0101', 'alice@example.com', '#6366f1')
  `).run()
}

describe('POST /api/transactions', () => {
  beforeEach(() => seedMember())

  it('creates a transaction and returns 201', async () => {
    const app = await getApp()
    const res = await app.request('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: -50, description: 'Groceries', memberId: 'm1', category: 'Food', date: '2025-01-15T10:00:00Z' }),
    })
    expect(res.status).toBe(201)
    const body = await res.json() as any
    expect(body.id).toBeTruthy()
    expect(body.amount).toBe(-50)
    expect(body.description).toBe('Groceries')
  })

  it('rejects missing description with 400', async () => {
    const app = await getApp()
    const res = await app.request('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: -50, description: '', memberId: 'm1' }),
    })
    expect(res.status).toBe(400)
  })

  it('rejects non-number amount with 400', async () => {
    const app = await getApp()
    const res = await app.request('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 'fifty', description: 'Test', memberId: 'm1' }),
    })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/settings', () => {
  it('returns default group name', async () => {
    const app = await getApp()
    const res = await app.request('/api/settings')
    expect(res.status).toBe(200)
    const body = await res.json() as { groupName: string }
    expect(body.groupName).toBe('Crunch Fund')
  })
})

describe('PATCH /api/settings', () => {
  it('updates group name', async () => {
    const app = await getApp()
    const res = await app.request('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupName: 'Weekend Fund' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { groupName: string }
    expect(body.groupName).toBe('Weekend Fund')
  })

  it('rejects empty group name with 400', async () => {
    const app = await getApp()
    const res = await app.request('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupName: '   ' }),
    })
    expect(res.status).toBe(400)
  })
})
```

**Step 5: Run tests**

```bash
npx vitest run server/test/write.test.ts
```

Expected: All PASS.

**Step 6: Commit**

```bash
git add server/routes/transactions.ts server/routes/settings.ts server/index.ts server/test/write.test.ts
git commit -m "feat(v3): POST /api/transactions, GET+PATCH /api/settings"
```

---

## Task 8 (V3): Wire FE Forms to API

**Files:**
- Modify: `components/AddTransactionSheet.tsx`
- Modify: `components/SettingsTab.tsx`
- Modify: `pages/BudgetApp.tsx`

**Step 1: Wire AddTransactionSheet.tsx — replace onAdd with POST fetch**

Replace `handleSubmit` in `components/AddTransactionSheet.tsx`:

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!isValid) return

  await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: type === 'expense' ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount)),
      description,
      memberId: selectedMember,
      date: new Date().toISOString(),
      category: 'General',
    }),
  })

  setAmount('')
  setDescription('')
  setShowErrors(false)
  onClose()
}
```

Also remove the `onAdd` call — the prop stays in the interface but the handler no longer uses it (SSE will deliver the new transaction in V4; for now BudgetApp refetches).

**Step 2: Wire SettingsTab.tsx — add PATCH fetch in handleSaveName**

Replace `handleSaveName` in `components/SettingsTab.tsx`:

```tsx
const handleSaveName = async () => {
  const trimmed = nameInput.trim()
  if (!trimmed) return
  await fetch('/api/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groupName: trimmed }),
  })
  onGroupNameChange(trimmed)
  setIsEditingName(false)
}
```

**Step 3: Wire BudgetApp.tsx — add GET /api/settings on mount + refetch after write**

In the `useEffect` in `BudgetApp.tsx`, add settings fetch:

```tsx
useEffect(() => {
  Promise.all([
    fetch('/api/members').then((r) => r.json()),
    fetch('/api/transactions').then((r) => r.json()),
    fetch('/api/settings').then((r) => r.json()),
  ]).then(([membersData, txData, settingsData]) => {
    setMembers(membersData)
    setTransactions(txData)
    setGroupName(settingsData.groupName)
  })
}, [])
```

Replace `handleAddTransaction` to refetch after write (will be replaced by SSE in V4):

```tsx
const handleAddTransaction = async () => {
  const [membersData, txData] = await Promise.all([
    fetch('/api/members').then((r) => r.json()),
    fetch('/api/transactions').then((r) => r.json()),
  ])
  setMembers(membersData)
  setTransactions(txData)
}
```

Update `AddTransactionSheet` usage: `onAdd={handleAddTransaction}` (now async, no argument needed).

**Step 4: Verify manually**

With server running, add a transaction via the UI, reload — it persists. Change group name, reload — it persists.

**Step 5: Commit**

```bash
git add components/AddTransactionSheet.tsx components/SettingsTab.tsx pages/BudgetApp.tsx
git commit -m "feat(v3): wire Add Transaction form + group name editor to API"
```

---

## Task 9 (V4): SSE Infrastructure

**Files:**
- Create: `server/sse.ts`
- Create: `server/routes/events.ts`
- Modify: `server/routes/transactions.ts` (broadcast after write)
- Modify: `server/routes/settings.ts` (broadcast after write)
- Modify: `server/index.ts` (register events route)
- Create: `server/test/sse.test.ts`

**Step 1: Write server/sse.ts**

```ts
import type { ServerResponse } from 'node:http'

const clients = new Set<ServerResponse>()

export function addClient(res: ServerResponse): void {
  clients.add(res)
  res.on('close', () => clients.delete(res))
}

export function broadcast(event: string, data: unknown): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const res of clients) {
    res.write(payload)
  }
}

export { clients }
```

**Step 2: Write server/routes/events.ts**

```ts
import { Hono } from 'hono'
import { addClient } from '../sse.js'

export const eventsRouter = new Hono()

eventsRouter.get('/', (c) => {
  const { req, res } = c.env as { req: Request; res: any }

  // Access the underlying Node.js ServerResponse
  const nodeRes = (c as any).env?.incoming?.res ?? (c as any).res

  c.header('Content-Type', 'text/event-stream')
  c.header('Cache-Control', 'no-cache')
  c.header('Connection', 'keep-alive')

  return new Response(
    new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()
        controller.enqueue(encoder.encode(': connected\n\n'))

        const handler = (chunk: string) => controller.enqueue(encoder.encode(chunk))

        // Register via a lightweight wrapper
        const fakeRes = {
          write: handler,
          on: (event: string, cb: () => void) => {
            if (event === 'close') {
              // Will be called when the stream is cancelled
            }
          },
        } as any

        addClient(fakeRes)
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    },
  )
})
```

> **Note:** Hono's `serve-static` and SSE work better with a low-level Node.js approach. Rewrite events endpoint using `@hono/node-server`'s stream helper:

```ts
import { Hono } from 'hono'
import { stream } from 'hono/streaming'

export const eventsRouter = new Hono()

// Store active streams
const activeStreams = new Set<{ write: (s: string) => Promise<void>; close: () => void }>()

export function broadcastSSE(event: string, data: unknown): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const s of activeStreams) {
    s.write(payload).catch(() => {
      activeStreams.delete(s)
    })
  }
}

eventsRouter.get('/', (c) => {
  return stream(c, async (s) => {
    const client = {
      write: (payload: string) => s.write(payload),
      close: () => s.close(),
    }
    activeStreams.add(client)
    s.onAbort(() => activeStreams.delete(client))

    // Keep alive
    await s.write(': connected\n\n')
    // Hold the stream open indefinitely
    await new Promise<void>((resolve) => {
      s.onAbort(resolve)
    })
  })
})
```

**Step 3: Update server/sse.ts to use the stream-based broadcaster**

Replace `server/sse.ts` with a simple re-export:

```ts
export { broadcastSSE } from './routes/events.js'
```

**Step 4: Update server/routes/transactions.ts — broadcast after write**

Add to the POST handler, after `db.prepare(...).run(...)`:

```ts
import { broadcastSSE } from '../routes/events.js'
// ...
broadcastSSE('transaction_added', tx)
```

**Step 5: Update server/routes/settings.ts — broadcast after write**

Add to PATCH handler, after the DB write:

```ts
import { broadcastSSE } from './events.js'
// ...
broadcastSSE('settings_updated', { groupName: name })
```

**Step 6: Register events route in server/index.ts**

```ts
import { eventsRouter } from './routes/events.js'
// ...
app.route('/api/events', eventsRouter)
```

**Step 7: Write server/test/sse.test.ts**

```ts
import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.DB_PATH = ':memory:'
})

describe('GET /api/events', () => {
  it('responds with SSE headers', async () => {
    const { app } = await import('../index.js')
    // Fire-and-forget: just check the response starts
    const controller = new AbortController()
    const res = await app.request('/api/events', { signal: controller.signal })
    expect(res.headers.get('content-type')).toContain('text/event-stream')
    controller.abort()
  })
})
```

**Step 8: Run all tests**

```bash
npx vitest run
```

Expected: All PASS.

**Step 9: Commit**

```bash
git add server/sse.ts server/routes/events.ts server/routes/transactions.ts server/routes/settings.ts server/index.ts server/test/sse.test.ts
git commit -m "feat(v4): SSE broadcaster + /api/events endpoint"
```

---

## Task 10 (V4): React SSE Listener

**Files:**
- Modify: `pages/BudgetApp.tsx`

**Step 1: Add SSE listener useEffect to BudgetApp.tsx**

Add after the existing `useEffect` fetch:

```tsx
useEffect(() => {
  const es = new EventSource('/api/events')

  es.addEventListener('transaction_added', (e) => {
    const tx = JSON.parse(e.data) as Transaction
    setTransactions((prev) => [tx, ...prev])
    setMembers((prev) =>
      prev.map((m) =>
        m.id === tx.memberId ? { ...m, balance: m.balance + tx.amount } : m,
      ),
    )
  })

  es.addEventListener('settings_updated', (e) => {
    const { groupName } = JSON.parse(e.data) as { groupName: string }
    setGroupName(groupName)
  })

  return () => es.close()
}, [])
```

**Step 2: Remove post-write refetch from handleAddTransaction**

Since SSE now delivers new transactions, `handleAddTransaction` doesn't need to refetch.

Replace:
```tsx
const handleAddTransaction = async () => {
  const [membersData, txData] = await Promise.all([...])
  setMembers(membersData)
  setTransactions(txData)
}
```

With a no-op (the sheet's onAdd callback is still needed by the prop interface):
```tsx
const handleAddTransaction = () => {
  // SSE delivers the new transaction via EventSource listener
}
```

**Step 3: Remove onGroupNameChange call from SettingsTab success path**

In `components/SettingsTab.tsx`, the `onGroupNameChange` call in `handleSaveName` can stay for immediate UI feedback (pre-SSE optimistic update is fine to keep).

**Step 4: End-to-end SSE test**

Open two browser tabs at `http://localhost:5173`. Add a transaction in Tab 1. Verify it appears in Tab 2 without refresh.

**Step 5: Run all tests**

```bash
npx vitest run
```

Expected: All PASS.

**Step 6: Final commit**

```bash
git add pages/BudgetApp.tsx
git commit -m "feat(v4): React SSE listener — real-time sync across tabs"
```

---

## Completion Checklist

- [ ] V1 Demo: App loads live data from server; reload and data persists
- [ ] V2 Demo: `CF_TEAM_DOMAIN` set and JWT header verified; non-whitelisted email blocked
- [ ] V3 Demo: Add transaction → reload → still there; change group name → reload → persists
- [ ] V4 Demo: Two tabs open → add transaction in one → appears instantly in the other
- [ ] All tests pass: `npx vitest run`
- [ ] Seed script works: `npm run seed`
