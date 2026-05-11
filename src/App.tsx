import { useEffect } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { OverviewPage } from './pages/OverviewPage'
import { NodePage } from './pages/NodePage'
import { useKomariData } from './hooks/useKomariData'
import { useI18n } from './i18n/I18nContext'
import { useLocalStorage } from './hooks/useLocalStorage'

export default function App() {
  const { nodes, loading, error, usingFallback, refresh } = useKomariData()
  const { t } = useI18n()

  const [activePage, setActivePage] = useLocalStorage<'overview' | 'node'>(
    'komari-active-page',
    'overview',
  )
  const [activeNodeId, setActiveNodeId] = useLocalStorage(
    'komari-active-node-id',
    nodes[0]?.id ?? '',
  )
  const [searchQuery, setSearchQuery] = useLocalStorage('komari-search-query', '')

  const activeNode = nodes.find((node) => node.id === activeNodeId)

  useEffect(() => {
    if (!nodes.length) return

    const exists = nodes.some((node) => node.id === activeNodeId)

    if (!exists) {
      setActiveNodeId(nodes[0].id)
    }
  }, [activeNodeId, nodes, setActiveNodeId])

  const statusBanner = (loading || error || usingFallback) && (
    <div className="mb-4 rounded-2xl border border-white/[0.08] bg-white/[0.045] px-4 py-3 text-sm text-zinc-400 shadow-lg shadow-black/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {loading ? t.loading : error || usingFallback ? t.apiError : ''}
        </span>

        {(error || usingFallback) && (
          <button
            type="button"
            onClick={refresh}
            className="w-fit rounded-full border border-white/[0.08] px-4 py-1.5 text-zinc-300 hover:bg-white/[0.06]"
          >
            {t.retry}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050607] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,197,94,0.14),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(59,130,246,0.08),transparent_26%)]" />

      {/* 窄屏 / 竖屏布局 */}
      <div className="relative mx-auto min-h-screen w-full max-w-[1880px] p-4 sm:p-5 xl:hidden">
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        {statusBanner}

        {activePage === 'overview' ? (
          <div className="space-y-5">
            <Sidebar
              variant="mobileTop"
              activePage={activePage}
              activeNodeId={activeNodeId}
              searchQuery={searchQuery}
              onOverviewClick={() => setActivePage('overview')}
              onNodeClick={(id) => {
                setActiveNodeId(id)
                setActivePage('node')
              }}
            />

            <OverviewPage />

            <Sidebar
              variant="watchlistOnly"
              activePage={activePage}
              activeNodeId={activeNodeId}
              searchQuery={searchQuery}
              onOverviewClick={() => setActivePage('overview')}
              onNodeClick={(id) => {
                setActiveNodeId(id)
                setActivePage('node')
              }}
            />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActivePage('overview')}
                className="inline-flex min-w-0 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.045] px-4 py-2.5 text-sm font-medium text-zinc-300 shadow-lg shadow-black/20 transition hover:bg-white/[0.08] hover:text-white"
              >
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span className="truncate">{t.serverOverview}</span>
              </button>

              {activeNode && (
                <p className="min-w-0 truncate text-sm text-zinc-500">
                  {activeNode.name}
                </p>
              )}
            </div>

            <NodePage nodeId={activeNodeId} />
          </div>
        )}
      </div>

      {/* 宽屏 / 桌面布局 */}
      <div className="relative mx-auto hidden min-h-screen w-full max-w-[1880px] p-6 xl:block">
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        {statusBanner}

        <div className="flex min-w-0 gap-6">
          <Sidebar
            variant="full"
            activePage={activePage}
            activeNodeId={activeNodeId}
            searchQuery={searchQuery}
            onOverviewClick={() => setActivePage('overview')}
            onNodeClick={(id) => {
              setActiveNodeId(id)
              setActivePage('node')
            }}
          />

          <main className="min-w-0 flex-1">
            {activePage === 'overview' ? (
              <OverviewPage />
            ) : (
              <NodePage nodeId={activeNodeId} />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
