import { useMemo, useState } from 'react'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { OverviewPage } from './pages/OverviewPage'
import { NodePage } from './pages/NodePage'
import { useKomariData } from './hooks/useKomariData'

export default function App() {
  const { nodes } = useKomariData()

  const [searchQuery, setSearchQuery] = useState('')
  const [activePage, setActivePage] = useState<'overview' | 'node'>('overview')
  const [activeNodeId, setActiveNodeId] = useState('')

  const activeNode = useMemo(() => {
    return nodes.find((node) => node.id === activeNodeId) ?? nodes[0]
  }, [nodes, activeNodeId])

  const handleOverviewClick = () => {
    setActivePage('overview')
    setActiveNodeId('')
  }

  const handleNodeClick = (id: string) => {
    setActiveNodeId(id)
    setActivePage('node')
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#03070a] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_90%_18%,rgba(59,130,246,0.08),transparent_25%)]" />

      <div className="relative mx-auto w-full max-w-[1680px] px-4 py-5 sm:px-6 lg:px-8">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <div className="flex min-w-0 flex-col gap-6 xl:flex-row">
          <Sidebar
            activePage={activePage}
            activeNodeId={activeNodeId}
            onOverviewClick={handleOverviewClick}
            onNodeClick={handleNodeClick}
            searchQuery={searchQuery}
          />

          <main className="min-w-0 flex-1">
            {activePage === 'overview' ? (
              <OverviewPage />
            ) : activeNode ? (
              <NodePage nodeId={activeNode.id} />
            ) : (
              <OverviewPage />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
