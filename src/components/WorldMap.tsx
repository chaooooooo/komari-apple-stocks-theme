import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import worldJson from '../assets/world.geo.json'
import { useI18n } from '../i18n/I18nContext'
import { getCountryLabel, getRegionLabel } from '../utils/region'
import { useKomariData } from '../hooks/useKomariData'
import type { NodeItem } from '../data/mock'

echarts.registerMap('world', worldJson as any)

function getCountryStatus(countryNodes: NodeItem[]) {
  if (countryNodes.length === 0) return undefined

  const onlineCount = countryNodes.filter((node) => node.status === 'online').length
  const offlineCount = countryNodes.filter((node) => node.status === 'offline').length

  if (offlineCount === countryNodes.length) return 0
  if (onlineCount === countryNodes.length) return 1

  return 2
}

export function WorldMap() {
  const { t, format, lang } = useI18n()
  const { nodes } = useKomariData()

  const countryNames = Array.from(new Set(nodes.map((node) => node.country)))

  const mapData = countryNames.map((country) => {
    const countryNodes = nodes.filter((node) => node.country === country)

    return {
      name: country,
      value: getCountryStatus(countryNodes),
    }
  })

  const option: EChartsOption = {
    backgroundColor: 'transparent',

    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(24, 24, 27, 0.94)',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      padding: 14,
      extraCssText:
        'box-shadow: 0 20px 60px rgba(0,0,0,0.45); border-radius: 16px; backdrop-filter: blur(18px);',
      textStyle: {
        color: '#f4f4f5',
      },
      formatter: (params: any) => {
        const countryName = params.name
        const countryNodes = nodes.filter((node) => node.country === countryName)

        const title =
          countryNodes.length > 0
            ? getCountryLabel(countryNodes[0].countryCode, lang)
            : countryName

        if (countryNodes.length === 0) {
          return `
            <div style="min-width: 180px">
              <div style="font-weight: 700; margin-bottom: 8px; color: #f4f4f5;">
                ${title}
              </div>
              <div style="color: #71717a;">${t.noServers}</div>
            </div>
          `
        }

        const onlineNodes = countryNodes.filter((node) => node.status === 'online')
        const offlineNodes = countryNodes.filter((node) => node.status === 'offline')
        const partialNodes = countryNodes.filter(
          (node) => node.status !== 'online' && node.status !== 'offline',
        )

        const renderNode = (node: NodeItem, color: string) => {
          return `
            <div style="
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 16px;
              margin-top: 6px;
              color: #d4d4d8;
            ">
              <span style="display: flex; align-items: center; gap: 8px; min-width: 0;">
                <span style="
                  width: 7px;
                  height: 7px;
                  border-radius: 999px;
                  background: ${color};
                  box-shadow: 0 0 10px ${color};
                  flex: none;
                "></span>
                <span style="white-space: nowrap;">${node.name}</span>
              </span>
              <span style="color: #a1a1aa; white-space: nowrap;">
                ${getRegionLabel(node, lang)}
              </span>
            </div>
          `
        }

        const renderGroup = (
          groupTitle: string,
          groupNodes: NodeItem[],
          color: string,
        ) => {
          if (groupNodes.length === 0) return ''

          return `
            <div style="margin-top: 10px;">
              <div style="
                margin-bottom: 4px;
                font-size: 12px;
                color: ${color};
                font-weight: 600;
              ">
                ${groupTitle} · ${groupNodes.length}
              </div>
              ${groupNodes.map((node) => renderNode(node, color)).join('')}
            </div>
          `
        }

        return `
          <div style="min-width: 260px; max-width: 340px;">
            <div style="
              font-weight: 700;
              margin-bottom: 8px;
              color: #f4f4f5;
              font-size: 14px;
            ">
              ${title}
            </div>

            <div style="
              color: #a1a1aa;
              font-size: 12px;
              margin-bottom: 8px;
            ">
              ${format(t.totalServers, { count: countryNodes.length })}
            </div>

            ${renderGroup(t.online, onlineNodes, '#22c55e')}
            ${renderGroup(t.abnormal, partialNodes, '#f97316')}
            ${renderGroup(t.offline, offlineNodes, '#ef4444')}
          </div>
        `
      },
    },

    visualMap: {
      show: false,
      min: 0,
      max: 2,
      inRange: {
        color: ['#ef4444', '#22c55e', '#f97316'],
      },
    },

    series: [
      {
        name: '服务器地区',
        type: 'map',
        map: 'world',
        roam: false,

        /**
         * 重点：
         * layoutSize 用百分比控制地图在容器内等比例缩放。
         * 不用拉伸宽高，所以地图纵横比不会变形。
         */
        layoutCenter: ['50%', '50%'],
        layoutSize: '108%',

        label: {
          show: false,
        },

        itemStyle: {
          areaColor: '#1f2933',
          borderColor: 'rgba(255,255,255,0.09)',
          borderWidth: 0.7,
        },

        emphasis: {
          label: {
            show: false,
          },
          itemStyle: {
            areaColor: '#334155',
          },
        },

        data: mapData,
      },
    ],
  }

  return (
    <div className="relative w-full min-w-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#070b0f] shadow-2xl shadow-black/40">
      {/* 固定地图显示比例，避免窗口变化时被压扁 */}
      <div className="relative aspect-[16/8.2] min-h-[360px] w-full min-w-0 max-sm:aspect-[4/3] max-sm:min-h-[300px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_30%,rgba(34,197,94,0.14),transparent_24%),radial-gradient(circle_at_75%_45%,rgba(59,130,246,0.09),transparent_22%),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:100%_100%,100%_100%,52px_52px,52px_52px]" />

        <ReactECharts
          option={option}
          notMerge
          lazyUpdate
          opts={{
            renderer: 'canvas',
          }}
          style={{
            width: '100%',
            height: '100%',
          }}
        />

        <div className="absolute bottom-4 left-4 rounded-2xl border border-white/[0.08] bg-black/55 p-3 shadow-xl shadow-black/30 backdrop-blur-xl sm:bottom-6 sm:left-6 sm:p-4">
          <div className="space-y-3 text-sm text-zinc-200 sm:text-base">
            <div className="flex items-center gap-3">
              <span className="h-3.5 w-3.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]" />
              <span className="whitespace-nowrap">{t.allOnline}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="h-3.5 w-3.5 rounded-full bg-orange-400 shadow-[0_0_14px_rgba(251,146,60,0.8)]" />
              <span className="whitespace-nowrap">{t.partialOnline}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="h-3.5 w-3.5 rounded-full bg-red-500 shadow-[0_0_14px_rgba(239,68,68,0.8)]" />
              <span className="whitespace-nowrap">{t.allOffline}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
