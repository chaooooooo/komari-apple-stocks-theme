import { useEffect, useMemo, useRef, useState } from 'react'
import { Calculator } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'

export function ValueCalculatorPopover() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [price, setPrice] = useState('100')
  const [startDate, setStartDate] = useState('2026-01-01')
  const [endDate, setEndDate] = useState('2026-12-31')

  const popoverRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!popoverRef.current) return

      if (!popoverRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const result = useMemo(() => {
    const priceNumber = Number(price)
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    const now = Date.now()

    if (!priceNumber || Number.isNaN(start) || Number.isNaN(end) || end <= start) {
      return {
        totalDays: 0,
        usedDays: 0,
        remainingDays: 0,
        remainingValue: 0,
      }
    }

    const day = 24 * 60 * 60 * 1000
    const totalDays = Math.ceil((end - start) / day)
    const usedDays = Math.max(0, Math.min(totalDays, Math.ceil((now - start) / day)))
    const remainingDays = Math.max(0, Math.ceil((end - now) / day))
    const remainingValue = priceNumber * (remainingDays / totalDays)

    return {
      totalDays,
      usedDays,
      remainingDays,
      remainingValue,
    }
  }, [price, startDate, endDate])

  return (
    <div ref={popoverRef} className="relative">
      <button
        title={t.calculator}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.045] text-zinc-300 shadow-lg shadow-black/20 transition hover:bg-white/[0.09] hover:text-white"
      >
        <Calculator className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute right-0 top-14 z-50 w-[360px] rounded-3xl border border-white/[0.1] bg-zinc-950/95 p-5 shadow-2xl shadow-black/50 backdrop-blur-2xl max-sm:right-[-120px] max-sm:w-[calc(100vw-32px)]">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-zinc-100">
              {t.calculator}
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              {t.calculatorDesc}
            </p>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm text-zinc-400">{t.price}</span>
              <input
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className="h-11 w-full rounded-2xl border border-white/[0.08] bg-black/30 px-4 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-500/50"
                placeholder="100"
                type="number"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm text-zinc-400">{t.startDate}</span>
              <input
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="h-11 w-full rounded-2xl border border-white/[0.08] bg-black/30 px-4 text-zinc-100 outline-none transition focus:border-emerald-500/50"
                type="date"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm text-zinc-400">{t.endDate}</span>
              <input
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="h-11 w-full rounded-2xl border border-white/[0.08] bg-black/30 px-4 text-zinc-100 outline-none transition focus:border-emerald-500/50"
                type="date"
              />
            </label>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/[0.045] p-4">
              <p className="text-sm text-zinc-500">{t.totalDays}</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-100">
                {result.totalDays}
              </p>
            </div>

            <div className="rounded-2xl bg-white/[0.045] p-4">
              <p className="text-sm text-zinc-500">{t.remainingDays}</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-400">
                {result.remainingDays}
              </p>
            </div>

            <div className="rounded-2xl bg-white/[0.045] p-4">
              <p className="text-sm text-zinc-500">{t.usedDays}</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-100">
                {result.usedDays}
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-500/10 p-4 ring-1 ring-emerald-500/20">
              <p className="text-sm text-emerald-300">{t.remainingValue}</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-400">
                {result.remainingValue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
