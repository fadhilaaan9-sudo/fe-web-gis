import {
  AlertCircle,
  Calendar,
  Flame,
  Layers,
  Palmtree,
  SlidersHorizontal,
  Sparkles,
  TableProperties,
  X,
} from 'lucide-react'
import type { StatsRow } from '../lib/api'
import { formatNumber } from '../lib/api'
import { choroplethLegend, type ChoroplethMode } from '../lib/colors'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  stats: StatsRow[]
  statsLoading: boolean
  kabupatenLoading: boolean
  error: string | null
  mode: ChoroplethMode
  onModeChange: (mode: ChoroplethMode) => void
  kabupatenFilter: string
  onKabupatenFilterChange: (nama: string) => void
  dari: string
  sampai: string
  onDariChange: (value: string) => void
  onSampaiChange: (value: string) => void
  showKabupaten: boolean
  onShowKabupatenChange: (value: boolean) => void
  showHotspot: boolean
  onShowHotspotChange: (value: boolean) => void
  showKebakaran: boolean
  onShowKebakaranChange: (value: boolean) => void
  kebakaranLoading: boolean
  hotspotCount: number | null
  onShowTentang: () => void
  onOpenModal: () => void
}

const MODE_LABELS: Array<{
  value: ChoroplethMode
  label: string
  desc: string
}> = [
  {
    value: 'sawit',
    label: 'Sawit Rakyat 2024',
    desc: 'Disbun Riau, perkebunan rakyat',
  },
  {
    value: 'bpbd',
    label: 'Terbakar BPBD',
    desc: 's/d 14 Okt 2026, laporan lapangan',
  },
  {
    value: 'poligon',
    label: 'Luas Poligon Kebakaran',
    desc: 'Jan-Jul 2026, Kemenhut',
  },
  {
    value: 'netral',
    label: 'Netral (Batas Saja)',
    desc: 'Transparan tanpa pewarnaan data',
  },
]

