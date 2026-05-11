export function clampNumber(value: unknown, min = 0, max = 100) {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return min
  }

  return Math.min(max, Math.max(min, number))
}

export function formatPercent(value: unknown, digits = 0) {
  const number = clampNumber(value, 0, 100)
  return `${number.toFixed(digits)}%`
}

export function formatBytes(value: unknown, digits = 2) {
  const bytes = Number(value)

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  let size = bytes
  let index = 0

  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index += 1
  }

  if (index === 0) {
    return `${Math.round(size)} ${units[index]}`
  }

  return `${size.toFixed(digits)} ${units[index]}`
}

export function formatSpeed(value: unknown, digits = 2) {
  return `${formatBytes(value, digits)}/s`
}

export function fallbackText(value: unknown, fallback = '--') {
  if (value === null || value === undefined || value === '') {
    return fallback
  }

  return String(value)
}

export function formatLastReport(value: unknown) {
  if (!value) {
    return '--'
  }

  if (typeof value === 'string') {
    return value
  }

  const date = new Date(Number(value))

  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  return date.toLocaleString()
}
