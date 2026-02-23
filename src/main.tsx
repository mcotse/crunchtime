import React from 'react'
import ReactDOM from 'react-dom/client'
import { BudgetApp } from '../pages/BudgetApp'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BudgetApp />
  </React.StrictMode>,
)
