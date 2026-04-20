'use client'
import { useEffect, useRef } from 'react'
import { createChart, AreaSeries, ColorType } from 'lightweight-charts'
import type { IChartApi } from 'lightweight-charts'
import type { HistoricalPoint } from '../../../lib/FinanceService'

interface PriceChartProps {
  data: HistoricalPoint[]
}

function getChartColors(dark: boolean) {
  return {
    background:  dark ? '#16171d' : '#ffffff',
    text:        dark ? '#9ca3af' : '#6b6375',
    line:        dark ? '#c084fc' : '#aa3bff',
    topColor:    dark ? 'rgba(192,132,252,0.3)' : 'rgba(170,59,255,0.2)',
    bottomColor: 'rgba(0,0,0,0)',
    border:      dark ? '#2e303a' : '#e5e4e7',
    grid:        dark ? '#1f2028' : '#f4f3ec',
  }
}

export default function PriceChart({ data }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef     = useRef<IChartApi | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const mq     = window.matchMedia('(prefers-color-scheme: dark)')
    const colors = getChartColors(mq.matches)

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: colors.background },
        textColor: colors.text,
        fontFamily: 'ui-monospace, Consolas, monospace',
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      rightPriceScale: { borderColor: colors.border },
      timeScale: { borderColor: colors.border, timeVisible: false },
      crosshair: {
        vertLine: { color: colors.line },
        horzLine: { color: colors.line },
      },
      handleScroll: true,
      handleScale: true,
    })
    chartRef.current = chart

    const series = chart.addSeries(AreaSeries, {
      lineColor:        colors.line,
      topColor:         colors.topColor,
      bottomColor:      colors.bottomColor,
      lineWidth:        2,
      priceLineVisible: false,
      lastValueVisible: true,
    })

    series.setData(data)
    chart.timeScale().fitContent()

    const onSchemeChange = (e: MediaQueryListEvent) => {
      const next = getChartColors(e.matches)
      chart.applyOptions({
        layout: { background: { type: ColorType.Solid, color: next.background }, textColor: next.text },
        grid: { vertLines: { color: next.grid }, horzLines: { color: next.grid } },
        rightPriceScale: { borderColor: next.border },
        timeScale: { borderColor: next.border },
      })
      series.applyOptions({ lineColor: next.line, topColor: next.topColor, bottomColor: next.bottomColor })
    }
    mq.addEventListener('change', onSchemeChange)

    const observer = new ResizeObserver((entries) => {
      const e = entries[0]
      if (e) chart.resize(e.contentRect.width, e.contentRect.height)
    })
    observer.observe(container)

    return () => {
      mq.removeEventListener('change', onSchemeChange)
      observer.disconnect()
      chart.remove()
      chartRef.current = null
    }
  }, [data])

  return (
    <div
      ref={containerRef}
      className="price-chart-container"
      aria-label="Historical price chart"
    />
  )
}
