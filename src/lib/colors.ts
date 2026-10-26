// Warna choropleth. Ini warna data, bukan hiasan:
// hijau untuk sawit, oranye-merah untuk kebakaran.
// Ambang batas dipilih dari rentang data asli Riau, bukan asal.
// Sawit rakyat: Kepulauan Meranti 249 ha (terkecil) sampai
// Kampar 402.868 ha (terbesar). Terbakar BPBD: 0 sampai
// Bengkalis 8.573 ha. Nilai null (tidak ada data) jadi abu-abu.

export type ChoroplethMode = 'sawit' | 'bpbd' | 'poligon' | 'netral'

export interface LegendItem {
  color: string
  label: string
}

const SAWIT_STOPS: Array<{ max: number; color: string; label: string }> = [
  { max: 1000, color: '#e5f5e0', label: '≤ 1.000 ha' },
  { max: 50000, color: '#a1d99b', label: '1.001 - 50.000 ha' },
  { max: 150000, color: '#41ab5d', label: '50.001 - 150.000 ha' },
  { max: 300000, color: '#006d2c', label: '150.001 - 300.000 ha' },
  { max: Number.POSITIVE_INFINITY, color: '#00441b', label: '> 300.000 ha' },
]

const BURNED_STOPS: Array<{ max: number; color: string; label: string }> = [
  { max: 0, color: '#fee5d9', label: '0 ha' },
  { max: 500, color: '#fcae91', label: '1 - 500 ha' },
  { max: 1500, color: '#fb6a4a', label: '501 - 1.500 ha' },
  { max: 5000, color: '#de2d26', label: '1.501 - 5.000 ha' },
  { max: Number.POSITIVE_INFINITY, color: '#a50f15', label: '> 5.000 ha' },
]

function colorFromStops(
  value: number | null | undefined,
  stops: Array<{ max: number; color: string }>,
): string {
  if (value === null || value === undefined) return '#cccccc'
  for (const stop of stops) {
    if (value <= stop.max) return stop.color
  }
  return stops[stops.length - 1].color
}

export function choroplethColor(
  mode: ChoroplethMode,
  sawitHa: number | null | undefined,
  bpbdHa: number | null | undefined,
  poligonHa: number | null | undefined,
): string {
  if (mode === 'sawit') return colorFromStops(sawitHa, SAWIT_STOPS)
  if (mode === 'bpbd') return colorFromStops(bpbdHa, BURNED_STOPS)
  if (mode === 'poligon') return colorFromStops(poligonHa, BURNED_STOPS)
  return 'transparent'
}

export function choroplethLegend(mode: ChoroplethMode): LegendItem[] {
  if (mode === 'sawit') {
    return SAWIT_STOPS.map((stop) => ({
      color: stop.color,
      label: stop.label,
    }))
  }
  if (mode === 'bpbd' || mode === 'poligon') {
    return BURNED_STOPS.map((stop) => ({
      color: stop.color,
      label: stop.label,
    }))
  }
  return [{ color: 'transparent', label: 'Tanpa pewarnaan (batas saja)' }]
}

// Warna titik hotspot dari confidence FIRMS:
// h = high (merah), n = nominal (oranye), l = low (kuning).
export function hotspotColor(confidence: unknown): string {
  if (confidence === 'h') return '#d7301f'
  if (confidence === 'n') return '#fc8d59'
  return '#fee090'
}

export function confidenceLabel(confidence: unknown): string {
  if (confidence === 'h') return 'Tinggi (high)'
  if (confidence === 'n') return 'Sedang (nominal)'
  if (confidence === 'l') return 'Rendah (low)'
  return String(confidence ?? '-')
}
