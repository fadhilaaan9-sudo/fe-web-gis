import {
  AlertCircle,
  Calendar,
  ExternalLink,
  Flame,
  Layers,
  MapPin,
  Palmtree,
  SlidersHorizontal,
  Sparkles,
  TableProperties,
  X,
} from 'lucide-react'
import type { KabupatenProfile, StatsRow } from '../lib/api'
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
  selectedProfile: KabupatenProfile | null
  profileLoading: boolean
  onClearSelection: () => void
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
  const profile = props.selectedProfile?.properties

  return (
    <>
      {/* Backdrop overlay saat sidebar terbuka di layar kecil/mobile */}
      <div
        className={`sidebar-backdrop ${props.isOpen ? 'active' : ''}`}
        onClick={props.onClose}
        aria-hidden="true"
      />

      <aside className={`sidebar-drawer glass-panel ${props.isOpen ? 'open' : ''}`}>
        {/* Drawer Header */}
        <div className="sidebar-drawer-header">
          <div className="drawer-title-wrap">
            <span className="drawer-icon">
              <SlidersHorizontal size={18} />
            </span>
            <div>
              <h3>Kontrol & Data Peta</h3>
              <p>Filter visualisasi spasial Riau</p>
            </div>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={props.onClose}
            aria-label="Tutup panel"
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-scroll-content">
          {/* Box Error API jika terjadi gangguan */}
          {props.error && (
            <section className="glass-error-box">
              <div className="error-header">
                <AlertCircle size={16} />
                <h4>API Belum Terhubung</h4>
              </div>
              <p>{props.error}</p>
            </section>
          )}

          {/* Quick Selected Profile Banner */}
          {profile && (
            <section className="selected-kab-banner glass-subcard">
              <div className="banner-content">
                <span className="banner-pin">
                  <MapPin size={16} />
                </span>
                <div>
                  <div className="banner-title">{profile.nama}</div>
                  <div className="banner-desc">Wilayah sedang disorot</div>
                </div>
              </div>
              <div className="banner-actions">
                <button
                  type="button"
                  className="glass-pill-btn accent"
                  onClick={props.onOpenModal}
                >
                  <ExternalLink size={13} />
                  Buka Modal Profil
                </button>
                <button
                  type="button"
                  className="glass-pill-btn"
                  onClick={props.onClearSelection}
                >
                  Reset
                </button>
              </div>
            </section>
          )}

          {/* Seksi Layer Switcher */}
          <section className="drawer-section">
            <div className="section-title">
              <Layers size={16} />
              <h4>Layer Geospasial</h4>
            </div>

            <div className="layer-list">
              <label className="glass-switch-card">
                <input
                  type="checkbox"
                  checked={props.showKabupaten}
                  onChange={(e) =>
                    props.onShowKabupatenChange(e.target.checked)
                  }
                />
                <span className="switch-slider" />
                <div className="switch-text">
                  <span className="layer-name">Batas 12 Kabupaten / Kota</span>
                  <span className="layer-sub">
                    {props.kabupatenLoading
                      ? 'Sedang memuat data spasial...'
                      : 'Badan Informasi Geospasial (BIG)'}
                  </span>
                </div>
              </label>

              <label className="glass-switch-card">
                <input
                  type="checkbox"
                  checked={props.showHotspot}
                  onChange={(e) => props.onShowHotspotChange(e.target.checked)}
                />
                <span className="switch-slider" />
                <div className="switch-text">
                  <span className="layer-name">
                    Titik Panas Hotspot{' '}
                    {props.hotspotCount !== null && (
                      <span className="badge-count">
                        {props.hotspotCount} titik
                      </span>
                    )}
                  </span>
                  <span className="layer-sub">VIIRS NASA FIRMS 2026</span>
                </div>
              </label>

              <label className="glass-switch-card">
                <input
                  type="checkbox"
                  checked={props.showKebakaran}
                  onChange={(e) =>
                    props.onShowKebakaranChange(e.target.checked)
                  }
                />
                <span className="switch-slider" />
                <div className="switch-text">
                  <span className="layer-name">
                    Poligon Areal Kebakaran (1.814)
                  </span>
                  <span className="layer-sub">
                    {props.kebakaranLoading
                      ? 'Memuat 1.814 poligon spasial...'
                      : 'Kemenhut RI Jan-Jul 2026'}
                  </span>
                </div>
              </label>
            </div>
          </section>

          {/* Seksi Mode Pewarnaan Choropleth */}
          <section className="drawer-section">
            <div className="section-title">
              <Sparkles size={16} />
              <h4>Mode Pewarnaan (Choropleth)</h4>
            </div>

            <div className="mode-options-grid">
              {MODE_LABELS.map((item) => (
                <label
                  key={item.value}
                  className={`glass-radio-card ${
                    props.mode === item.value ? 'active' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="choropleth-mode"
                    checked={props.mode === item.value}
                    onChange={() => props.onModeChange(item.value)}
                  />
                  <div className="radio-body">
                    <span className="radio-label">{item.label}</span>
                    <span className="radio-desc">{item.desc}</span>
                  </div>
                </label>
              ))}
            </div>

            {/* Legenda Warna */}
            <div className="glass-legend-wrap">
              <span className="legend-head">Legenda Indikator</span>
              <div className="legend-items">
                {legend.map((item) => (
                  <div key={item.label} className="legend-item-pill">
                    <span
                      className="legend-color-box"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="legend-text">{item.label}</span>
                  </div>
                ))}
                <div className="legend-item-pill">
                  <span
                    className="legend-color-box"
                    style={{ backgroundColor: '#94a3b8' }}
                  />
                  <span className="legend-text">Tidak ada data</span>
                </div>
              </div>
            </div>
          </section>

          {/* Seksi Filter Titik Panas Hotspot */}
          <section className="drawer-section">
            <div className="section-title">
              <Flame size={16} />
              <h4>Filter Titik Panas (Hotspot)</h4>
            </div>

            <div className="filter-form">
              <div className="input-field-wrap">
                <label htmlFor="kabupaten-select">Filter Wilayah</label>
                <div className="select-container glass-input-box">
                  <select
                    id="kabupaten-select"
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

              <div className="date-filter-grid">
                <div className="input-field-wrap">
                  <label htmlFor="dari-date">
                    <Calendar size={13} /> Rentang Dari
                  </label>
                  <input
                    id="dari-date"
                    type="date"
                    className="glass-input-box"
                    value={props.dari}
                    onChange={(e) => props.onDariChange(e.target.value)}
                  />
                </div>
                <div className="input-field-wrap">
                  <label htmlFor="sampai-date">
                    <Calendar size={13} /> Sampai
                  </label>
                  <input
                    id="sampai-date"
                    type="date"
                    className="glass-input-box"
                    value={props.sampai}
                    onChange={(e) => props.onSampaiChange(e.target.value)}
                  />
                </div>
              </div>
              <p className="section-hint">
                Rentang data satelit di database: 1 Jan - 23 Okt 2026.
              </p>
            </div>
          </section>

          {/* Seksi Tabel Statistik Kabupaten */}
          <section className="drawer-section">
            <div className="section-title">
              <TableProperties size={16} />
              <h4>Statistik Kabupaten</h4>
            </div>

            <p className="table-hint">
              💡 Klik baris tabel untuk menyorot peta & membuka profil modal.
            </p>

            {props.statsLoading ? (
              <div className="table-loading">Memuat statistik kabupaten...</div>
            ) : (
              <div className="glass-table-container">
                <table className="glass-stats-table">
                  <thead>
                    <tr>
                      <th>Kabupaten</th>
                      <th>
                        <Palmtree size={12} /> Sawit (ha)
                      </th>
                      <th>
                        <Flame size={12} /> Hotspot
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {props.stats.map((row) => (
                      <tr
                        key={row.kabupaten}
                        className={
                          row.kabupaten === props.kabupatenFilter
                            ? 'row-selected'
                            : ''
                        }
                        onClick={() => {
                          props.onKabupatenFilterChange(row.kabupaten)
                          props.onOpenModal()
                        }}
                      >
                        <td className="font-semibold">{row.kabupaten}</td>
                        <td>{formatNumber(row.luas_sawit_rakyat_ha)}</td>
                        <td>
                          <span className="hotspot-badge">
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
        <div className="sidebar-drawer-footer">
          <button
            type="button"
            className="glass-btn btn-secondary w-full"
            onClick={props.onShowTentang}
          >
            Tentang Data & Sumber Resmi
          </button>
        </div>
      </aside>
    </>
  )
}
