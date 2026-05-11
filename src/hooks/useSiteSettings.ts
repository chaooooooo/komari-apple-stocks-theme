import { useEffect, useMemo, useState } from 'react'

type SiteSettings = {
  siteName: string
  siteDescription: string
  favicon: string
}

function pickString(source: any, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = key
      .split('.')
      .reduce<any>((current, part) => current?.[part], source)

    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return fallback
}

function setDocumentTitle(title: string) {
  if (title) {
    document.title = title
  }
}

function setFavicon(href: string) {
  if (!href) return

  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")

  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }

  link.href = href
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: 'Komari',
    siteDescription: 'Komari Monitor, a simple server monitoring tool.',
    favicon: '/favicon.ico',
  })

  useEffect(() => {
    let cancelled = false

    async function loadSiteSettings() {
      try {
        const response = await fetch('/api/public', {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`/api/public HTTP ${response.status}`)
        }

        const json = await response.json()
        const data = json?.data ?? json

        const siteName = pickString(
          data,
          [
            'site_name',
            'siteName',
            'sitename',
            'name',
            'title',
            'settings.site_name',
            'settings.siteName',
            'settings.name',
            'public.site_name',
            'public.siteName',
            'public.name',
          ],
          'Komari',
        )

        const siteDescription = pickString(
          data,
          [
            'description',
            'site_description',
            'siteDescription',
            'settings.description',
            'settings.site_description',
            'public.description',
          ],
          'Komari Monitor, a simple server monitoring tool.',
        )

        const favicon = pickString(
          data,
          [
            'favicon',
            'favicon_url',
            'faviconUrl',
            'icon',
            'icon_url',
            'iconUrl',
            'logo',
            'logo_url',
            'logoUrl',
            'settings.favicon',
            'settings.icon',
            'settings.logo',
            'public.favicon',
            'public.icon',
            'public.logo',
          ],
          '/favicon.ico',
        )

        if (!cancelled) {
          const nextSettings = {
            siteName,
            siteDescription,
            favicon,
          }

          setSettings(nextSettings)
          setDocumentTitle(siteDescription || siteName)
          setFavicon(favicon)
        }
      } catch {
        if (!cancelled) {
          setDocumentTitle('Komari Monitor, a simple server monitoring tool.')
          setFavicon('/favicon.ico')
        }
      }
    }

    loadSiteSettings()

    return () => {
      cancelled = true
    }
  }, [])

  return useMemo(() => settings, [settings])
}
