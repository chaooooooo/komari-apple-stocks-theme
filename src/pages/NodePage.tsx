import { Globe2 } from 'lucide-react'
import { CpuUsageChart } from '../components/CpuUsageChart'
import { NodeMetricGrid } from '../components/NodeMetricGrid'
import { SystemInfoPanel } from '../components/SystemInfoPanel'
import { LoadMetricsPanel } from '../components/LoadMetricsPanel'
import { LatencyPanel } from '../components/LatencyPanel'
import { useI18n } from '../i18n/I18nContext'
import { getNodeLocationLabel } from '../utils/region'
import { useKomariData } from '../hooks/useKomariData'
import { useLocalStorage } from '../hooks/useLocalStorage'

type DetailTab = 'overview' | 'load' | 'latency'

export function NodePage({ nodeId }: { nodeId: string }) {
  const { t, lang } = useI18n()
  const { nodes } = useKomariData()
  const [activeTab, setActiveTab] = useLocalStorage<DetailTab>(
    'komari-node-detail-tab',
    'overview',
  )

  const node = nodes.find((item) => item.id === nodeId) ?? nodes[0]

  const detailTabs = [
    { key: 'overview' as const, label: t.overviewTab },
    { key: 'load' as const, label: t.loadTab },
    { key: 'latency' as const, label: t.latencyTab },
  ]

  if (!node) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.045] p-8 text-center text-zinc-500">
        {t.noData}
      </div>
    )
  }

  return (
    <div className="min-w-0">
      <div className="mb-6 min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h1 className="min-w-0 break-words text-4xl font-bold tracking-tight text-zinc-100">
            {node.name}
          </h1>

          <span
            className={[
              'shrink-0 rounded-full px-3 py-1 text-sm font-semibold',
              node.status === 'online'
                ? 'bg-emerald-500/15 text-emerald-300'
                : node.status === 'partial'
                  ? 'bg-orange-500/15 text-orange-300'
                  : 'bg-red-500/15 text-red-300',
            ].join(' ')}
          >
            {node.status === 'online'
              ? t.online
              : node.status === 'partial'
                ? t.abnormal
                : t.offline}
          </span>
        </div>

        <p className="mt-2 flex min-w-0 items-center gap-2 text-lg text-zinc-400">
          <Globe2 className="h-5 w-5 shrink-0" />
          <span className="min-w-0 break-words">{getNodeLocationLabel(node, lang)}</span>
        </p>

        <div className="mt-5 flex min-w-0 overflow-x-auto pb-1">
          <div className="flex shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04] p-1 shadow-lg shadow-black/20">
            {detailTabs.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={[
                  'rounded-full px-5 py-2 text-sm font-medium transition',
                  activeTab === item.key
                    ? 'bg-white text-black'
                    : 'text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100',
                ].join(' ')}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid min-w-0 grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="min-w-0">
            <CpuUsageChart node={node} />
            <NodeMetricGrid node={node} />
          </div>

          <SystemInfoPanel node={node} />
        </div>
      )}

      {activeTab === 'load' && <LoadMetricsPanel node={node} />}

      {activeTab === 'latency' && <LatencyPanel node={node} />}
    </div>
  )
}
