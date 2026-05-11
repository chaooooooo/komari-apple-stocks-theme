import type { NodeItem } from '../data/mock'
import type { Lang } from '../i18n/messages'

const localeMap: Record<Lang, string> = {
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
  en: 'en',
}

const cityAlias: Record<string, Partial<Record<Lang, string>>> = {
  'Hong Kong': {
    'zh-CN': '香港',
    'zh-TW': '香港',
    en: 'Hong Kong',
  },
  Tokyo: {
    'zh-CN': '东京',
    'zh-TW': '東京',
    en: 'Tokyo',
  },
  Singapore: {
    'zh-CN': '新加坡',
    'zh-TW': '新加坡',
    en: 'Singapore',
  },
  Oregon: {
    'zh-CN': '俄勒冈',
    'zh-TW': '奧勒岡',
    en: 'Oregon',
  },
  Virginia: {
    'zh-CN': '弗吉尼亚',
    'zh-TW': '維吉尼亞',
    en: 'Virginia',
  },
  Frankfurt: {
    'zh-CN': '法兰克福',
    'zh-TW': '法蘭克福',
    en: 'Frankfurt',
  },
  'São Paulo': {
    'zh-CN': '圣保罗',
    'zh-TW': '聖保羅',
    en: 'São Paulo',
  },
  Sydney: {
    'zh-CN': '悉尼',
    'zh-TW': '雪梨',
    en: 'Sydney',
  },
}

const emojiFallbackMap: Record<string, string> = {
  '🇨🇳': 'CN',
  '🇭🇰': 'HK',
  '🇲🇴': 'MO',
  '🇹🇼': 'TW',
  '🇯🇵': 'JP',
  '🇸🇬': 'SG',
  '🇺🇸': 'US',
  '🇩🇪': 'DE',
  '🇧🇷': 'BR',
  '🇦🇺': 'AU',
  '🇬🇧': 'GB',
  '🇫🇷': 'FR',
  '🇳🇱': 'NL',
  '🇨🇦': 'CA',
  '🇰🇷': 'KR',
}

function flagEmojiToCountryCode(flag?: string) {
  if (!flag) return ''

  const trimmed = flag.trim()

  if (emojiFallbackMap[trimmed]) {
    return emojiFallbackMap[trimmed]
  }

  const chars = Array.from(trimmed)

  if (chars.length < 2) return ''

  const code = chars
    .slice(0, 2)
    .map((char) => {
      const point = char.codePointAt(0)
      if (!point) return ''
      return String.fromCharCode(point - 0x1f1e6 + 65)
    })
    .join('')

  return /^[A-Z]{2}$/.test(code) ? code : ''
}

function isFlagEmoji(value: string) {
  return Boolean(flagEmojiToCountryCode(value))
}

export function getCountryLabel(countryCode: string, lang: Lang) {
  const code = countryCode.toUpperCase()

  const special: Record<string, Record<Lang, string>> = {
    HK: {
      'zh-CN': '香港',
      'zh-TW': '香港',
      en: 'Hong Kong',
    },
    MO: {
      'zh-CN': '澳门',
      'zh-TW': '澳門',
      en: 'Macau',
    },
    TW: {
      'zh-CN': '台湾',
      'zh-TW': '台灣',
      en: 'Taiwan',
    },
  }

  if (special[code]) {
    return special[code][lang]
  }

  try {
    const displayNames = new Intl.DisplayNames([localeMap[lang]], {
      type: 'region',
    })

    return displayNames.of(code) ?? code
  } catch {
    return code
  }
}

export function getRegionLabel(node: NodeItem, lang: Lang) {
  const rawRegion = node.region?.trim()

  if (!rawRegion) {
    return getCountryLabel(node.countryCode, lang)
  }

  if (isFlagEmoji(rawRegion)) {
    const code = flagEmojiToCountryCode(rawRegion) || node.countryCode
    return `${rawRegion} ${getCountryLabel(code, lang)}`
  }

  const alias = cityAlias[rawRegion]?.[lang]

  if (alias) {
    return alias
  }

  return rawRegion
}

export function getNodeLocationLabel(node: NodeItem, lang: Lang) {
  const region = getRegionLabel(node, lang)

  if (isFlagEmoji(node.region)) {
    return region
  }

  if (node.countryCode === 'HK' || node.countryCode === 'MO' || node.countryCode === 'TW') {
    return region
  }

  const country = getCountryLabel(node.countryCode, lang)

  if (region === country) {
    return region
  }

  return `${region}, ${country}`
}
