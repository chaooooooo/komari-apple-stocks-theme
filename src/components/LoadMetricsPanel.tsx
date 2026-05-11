import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { NodeItem, NodeMetricSample } from '../data/mock'
import { useI18n } from '../i18n/I18nContext'
import { formatBytes, formatSpeed } from '../utils/format'

type LoadRange = 'live' | '4h' | '1d' | '7d' | '30d'

type RawLoadRecord = {
  time: string
  cpu?: number
  ram?: number
  swap?: number
  disk?: number
  net_in?: number
  net_out?: number
  connections?: number
  connections_udp?: number
  process?: number
}

type ChartPoint = {
  timestamp: number
  label: string
  cpu: number
  memory: number
  disk: number
  uploadSpeed: number
  downloadSpeed: number
  connections: number
  udpConnections: number
  processes: number
}

const rangeHours: Record<Exclude<LoadRange, 'live'>, number> = {
  '4h': 4,
  '1d': 24,
  '7d': 168,
  '30d': 720,
}

const remoteCache: Record<string, ChartPoint[]> = {}

function parseBytesText(value?: string) {
  if (!value) return 0

  const match = value.trim().match(/^([\d.]+)\s*([KMGTPE]?B)$/i)

  if (!match) return 0

  const number = Number(match[1])
  const unit = match[2].toUpperCase()

  if (!Number.isFinite(number)) return 0

  const units: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 ** 2,
    GB: 1024 ** 3,
    TB: 1024 ** 4,
    PB: 1024 ** 5,
    EB: 1024 ** 6,
  }

  return number * (units[unit] ?? 1)
}

function clampPercent(value: unknown) {
  const number = Number(value)

  if (!Number.isFinite(number)) return 0

  return Math.max(0, Math.min(100, Number(number.toFixed(2))))
}

function normalizePercent(value: unknown, totalBytes: number) {
  const number = Number(value)

  if (!Number.isFinite(number) || number <= 0) return 0

  // 如果后端返回的本身就是百分比
  if (number <= 100) {
    return clampPercent(number)
  }

  // 如果后端返回的是已用字节数
  if (totalBytes > 0) {
    return clampPercent((number / totalBytes) * 100)
  }

  return 0
}

