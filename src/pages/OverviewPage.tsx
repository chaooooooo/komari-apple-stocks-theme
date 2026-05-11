import { OverviewCards } from '../components/OverviewCards'
import { WorldMap } from '../components/WorldMap'
import { useI18n } from '../i18n/I18nContext'

export function OverviewPage() {
  const { t } = useI18n()

  return (
    <div className="min-w-0">
      <div className="mb-6 min-w-0">
        <h1 className="min-w-0 break-words text-4xl font-bold tracking-tight text-zinc-100">
          {t.serverOverview}
        </h1>
        <p className="mt-2 min-w-0 break-words text-lg text-zinc-400">
          {t.globalStatus}
        </p>
      </div>

      <OverviewCards />
      <WorldMap />
    </div>
  )
}
