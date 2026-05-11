import {
  Activity,
  Cpu,
  Database,
  HardDrive,
  MemoryStick,
  RadioTower,
} from 'lucide-react'
import type { NodeItem } from '../data/mock'
import { useI18n } from '../i18n/I18nContext'

function MetricCard({
  label,
  value,
  sub,
  icon,
  danger = false,
}: {
  label: string
  value: string
  sub: string
  icon: React.ReactNode
  danger?: boolean
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.045] p-5 shadow-xl shadow-black/20 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">{label}</p>
        <div className={danger ? 'text-orange-400' : 'text-emerald-400'}>
          {icon}
        </div>
      </div>

      <p className="break-words text-3xl font-semibold tracking-tight text-zinc-100">
        {value}
      </p>

      <p
        className={[
          'mt-2 text-sm',
          danger ? 'text-orange-300' : 'text-emerald-300',
        ].join(' ')}
      >
        {sub}
      </p>
    </div>
  )
}

function formatShortRunningTime(text: string) {
  const dayMatch = text.match(/(\d+)\s*天/)
  const hourMatch = text.match(/(\d+)\s*时/)

  const days = dayMatch?.[1] ?? '0'
  const hours = hourMatch?.[1] ?? '0'

  return `${days}天 ${hours}时`
}

export function NodeMetricGrid({ node }: { node: NodeItem }) {
  const { t } = useI18n()

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <MetricCard
        label={t.runningTime}
        value={formatShortRunningTime(node.system.runningTime)}
        sub={node.status === 'online' ? t.online : node.status === 'partial' ? t.abnormal : t.offline}
        icon={<RadioTower className="h-5 w-5" />}
        danger={node.status !== 'online'}
      />

      <MetricCard
        label={t.uptime}
        value={node.uptime}
        sub="↑ 0.02%"
        icon={<Activity className="h-5 w-5" />}
      />

      <MetricCard
        label={t.traffic24h}
        value={node.traffic24h}
        sub="↑ 8.4%"
        icon={<Database className="h-5 w-5" />}
      />

      <MetricCard
        label={t.cpu}
        value={`${node.cpu}%`}
        sub={node.change > 0 ? `↑ ${node.change}%` : `↓ ${Math.abs(node.change)}%`}
        icon={<Cpu className="h-5 w-5" />}
        danger={node.cpu >= 55}
      />

      <MetricCard
        label={t.memory}
        value={`${node.memory}%`}
        sub="↓ 5%"
        icon={<MemoryStick className="h-5 w-5" />}
        danger={node.memory >= 70}
      />

      <MetricCard
        label={t.disk}
        value={`${node.disk}%`}
        sub="↑ 2%"
        icon={<HardDrive className="h-5 w-5" />}
        danger={node.disk >= 70}
      />
    </div>
  )
}
