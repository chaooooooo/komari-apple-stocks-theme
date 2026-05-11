import type { NodeStatus } from '../data/mock'

export function getNodeStatusFromRaw(raw: any): NodeStatus {
  const value = raw?.status ?? raw?.online ?? raw?.state

  if (value === true || value === 'online' || value === 'up' || value === 1) {
    return 'online'
  }

  if (value === false || value === 'offline' || value === 'down' || value === 0) {
    return 'offline'
  }

  if (value === 'partial' || value === 'warning' || value === 'degraded') {
    return 'partial'
  }

  return 'offline'
}

export function getStatusLevel({
  status,
  cpu,
  memory,
  disk,
  ping,
  packetLoss,
}: {
  status: NodeStatus
  cpu?: number
  memory?: number
  disk?: number
  ping?: number
  packetLoss?: number
}) {
  if (status === 'offline') {
    return 'danger'
  }

  if (
    status === 'partial' ||
    Number(cpu) >= 80 ||
    Number(memory) >= 85 ||
    Number(disk) >= 90 ||
    Number(ping) >= 200 ||
    Number(packetLoss) > 0
  ) {
    return 'warning'
  }

  return 'normal'
}

export function getStatusDotClass(status: NodeStatus) {
  if (status === 'online') return 'bg-emerald-400'
  if (status === 'partial') return 'bg-orange-500'
  return 'bg-red-500'
}

export function getMetricDanger(value: number, warning = 80) {
  return value >= warning
}
