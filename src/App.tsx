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
  const [nodePageKey, setNodePageKey] = useState(0)

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

    // 每次进入服务器详情页都重新挂载 NodePage，
    // 这样详情页内部 tab 会回到默认“概览”
    setNodePageKey((value) => value + 1)

    // 窄屏下点击服务器后回到页面顶部，形成二级页面体验
    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    })
  }

  const mainContent =
    activePage === 'overview' ? (
      <OverviewPage />
    ) : activeNode ? (
      <NodePage
        key={`${activeNode.id}-${nodePageKey}`}
        nodeId={activeNode.id}
      />
    ) : (
      <OverviewPage />
    )

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#03070a] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_90%_18%,rgba(59,130,246,0.08),transparent_25%)]" />

      <div className="relative mx-auto w-full max-w-[1680px] px-4 py-5 sm:px-6 lg:px-8">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* 桌面布局：左侧完整侧栏 + 右侧主内容 */}
        <div className="hidden min-w-0 gap-6 xl:flex">
          <Sidebar
            activePage={activePage}
            activeNodeId={activeNodeId}
            onOverviewClick={handleOverviewClick}
            onNodeClick={handleNodeClick}
            searchQuery={searchQuery}
          />

          <main className="min-w-0 flex-1">
            {mainContent}
          </main>
        </div>

        {/* 竖屏 / 窄屏布局 */}
<div className="flex min-w-0 flex-col gap-5 xl:hidden">
  {/* 主内容放在最前面 */}
  <main className="min-w-0">
    {mainContent}
  </main>

  {/* 服务器总览按钮放在主内容下面 */}
  <Sidebar
    variant="mobileTop"
    activePage={activePage}
    activeNodeId={activeNodeId}
    onOverviewClick={handleOverviewClick}
    onNodeClick={handleNodeClick}
    searchQuery={searchQuery}
  />

  {/* 只有服务器总览页才显示观察列表 */}
  {activePage === 'overview' && (
    <Sidebar
      variant="watchlistOnly"
      activePage={activePage}
      activeNodeId={activeNodeId}
      onOverviewClick={handleOverviewClick}
      onNodeClick={handleNodeClick}
      searchQuery={searchQuery}
    />
  )}
</div>
      </div>
    </div>
  )
}