function formatTimeLabel(timestamp: number, range: LoadRange) {
  const date = new Date(timestamp)

  if (range === '7d' || range === '30d') {
    return date.toLocaleDateString([], {
      month: '2-digit',
      day: '2-digit',
    })
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function normalizeRemoteRecords(
  records: RawLoadRecord[],
  node: NodeItem,
  range: LoadRange,
): ChartPoint[] {
  const memoryTotal = parseBytesText(node.system.memory)
  const diskTotal = parseBytesText(node.system.disk)

  return records
    .map((record) => {
      const timestamp = new Date(record.time).getTime()

      if (!Number.isFinite(timestamp)) {
        return null
      }

      return {
        timestamp,
        label: formatTimeLabel(timestamp, range),
        cpu: clampPercent(record.cpu ?? 0),
        memory: normalizePercent(record.ram ?? 0, memoryTotal),
        disk: normalizePercent(record.disk ?? 0, diskTotal),
        uploadSpeed: Number(record.net_out ?? 0),
        downloadSpeed: Number(record.net_in ?? 0),
        connections: Number(record.connections ?? 0),
        udpConnections: Number(record.connections_udp ?? 0),
        processes: Number(record.process ?? 0),
      }
    })
    .filter((item): item is ChartPoint => Boolean(item))
    .sort((a, b) => a.timestamp - b.timestamp)
}

function normalizeLiveHistory(
  history: NodeMetricSample[] | undefined,
  node: NodeItem,
): ChartPoint[] {
  const source =
    history && history.length > 0
      ? history
      : [
          {
            timestamp: Date.now(),
            time: '',
            cpu: node.cpu,
            memory: node.memory,
            disk: node.disk,
            uploadSpeed: 0,
            downloadSpeed: 0,
            totalUpload: 0,
            totalDownload: 0,
            connections: 0,
            udpConnections: 0,
            processes: 0,
          },
        ]

  return source.slice(-160).map((item) => ({
    timestamp: item.timestamp,
    label: formatTimeLabel(item.timestamp, 'live'),
    cpu: item.cpu,
    memory: item.memory,
    disk: item.disk,
    uploadSpeed: item.uploadSpeed,
    downloadSpeed: item.downloadSpeed,
    connections: item.connections,
    udpConnections: item.udpConnections,
    processes: item.processes,
  }))
}

function downsampleData(data: ChartPoint[], maxPoints = 240) {
  if (data.length <= maxPoints) return data

  const step = Math.ceil(data.length / maxPoints)

  return data.filter((_, index) => index % step === 0)
}

async function fetchLoadRecords(nodeId: string, range: Exclude<LoadRange, 'live'>) {
  const hours = rangeHours[range]
  const response = await fetch(
    `/api/records/load?uuid=${encodeURIComponent(nodeId)}&hours=${hours}`,
    {
      credentials: 'include',
    },
  )

  if (!response.ok) {
    throw new Error(`/api/records/load HTTP ${response.status}`)
  }

  const json = await response.json()

  const records = Array.isArray(json?.data?.records)
    ? json.data.records
    : Array.isArray(json?.records)
      ? json.records
      : []

  return records as RawLoadRecord[]
}

function MetricCard({
  title,
  summary,
  secondary,
  children,
}: {
  title: string
  summary?: string
  secondary?: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/[0.08] bg-white/[0.045] p-4 shadow-xl shadow-black/20 backdrop-blur-xl">
      <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
        <h3 className="min-w-0 truncate text-[13px] font-medium text-zinc-300 sm:text-base">
          {title}
        </h3>

        <div className="shrink-0 text-right">
          {summary && <p className="text-sm text-zinc-300 sm:text-base">{summary}</p>}
          {secondary && <p className="mt-1 text-sm text-zinc-500">{secondary}</p>}
        </div>
      </div>

      <div className="h-[160px] min-w-0 rounded-xl bg-black/20 p-2">
        {children}
      </div>
    </div>
  )
}

function PercentTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/95 p-3 text-sm shadow-2xl shadow-black/50">
      <p className="mb-2 font-semibold text-zinc-100">{label}</p>
      {payload.map((item: any) => (
        <p key={item.dataKey} style={{ color: item.color }}>
          {item.name}: {Number(item.value).toFixed(2)}%
        </p>
      ))}
    </div>
  )
}

function SpeedTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/95 p-3 text-sm shadow-2xl shadow-black/50">
      <p className="mb-2 font-semibold text-zinc-100">{label}</p>
      {payload.map((item: any) => (
        <p key={item.dataKey} style={{ color: item.color }}>
          {item.name}: {formatSpeed(Number(item.value))}
        </p>
      ))}
    </div>
  )
}

function CountTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/95 p-3 text-sm shadow-2xl shadow-black/50">
      <p className="mb-2 font-semibold text-zinc-100">{label}</p>
      {payload.map((item: any) => (
        <p key={item.dataKey} style={{ color: item.color }}>
          {item.name}: {Number(item.value).toFixed(0)}
        </p>
      ))}
    </div>
  )
}