export default function Sidebar(props: SidebarProps) {
  const legend = choroplethLegend(props.mode)

  return (
    <>
      {/* Backdrop overlay saat sidebar terbuka di layar kecil/mobile */}
      <div
        className={`fixed inset-0 z-[1040] bg-slate-900/30 backdrop-blur-xs transition-opacity duration-300 ${
          props.isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={props.onClose}
        aria-hidden="true"
      />

      <aside
        className={`absolute top-4 right-4 bottom-4 w-[calc(100vw-32px)] sm:w-[420px] z-[1050] flex flex-col overflow-hidden rounded-2xl bg-white/80 backdrop-blur-2xl border border-white/75 shadow-[0_24px_60px_0_rgba(15,23,42,0.2)] transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          props.isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+32px)]'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 bg-white/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-sky-600/10 text-sky-600 shrink-0">
              <SlidersHorizontal size={18} />
            </span>
            <div>
              <h3 className="m-0 text-[15px] font-bold text-slate-900 leading-tight">
                Kontrol & Data Peta
              </h3>
              <p className="m-0 text-[11px] text-slate-500 mt-0.5">
                Filter visualisasi spasial Riau
              </p>
            </div>
          </div>
          <button
            type="button"
            className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 bg-white/80 text-slate-500 hover:text-slate-900 hover:bg-white hover:rotate-90 cursor-pointer transition-all duration-200"
            onClick={props.onClose}
            aria-label="Tutup panel"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4.5 flex flex-col gap-5 custom-scrollbar">
          {/* Box Error API jika terjadi gangguan */}
          {props.error && (
            <section className="p-3 bg-red-50/80 border border-red-200/80 rounded-xl text-red-800 text-xs">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <AlertCircle size={16} />
                <h4 className="m-0 text-xs font-bold">API Belum Terhubung</h4>
              </div>
              <p className="m-0 text-xs leading-relaxed">{props.error}</p>
            </section>
          )}



          {/* Seksi Layer Switcher */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-slate-500">
              <Layers size={16} />
              <h4 className="m-0 text-[13px] font-bold uppercase tracking-wider text-slate-900">
                Layer Geospasial
              </h4>
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-3 p-3 bg-white/65 hover:bg-white/90 border border-slate-200/80 hover:border-sky-500/30 rounded-xl cursor-pointer transition-all duration-200">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={props.showKabupaten}
                  onChange={(e) =>
                    props.onShowKabupatenChange(e.target.checked)
                  }
                />
                <span className="relative w-9 h-5 bg-slate-300 peer-checked:bg-sky-600 rounded-full shrink-0 transition-colors duration-200 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:shadow-sm after:transition-transform after:duration-200 peer-checked:after:translate-x-4" />
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-slate-900 flex items-center gap-1.5">
                    Batas 12 Kabupaten / Kota
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {props.kabupatenLoading
                      ? 'Sedang memuat data spasial...'
                      : 'Badan Informasi Geospasial (BIG)'}
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-white/65 hover:bg-white/90 border border-slate-200/80 hover:border-sky-500/30 rounded-xl cursor-pointer transition-all duration-200">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={props.showHotspot}
                  onChange={(e) => props.onShowHotspotChange(e.target.checked)}
                />
                <span className="relative w-9 h-5 bg-slate-300 peer-checked:bg-sky-600 rounded-full shrink-0 transition-colors duration-200 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:shadow-sm after:transition-transform after:duration-200 peer-checked:after:translate-x-4" />
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-slate-900 flex items-center gap-1.5">
                    Titik Panas Hotspot{' '}
                    {props.hotspotCount !== null && (
                      <span className="text-[11px] px-1.5 py-0.5 bg-red-500/15 text-red-600 rounded-full font-bold">
                        {props.hotspotCount} titik
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-slate-500">VIIRS NASA FIRMS 2026</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-white/65 hover:bg-white/90 border border-slate-200/80 hover:border-sky-500/30 rounded-xl cursor-pointer transition-all duration-200">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={props.showKebakaran}
                  onChange={(e) =>
                    props.onShowKebakaranChange(e.target.checked)
                  }
                />
                <span className="relative w-9 h-5 bg-slate-300 peer-checked:bg-sky-600 rounded-full shrink-0 transition-colors duration-200 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:shadow-sm after:transition-transform after:duration-200 peer-checked:after:translate-x-4" />
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-slate-900">
                    Poligon Areal Kebakaran (1.814)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {props.kebakaranLoading
                      ? 'Memuat 1.814 poligon spasial...'
                      : 'Kemenhut RI Jan-Jul 2026'}
                  </span>
                </div>
              </label>
            </div>
          </section>

          {/* Seksi Mode Pewarnaan Choropleth */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-slate-500">
              <Sparkles size={16} />
              <h4 className="m-0 text-[13px] font-bold uppercase tracking-wider text-slate-900">
                Mode Pewarnaan (Choropleth)
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {MODE_LABELS.map((item) => (
                <label
                  key={item.value}
                  className={`flex p-2.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                    props.mode === item.value
                      ? 'bg-white/95 border-sky-600 shadow-md shadow-sky-600/15'
                      : 'bg-white/60 hover:bg-white/90 border-slate-200/80'
                  }`}
                >
                  <input
                    type="radio"
                    name="choropleth-mode"
                    className="sr-only"
                    checked={props.mode === item.value}
                    onChange={() => props.onModeChange(item.value)}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900">{item.label}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">{item.desc}</span>
                  </div>
                </label>
              ))}
            </div>

            {/* Legenda Warna */}
            <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Legenda Indikator
              </span>
              <div className="flex flex-wrap gap-1.5">
                {legend.map((item) => (
                  <div
                    key={item.label}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white rounded-full border border-slate-200/80 text-[11px] text-slate-800"
                  >
                    <span
                      className="w-3 h-3 rounded-[3px] border border-black/10 shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.label}</span>
                  </div>
                ))}
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white rounded-full border border-slate-200/80 text-[11px] text-slate-800">
                  <span
                    className="w-3 h-3 rounded-[3px] border border-black/10 shrink-0"
                    style={{ backgroundColor: '#94a3b8' }}
                  />
                  <span>Tidak ada data</span>
                </div>
              </div>
            </div>
          </section>

          {/* Seksi Filter Titik Panas Hotspot */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-slate-500">
              <Flame size={16} />
              <h4 className="m-0 text-[13px] font-bold uppercase tracking-wider text-slate-900">
                Filter Titik Panas (Hotspot)
              </h4>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="kabupaten-select"
                  className="text-xs font-semibold text-slate-500 flex items-center gap-1"
                >
                  Filter Wilayah
                </label>
                <div className="w-full h-9.5 px-3 bg-white/80 focus-within:bg-white border border-slate-200/90 focus-within:border-sky-600 rounded-lg text-[13px] text-slate-800 outline-none transition-all duration-200 focus-within:ring-3 focus-within:ring-sky-600/15 flex items-center">
                  <select
                    id="kabupaten-select"
                    className="w-full h-full bg-transparent border-none outline-none text-[13px] text-slate-800 cursor-pointer"
                    value={props.kabupatenFilter}
                    onChange={(e) =>
                      props.onKabupatenFilterChange(e.target.value)
                    }
                  >
                    <option value="">Semua Kabupaten / Kota</option>
                    {props.stats.map((row) => (
                      <option key={row.kabupaten} value={row.kabupaten}>
                        {row.kabupaten}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="dari-date"
                    className="text-xs font-semibold text-slate-500 flex items-center gap-1"
                  >
                    <Calendar size={13} /> Rentang Dari
                  </label>
                  <input
                    id="dari-date"
                    type="date"
                    className="w-full h-9.5 px-3 bg-white/80 focus:bg-white border border-slate-200/90 focus:border-sky-600 rounded-lg text-[13px] text-slate-800 outline-none transition-all duration-200 focus:ring-3 focus:ring-sky-600/15"
                    value={props.dari}
                    onChange={(e) => props.onDariChange(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="sampai-date"
                    className="text-xs font-semibold text-slate-500 flex items-center gap-1"
                  >
                    <Calendar size={13} /> Sampai
                  </label>
                  <input
                    id="sampai-date"
                    type="date"
                    className="w-full h-9.5 px-3 bg-white/80 focus:bg-white border border-slate-200/90 focus:border-sky-600 rounded-lg text-[13px] text-slate-800 outline-none transition-all duration-200 focus:ring-3 focus:ring-sky-600/15"
                    value={props.sampai}
                    onChange={(e) => props.onSampaiChange(e.target.value)}
                  />
                </div>
              </div>
              <p className="m-0 text-[11px] text-slate-500">
                Rentang data satelit di database: 1 Jan - 23 Okt 2026.
              </p>
            </div>
          </section>

          {/* Seksi Tabel Statistik Kabupaten */}
          <section className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-500">
              <TableProperties size={16} />
              <h4 className="m-0 text-[13px] font-bold uppercase tracking-wider text-slate-900">
                Statistik Kabupaten
              </h4>
            </div>

            <p className="m-0 text-[11px] text-sky-600 font-medium">
              💡 Klik baris tabel untuk menyorot peta & membuka profil modal.
            </p>

            {props.statsLoading ? (
              <div className="text-xs text-slate-500 py-4 text-center">
                Memuat statistik kabupaten...
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200/80 bg-white/60 custom-scrollbar">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="sticky top-0 bg-slate-100/95 backdrop-blur-xs px-2.5 py-2 text-left font-semibold text-slate-500 border-b border-slate-200/80 z-2">
                        Kabupaten
                      </th>
                      <th className="sticky top-0 bg-slate-100/95 backdrop-blur-xs px-2.5 py-2 text-left font-semibold text-slate-500 border-b border-slate-200/80 z-2">
                        <span className="inline-flex items-center gap-1">
                          <Palmtree size={12} /> Sawit (ha)
                        </span>
                      </th>
                      <th className="sticky top-0 bg-slate-100/95 backdrop-blur-xs px-2.5 py-2 text-left font-semibold text-slate-500 border-b border-slate-200/80 z-2">
                        <span className="inline-flex items-center gap-1">
                          <Flame size={12} /> Hotspot
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {props.stats.map((row) => (
                      <tr
                        key={row.kabupaten}
                        className={`cursor-pointer transition-colors duration-150 hover:bg-sky-600/10 ${
                          row.kabupaten === props.kabupatenFilter
                            ? 'bg-sky-600/15 font-bold'
                            : ''
                        }`}
                        onClick={() => {
                          props.onKabupatenFilterChange(row.kabupaten)
                          props.onOpenModal()
                        }}
                      >
                        <td className="px-2.5 py-2.25 border-b border-slate-100 font-semibold text-slate-900">
                          {row.kabupaten}
                        </td>
                        <td className="px-2.5 py-2.25 border-b border-slate-100 text-slate-800">
                          {formatNumber(row.luas_sawit_rakyat_ha)}
                        </td>
                        <td className="px-2.5 py-2.25 border-b border-slate-100">
                          <span className="inline-block px-1.5 py-0.5 bg-red-500/10 text-red-600 font-bold rounded-full">
                            {formatNumber(row.jumlah_hotspot)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Drawer Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200/80 bg-white/50 backdrop-blur-md shrink-0">
          <button
            type="button"
            className="w-full py-2.5 px-4 rounded-full bg-white/80 hover:bg-white border border-slate-200 hover:border-slate-300 text-slate-800 text-[13px] font-semibold cursor-pointer transition-all duration-200 shadow-xs"
            onClick={props.onShowTentang}
          >
            Tentang Data & Sumber Resmi
          </button>
        </div>
      </aside>
    </>
  )
}
