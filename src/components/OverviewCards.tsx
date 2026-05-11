import { Clock3, Globe2, RadioTower, Zap } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import { useKomariData } from '../hooks/useKomariData'

function Card({
  label,
  value,
  icon,
  children,
}: {
  label: string
  value?: string
  icon: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.045] p-5 shadow-xl shadow-black/20 backdrop-blur-xl">
      <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm text-zinc-400">{label}</p>
        <div className="shrink-0 text-zinc-500">{icon}</div>
      </div>

      {value ? (
        <p className="min-w-0 truncate text-3xl font-semibold tracking-tight text-zinc-100">
          {value}
        </p>
      ) : (
        <div className="min-w-0">{children}</div>
      )}
    </div>
  )
}

export function OverviewCards() {
  const { t } = useI18n()
  const { overview } = useKomariData()

  return (
    <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
      <Card
        label={t.currentTime}
        value={overview.currentTime}
        icon={<Clock3 className="h-5 w-5" />}
      />

      <Card
        label={t.currentOnline}
        value={overview.onlineText}
        icon={<RadioTower className="h-5 w-5" />}
      />

      <Card
        label={t.litRegions}
        value={String(overview.countryCount)}
        icon={<Globe2 className="h-5 w-5" />}
      />

      <Card label={t.trafficOverview} icon={<span className="text-lg">◦</span>}>
        <div className="space-y-2 text-xl font-semibold tabular-nums">
          <p className="truncate whitespace-nowrap">
            <span className="text-emerald-400">↑</span> {overview.totalUpload}
          </p>
          <p className="truncate whitespace-nowrap">
            <span className="text-sky-400">↓</span> {overview.totalDownload}
          </p>
        </div>
      </Card>

      <Card label={t.networkSpeed} icon={<Zap className="h-5 w-5" />}>
        <div className="space-y-2 text-xl font-semibold tabular-nums">
          <p className="truncate whitespace-nowrap">
            <span className="text-emerald-400">↑</span> {overview.uploadSpeed}
          </p>
          <p className="truncate whitespace-nowrap">
            <span className="text-sky-400">↓</span> {overview.downloadSpeed}
          </p>
        </div>
      </Card>
    </div>
  )
}
