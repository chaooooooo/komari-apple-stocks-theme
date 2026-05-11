import { ArrowDown, ArrowUp, Cpu, HardDrive, MemoryStick } from 'lucide-react'
import type { NodeItem } from '../data/mock'
import { useI18n } from '../i18n/I18nContext'

function InfoCard({
  label,
  value,
  children,
  className = '',
}: {
  label: string
  value?: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={[
        'rounded-2xl border border-white/[0.08] bg-white/[0.045] p-4 shadow-xl shadow-black/20 backdrop-blur-xl',
        className,
      ].join(' ')}
    >
      <p className="mb-2 text-sm text-zinc-400">{label}</p>
      {value ? (
        <p className="break-words text-lg font-semibold text-zinc-100">{value}</p>
      ) : (
        children
      )}
    </div>
  )
}

export function SystemInfoPanel({ node }: { node: NodeItem }) {
  const { t } = useI18n()

  return (
    <aside className="grid grid-cols-1 gap-3 xl:grid-cols-2 2xl:block 2xl:space-y-3">
      <InfoCard label={t.cpu} className="xl:col-span-2 2xl:col-span-1">
        <div className="flex gap-3">
          <Cpu className="mt-1 h-5 w-5 shrink-0 text-emerald-400" />
          <div>
            <p className="text-base font-semibold leading-6 text-zinc-100">
              {node.system.cpuModel}
            </p>
            <p className="mt-1 text-sm text-zinc-500">{node.system.cores}</p>
          </div>
        </div>
      </InfoCard>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-2">
        <InfoCard label={t.architecture} value={node.system.arch} />
        <InfoCard label={t.virtualization} value={node.system.virtualization} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-2">
        <InfoCard label={t.gpu} value={node.system.gpu} />
        <InfoCard label={t.operatingSystem}>
          <p className="text-base font-semibold text-zinc-100">{node.system.os}</p>
          <p className="mt-1 text-sm text-zinc-500">
            {t.kernelVersion}: {node.system.kernel}
          </p>
        </InfoCard>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-2">
        <InfoCard label={t.network}>
          <div className="space-y-2 text-base font-semibold">
            <p className="flex items-center gap-2 text-emerald-400">
              <ArrowUp className="h-4 w-4" />
              {node.uploadSpeed}
            </p>
            <p className="flex items-center gap-2 text-sky-400">
              <ArrowDown className="h-4 w-4" />
              {node.downloadSpeed}
            </p>
          </div>
        </InfoCard>

        <InfoCard label={t.totalTraffic}>
          <div className="space-y-2 text-base font-semibold">
            <p className="flex items-center gap-2 text-emerald-400">
              <ArrowUp className="h-4 w-4" />
              {node.totalUpload}
            </p>
            <p className="flex items-center gap-2 text-sky-400">
              <ArrowDown className="h-4 w-4" />
              {node.totalDownload}
            </p>
          </div>
        </InfoCard>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 2xl:grid-cols-3">
        <InfoCard label={t.memory}>
          <div className="flex items-center gap-2">
            <MemoryStick className="h-4 w-4 text-emerald-400" />
            <p className="text-base font-semibold text-zinc-100">
              {node.system.memory}
            </p>
          </div>
        </InfoCard>

        <InfoCard label={t.swap} value={node.system.swap} />

        <InfoCard label={t.disk}>
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-orange-400" />
            <p className="text-base font-semibold text-zinc-100">
              {node.system.disk}
            </p>
          </div>
        </InfoCard>
      </div>

      <InfoCard label={t.runningTime} value={node.system.runningTime} />
      <InfoCard label={t.lastReport} value={node.system.lastReport} />
    </aside>
  )
}
