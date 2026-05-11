import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Eye, EyeOff, Info } from 'lucide-react'
import type { NodeItem } from '../data/mock'
import { useI18n } from '../i18n/I18nContext'

type LatencyRange = '1h' | '6h' | '12h' | '1d'

type PingRecord = {
  client: string
  task_id: number
  time: string
  value: number
}

type PingTask = {
  id: number
  name: string
  interval?: number
  loss?: number
  latest?: number
  avg?: number
  min?: number
  max?: number
  p50?: number
  p99?: number
  p99_p50_ratio?: number
  type?: string
}

type RpcPingResult = {
  count: number
  records: PingRecord[]
  tasks?: PingTask[]
  from?: string
  to?: string
}

const colors = [
  '#22c55e',
  '#f87171',
  '#06b6d4',
  '#818cf8',
  '#14b8a6',
  '#f97316',
  '#67e8f9',
  '#a78bfa',
  '#facc15',
  '#fb7185',
  '#60a5fa',
  '#2dd4bf',
]

const rangeHours: Record<LatencyRange, number> = {
  '1h': 1,
  '6h': 6,
  '12h': 12,
  '1d': 24,
}

async function rpc2Call<TResult = any>(method: string, params?: any): Promise<TResult> {
  const response = await fetch('/api/rpc2', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id: Date.now(),
    }),
  })

  if (!response.ok) {
    throw new Error(`/api/rpc2 HTTP ${response.status}`)
  }

  const json = await response.json()

  if (json.error) {
    throw new Error(json.error.message || 'RPC2 Error')
  }

  return json.result
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="inline-flex items-center gap-3 text-sm text-zinc-300"
    >
      <span
        className={[
          'relative h-6 w-11 rounded-full transition',
          checked ? 'bg-emerald-500/80' : 'bg-white/10',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-1 h-4 w-4 rounded-full bg-white transition',
            checked ? 'left-6' : 'left-1',
          ].join(' ')}
        />
      </span>

      <span className="inline-flex items-center gap-1">
        {label}
        <Info className="h-4 w-4 text-zinc-500" />
      </span>
    </button>
  )
}

function LegendItem({
  color,
  name,
  active,
  onClick,
}: {
  color: string
  name: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm transition',
        active
          ? 'text-zinc-200 hover:bg-white/[0.05]'
          : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300',
      ].join(' ')}
      title={name}
    >
      <span className="relative flex h-3 w-4 items-center justify-center">
        <span
          className={[
            'block h-[2px] w-4 rounded-full transition',
            !active ? 'opacity-40' : '',
          ].join(' ')}
          style={{ backgroundColor: color }}
        />

        {!active && (
          <span className="absolute block h-[2px] w-4 rotate-[-30deg] rounded-full bg-zinc-500" />
        )}
      </span>

      <span className={['truncate', !active ? 'line-through' : ''].join(' ')}>
        {name}
      </span>
    </button>
  )
}

function LatencyTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const sorted = [...payload]
    .filter((item) => item.value !== null && item.value !== undefined)
    .sort((a, b) => Number(b.value) - Number(a.value))

  if (sorted.length === 0) {
    return null
  }

  return (
    <div className="min-w-[230px] rounded-2xl border border-white/[0.08] bg-zinc-950/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl">
      <p className="mb-3 text-sm font-semibold text-zinc-100">{label}</p>

      <div className="space-y-2">
        {sorted.map((item) => (
          <div
            key={item.dataKey}
            className="flex items-center justify-between gap-5 text-sm"
          >
            <span className="min-w-0 truncate" style={{ color: item.color }}>
              {item.name}
            </span>

            <span className="shrink-0 font-semibold tabular-nums text-zinc-100">
              {Number(item.value).toFixed(0)} ms
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function getTaskRecords(records: PingRecord[], taskId: number) {
  return records
    .filter((record) => record.task_id === taskId)
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
}

function getLatestLatency(task: PingTask, records: PingRecord[]) {
  if (typeof task.latest === 'number' && task.latest >= 0) {
    return task.latest
  }

  const valid = records.filter((record) => record.value >= 0)
  const latest = valid[valid.length - 1]

  return latest ? latest.value : 0
}

function getLoss(task: PingTask, records: PingRecord[]) {
  if (typeof task.loss === 'number') {
    return task.loss
  }

  if (records.length === 0) return 0

  const lost = records.filter((record) => record.value < 0).length

  return (lost / records.length) * 100
}

function getJitter(task: PingTask, records: PingRecord[]) {
  if (typeof task.p99_p50_ratio === 'number') {
    return task.p99_p50_ratio
  }

  const valid = records.filter((record) => record.value >= 0)

  if (valid.length < 2) return 0

  let totalDiff = 0

  for (let index = 1; index < valid.length; index += 1) {
    totalDiff += Math.abs(valid[index].value - valid[index - 1].value)
  }

  return totalDiff / (valid.length - 1)
}

function getBucketSizeMs(records: PingRecord[]) {
  if (records.length <= 0) return 60 * 1000

  const times = records
    .map((record) => new Date(record.time).getTime())
    .filter((time) => Number.isFinite(time))
    .sort((a, b) => a - b)

  if (times.length < 2) return 60 * 1000

  const span = times[times.length - 1] - times[0]

  // 1 小时内：按 1 分钟聚合
  if (span <= 60 * 60 * 1000) return 60 * 1000

  // 6 小时内：按 3 分钟聚合
  if (span <= 6 * 60 * 60 * 1000) return 3 * 60 * 1000

  // 12 小时内：按 5 分钟聚合
  if (span <= 12 * 60 * 60 * 1000) return 5 * 60 * 1000

  // 1 天：按 10 分钟聚合
  return 10 * 60 * 1000
}

function formatBucketTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function buildChartData(records: PingRecord[], tasks: PingTask[]) {
  if (records.length === 0 || tasks.length === 0) {
    return []
  }

  const bucketSizeMs = getBucketSizeMs(records)

  const grouped: Record<
    number,
    Record<string, string | number | null | Record<string, number[]>>
  > = {}

  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  )

  for (const record of sortedRecords) {
    const ts = new Date(record.time).getTime()

    if (!Number.isFinite(ts)) continue

    const bucket = Math.floor(ts / bucketSizeMs) * bucketSizeMs
    const taskKey = String(record.task_id)

    if (!grouped[bucket]) {
      grouped[bucket] = {
        time: formatBucketTime(bucket),
        timestamp: bucket,
        __values: {},
      }
    }

    const values = grouped[bucket].__values as Record<string, number[]>

    if (!values[taskKey]) {
      values[taskKey] = []
    }

    if (record.value >= 0) {
      values[taskKey].push(record.value)
    }
  }

  return Object.values(grouped)
    .map((row) => {
      const values = row.__values as Record<string, number[]>

      const normalized: Record<string, string | number | null> = {
        time: row.time as string,
        timestamp: row.timestamp as number,
      }

      tasks.forEach((task) => {
        const taskKey = String(task.id)
        const taskValues = values[taskKey] ?? []

        if (taskValues.length === 0) {
          normalized[taskKey] = null
        } else {
          const avg =
            taskValues.reduce((sum, value) => sum + value, 0) / taskValues.length

          normalized[taskKey] = Number(avg.toFixed(1))
        }
      })

      return normalized
    })
    .sort((a, b) => Number(a.timestamp) - Number(b.timestamp))
}

export function LatencyPanel({ node }: { node: NodeItem }) {
  const { t } = useI18n()

  const [range, setRange] = useState<LatencyRange>('1h')
  const [smooth, setSmooth] = useState(false)
  const [visibleIds, setVisibleIds] = useState<string[]>([])
  const [records, setRecords] = useState<PingRecord[]>([])
  const [tasks, setTasks] = useState<PingTask[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ranges = [
    { key: '1h' as const, label: t.oneHour },
    { key: '6h' as const, label: t.sixHours },
    { key: '12h' as const, label: t.twelveHours },
    { key: '1d' as const, label: t.oneDay },
  ]

  useEffect(() => {
    let cancelled = false

    async function loadPingRecords() {
      if (!node.id) return

      setLoading(true)
      setError(null)

      try {
        const result = await rpc2Call<RpcPingResult>('common:getRecords', {
          uuid: node.id,
          type: 'ping',
          hours: rangeHours[range],
        })

        const nextRecords = result?.records ?? []
        const nextTasks = result?.tasks ?? []

        if (!cancelled) {
          setRecords(nextRecords)
          setTasks(nextTasks)
          setVisibleIds(nextTasks.map((task) => String(task.id)))
        }
      } catch (currentError) {
        if (!cancelled) {
          setRecords([])
          setTasks([])
          setVisibleIds([])
          setError(
            currentError instanceof Error
              ? currentError.message
              : 'Failed to load ping records',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadPingRecords()

    return () => {
      cancelled = true
    }
  }, [node.id, range])

  const chartData = useMemo(() => {
    return buildChartData(records, tasks)
  }, [records, tasks])

  const visibleTasks = useMemo(() => {
    return tasks.filter((task) => visibleIds.includes(String(task.id)))
  }, [tasks, visibleIds])

  const allVisible = visibleIds.length === tasks.length && tasks.length > 0

  const maxValue = useMemo(() => {
    let currentMax = 0

    visibleTasks.forEach((task) => {
      getTaskRecords(records, task.id).forEach((record) => {
        if (record.value > currentMax) {
          currentMax = record.value
        }
      })
    })

    return Math.max(100, Math.ceil(currentMax / 50) * 50)
  }, [visibleTasks, records])

  const toggleTarget = (id: string) => {
    setVisibleIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
  }

  const hasData = tasks.length > 0 && chartData.length > 0

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

      {!hasData ? (
        <div>
          <p className="mb-6 text-center text-zinc-500">
            {loading ? t.loading : error ? error : t.none}
          </p>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.045] p-5 shadow-xl shadow-black/20 backdrop-blur-xl">
            <div className="flex h-[320px] items-center justify-center text-3xl text-zinc-500">
              {loading ? t.loading : t.none}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Toggle checked={false} onChange={() => {}} label={t.smoothing} />

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-zinc-300"
              >
                <Eye className="h-4 w-4" />
                {t.showAll}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-5 rounded-2xl border border-white/[0.08] bg-white/[0.045] p-4 shadow-xl shadow-black/20 backdrop-blur-xl">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-5">
              {tasks.map((task, index) => {
                const id = String(task.id)
                const active = visibleIds.includes(id)
                const taskRecords = getTaskRecords(records, task.id)
                const color = colors[index % colors.length]
                const latest = getLatestLatency(task, taskRecords)
                const loss = getLoss(task, taskRecords)
                const jitter = getJitter(task, taskRecords)

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleTarget(id)}
                    className={[
                      'rounded-xl border px-3 py-3 text-left transition',
                      active
                        ? 'border-white/[0.12] bg-black/25'
                        : 'border-white/[0.08] bg-black/10',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-1 h-10 w-1.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold text-zinc-100">
                          {task.name}
                        </p>

                        <p className="mt-1 text-sm text-zinc-400">
                          {latest.toFixed(0)} ms&nbsp;&nbsp;
                          {loss.toFixed(1)}%{t.packetLoss}&nbsp;&nbsp;
                          {jitter.toFixed(1)}{t.jitter}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.045] p-5 shadow-xl shadow-black/20 backdrop-blur-xl">
            <div className="h-[420px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />

                  <XAxis
                    dataKey="time"
                    tick={{ fill: '#71717a', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    domain={[0, maxValue]}
                    tick={{ fill: '#71717a', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    unit="ms"
                  />

                  <Tooltip content={<LatencyTooltip />} />

                  {tasks
                    .filter((task) => visibleIds.includes(String(task.id)))
                    .map((task, index) => (
                      <Line
                        key={task.id}
                        type={smooth ? 'monotone' : 'linear'}
                        dataKey={String(task.id)}
                        stroke={colors[index % colors.length]}
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                        name={task.name}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/[0.06] pt-4">
              {tasks.map((task, index) => {
                const id = String(task.id)

                return (
                  <LegendItem
                    key={id}
                    color={colors[index % colors.length]}
                    name={task.name}
                    active={visibleIds.includes(id)}
                    onClick={() => toggleTarget(id)}
                  />
                )
              })}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Toggle
                checked={smooth}
                onChange={() => setSmooth((value) => !value)}
                label={t.smoothing}
              />

              <button
                type="button"
                onClick={() => {
                  if (allVisible) {
                    setVisibleIds([])
                  } else {
                    setVisibleIds(tasks.map((item) => String(item.id)))
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-zinc-300 hover:bg-white/[0.05]"
              >
                {allVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {allVisible ? t.hideAll : t.showAll}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
