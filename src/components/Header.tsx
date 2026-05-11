import { Moon, Search, Sun, X } from 'lucide-react'
import { LanguagePopover } from './LanguagePopover'
import { ValueCalculatorPopover } from './ValueCalculatorPopover'
import { useI18n } from '../i18n/I18nContext'
import { useTheme } from '../theme/ThemeContext'
import { useSiteSettings } from '../hooks/useSiteSettings'

type HeaderProps = {
  searchQuery: string
  onSearchChange: (value: string) => void
}

export function Header({ searchQuery, onSearchChange }: HeaderProps) {
  const { t } = useI18n()
  const { theme, toggleTheme } = useTheme()
  const { siteName } = useSiteSettings()

  return (
    <header className="mb-5 min-w-0 xl:mb-6">
      <div className="mb-4 flex items-center gap-3 px-1 xl:hidden">
        <span className="truncate text-3xl font-bold tracking-tight text-zinc-100">
          {siteName}
        </span>
      </div>

      <div className="flex min-w-0 items-center gap-2 sm:gap-3 xl:justify-end">
        <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-white/[0.08] bg-black/30 px-4 text-sm text-zinc-500 shadow-lg shadow-black/20 transition focus-within:border-emerald-500/40 xl:max-w-[420px]">
          <Search className="h-4 w-4 shrink-0" />

          <input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t.searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="shrink-0 rounded-full p-1 text-zinc-500 transition hover:bg-white/[0.08] hover:text-zinc-200"
              title="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ValueCalculatorPopover />

          <LanguagePopover />

          <button
            type="button"
            title={t.darkMode}
            onClick={toggleTheme}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.045] text-zinc-300 shadow-lg shadow-black/20 transition hover:bg-white/[0.09] hover:text-white"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.06] text-sm font-semibold text-zinc-100 shadow-lg shadow-black/20">
            {siteName.slice(0, 1).toUpperCase()}
          </button>
        </div>
      </div>
    </header>
  )
}
