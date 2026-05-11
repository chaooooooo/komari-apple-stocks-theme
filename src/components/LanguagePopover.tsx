import { useEffect, useRef, useState } from 'react'
import { Globe2 } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import type { Lang } from '../i18n/messages'

const languages: {
  key: Lang
  label: string
}[] = [
  {
    key: 'zh-CN',
    label: '简体中文',
  },
  {
    key: 'zh-TW',
    label: '繁體中文',
  },
  {
    key: 'en',
    label: 'English',
  },
]

export function LanguagePopover() {
  const [open, setOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const { lang, setLang, t } = useI18n()

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

  return (
    <div ref={popoverRef} className="relative">
      <button
        title={t.language}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.045] text-zinc-300 shadow-lg shadow-black/20 transition hover:bg-white/[0.09] hover:text-white"
      >
        <Globe2 className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute right-0 top-14 z-50 w-48 rounded-3xl border border-white/[0.1] bg-zinc-950/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-2xl">
          {languages.map((item) => {
            const selected = lang === item.key

            return (
              <button
                key={item.key}
                onClick={() => {
                  setLang(item.key)
                  setOpen(false)
                }}
                className={[
                  'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition',
                  selected
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'text-zinc-300 hover:bg-white/[0.06] hover:text-zinc-100',
                ].join(' ')}
              >
                <span>{item.label}</span>
                {selected && <span className="text-xs">●</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
