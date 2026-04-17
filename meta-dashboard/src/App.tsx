import { useState } from 'react'
import Overview from './pages/Overview'
import AccountDetail from './pages/AccountDetail'
import { metaData } from './data/metaData'

export default function App() {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)

  const selectedAccount = selectedAccountId
    ? metaData.find(a => a.id === selectedAccountId) ?? null
    : null

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {selectedAccount ? (
        <AccountDetail
          account={selectedAccount as any}
          onBack={() => setSelectedAccountId(null)}
        />
      ) : (
        <Overview
          accounts={metaData as any}
          onSelectAccount={setSelectedAccountId}
        />
      )}
    </div>
  )
}
