import { createContext, useContext, useMemo } from 'react'
import { messages, type Lang } from './messages'
import { useLocalStorage } from '../hooks/useLocalStorage'

type I18nContextValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: typeof messages[Lang]
  format: (template: string, values: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useLocalStorage<Lang>('komari-language', 'zh-CN')

  const safeLang: Lang = lang in messages ? lang : 'zh-CN'

  const value = useMemo<I18nContextValue>(() => {
    return {
      lang: safeLang,
      setLang,
      t: messages[safeLang],
      format: (template, values) => {
        return Object.entries(values).reduce((result, [key, value]) => {
          return result.replaceAll(`{${key}}`, String(value))
        }, template)
      },
    }
  }, [safeLang, setLang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)

  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider')
  }

  return context
}