export function LoadMetricsPanel({ node }: { node: NodeItem }) {
  const { t } = useI18n()
  const [range, setRange] = useState<LoadRange>('live')
  const [remoteData, setRemoteData] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ranges = [
    { key: 'live' as const, label: t.realtime },
    { key: '4h' as const, label: t.fourHours },
    { key: '1d' as const, label: t.oneDay },
    { key: '7d' as const, label: t.sevenDays },
    { key: '30d' as const, label: t.thirtyDays },
  ]

  useEffect(() => {
    let cancelled = false

    async function loadRemoteHistory() {
      if (range === 'live') {
        setRemoteData([])
        setLoading(false)
        setError(null)
        return
      }

      const cacheKey = `${node.id}-${range}`
      const cached = remoteCache[cacheKey]

      if (cached) {
        setRemoteData(cached)
      }

      setLoading(!cached)
      setError(null)

      try {
        const records = await fetchLoadRecords(node.id, range)
        const normalized = downsampleData(normalizeRemoteRecords(records, node, range))

        remoteCache[cacheKey] = normalized

        if (!cancelled) {
          setRemoteData(normalized)
        }
      } catch (currentError) {
        if (!cancelled) {
          setError(
            currentError instanceof Error
              ? currentError.message
              : 'Failed to load history',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadRemoteHistory()

    return () => {
      cancelled = true
    }
  }, [node, range])

  const data = useMemo(() => {
    if (range === 'live') {
      return normalizeLiveHistory(node.history, node)
    }

    return remoteData
  }, [node, range, remoteData])

  const latest = data[data.length - 1]

  return (
    <div>
      <div className="mb-5 flex justify-center">
        <div className="flex rounded-full border border-white/[0.08] bg-white/[0.04] p-1 shadow-lg shadow-black/20">
          {ranges.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setRange(item.key)}
              className={[
                'rounded-full px-4 py-2 text-sm font-medium transition',
                range === item.key
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100',
              ].join(' ')}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <p className="mb-4 text-center text-sm text-zinc-500">{t.loading}</p>
      )}

      {error && (
        <p className="mb-4 text-center text-sm text-red-300">{error}</p>
      )}

      {data.length === 0 && !loading ? (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.045] p-10 text-center text-zinc-500">
          {t.noData}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <MetricCard title="CPU" summary={`${node.cpu.toFixed(2)}%`}>
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <AreaChart data={data}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<PercentTooltip />} />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  name="CPU"
                  stroke="#fca5a5"
                  fill="rgba(252,165,165,0.26)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </MetricCard>

          <MetricCard title={t.ram} summary={`${node.memory.toFixed(2)}%`}>
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <AreaChart data={data}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<PercentTooltip />} />
                <Area
                  type="monotone"
                  dataKey="memory"
                  name={t.ram}
                  stroke="#fca5a5"
                  fill="rgba(252,165,165,0.28)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </MetricCard>

          <MetricCard title="Disk" summary={`${node.disk.toFixed(2)}%`}>
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <AreaChart data={data}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<PercentTooltip />} />
                <Area
                  type="monotone"
                  dataKey="disk"
                  name="Disk"
                  stroke="#fda4af"
                  fill="rgba(253,164,175,0.28)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </MetricCard>

          <MetricCard
            title={t.network}
            summary={`↑ ${formatSpeed(latest?.uploadSpeed ?? 0)}`}
            secondary={`↓ ${formatSpeed(latest?.downloadSpeed ?? 0)}`}
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <LineChart data={data}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => formatBytes(value)}
                />
                <Tooltip content={<SpeedTooltip />} />
                <Line
                  type="monotone"
                  dataKey="uploadSpeed"
                  name="↑"
                  stroke="#99f6e4"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="downloadSpeed"
                  name="↓"
                  stroke="#fca5a5"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </MetricCard>

          <MetricCard
            title={t.connections}
            summary={`TCP: ${latest?.connections ?? 0}`}
            secondary={`UDP: ${latest?.udpConnections ?? 0}`}
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <LineChart data={data}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CountTooltip />} />
                <Line
                  type="monotone"
                  dataKey="connections"
                  name="TCP"
                  stroke="#fca5a5"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="udpConnections"
                  name="UDP"
                  stroke="#99f6e4"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </MetricCard>

          <MetricCard title={t.processes} summary={`${latest?.processes ?? 0}`}>
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <LineChart data={data}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CountTooltip />} />
                <Line
                  type="monotone"
                  dataKey="processes"
                  name={t.processes}
                  stroke="#fda4af"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </MetricCard>
        </div>
      )}
    </div>
  )
}
