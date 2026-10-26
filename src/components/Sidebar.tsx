import type { KabupatenProfile, StatsRow } from '../lib/api'
import { formatDecimal, formatNumber } from '../lib/api'
import { choroplethLegend, type ChoroplethMode } from '../lib/colors'

interface SidebarProps {
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
}

const MODE_LABELS: Array<{ value: ChoroplethMode; label: string }> = [
  { value: 'sawit', label: 'Sawit rakyat 2024' },
  { value: 'bpbd', label: 'Terbakar BPBD (s/d 14 Okt 2026)' },
  { value: 'poligon', label: 'Luas poligon kebakaran (Jan-Jul 2026)' },
  { value: 'netral', label: 'Netral (batas saja)' },
]

export default function Sidebar(props: SidebarProps) {
  const legend = choroplethLegend(props.mode)
  const profile = props.selectedProfile?.properties

  return (
    <aside className="sidebar">
      {props.error && (
        <section className="error-box">
          <h2>API belum bisa dihubungi</h2>
          <p>{props.error}</p>
        </section>
      )}

      <section>
        <h2>Layer</h2>
        <label className="check-row">
          <input
            type="checkbox"
            checked={props.showKabupaten}
            onChange={(e) => props.onShowKabupatenChange(e.target.checked)}
          />
          Kabupaten (12){' '}
          {props.kabupatenLoading && '(memuat...)'}
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={props.showHotspot}
            onChange={(e) => props.onShowHotspotChange(e.target.checked)}
          />
          Titik panas{' '}
          {props.hotspotCount !== null && `(${props.hotspotCount} titik)`}
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={props.showKebakaran}
            onChange={(e) => props.onShowKebakaranChange(e.target.checked)}
          />
          Poligon kebakaran (1.814){' '}
          {props.kebakaranLoading && '(memuat...)'}
        </label>
        <p className="hint">
          Poligon kebakaran dimuat hanya saat layer ini diaktifkan,
          supaya peta pertama kali terbuka tetap cepat.
        </p>
      </section>

      <section>
        <h2>Warna peta (choropleth)</h2>
        {MODE_LABELS.map((item) => (
          <label key={item.value} className="check-row">
            <input
              type="radio"
              name="choropleth-mode"
              checked={props.mode === item.value}
              onChange={() => props.onModeChange(item.value)}
            />
            {item.label}
          </label>
        ))}
        <div className="legend">
          {legend.map((item) => (
            <div key={item.label} className="legend-row">
              <span
                className="legend-color"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </div>
          ))}
          <div className="legend-row">
            <span
              className="legend-color"
              style={{ backgroundColor: '#cccccc' }}
            />
            Tidak ada data
          </div>
        </div>
      </section>

      <section>
        <h2>Filter titik panas</h2>
        <label className="field-label">
          Kabupaten
          <select
            value={props.kabupatenFilter}
            onChange={(e) => props.onKabupatenFilterChange(e.target.value)}
          >
            <option value="">Semua kabupaten</option>
            {props.stats.map((row) => (
              <option key={row.kabupaten} value={row.kabupaten}>
                {row.kabupaten}
              </option>
            ))}
          </select>
        </label>
        <div className="date-row">
          <label className="field-label">
            Dari
            <input
              type="date"
              value={props.dari}
              onChange={(e) => props.onDariChange(e.target.value)}
            />
          </label>
          <label className="field-label">
            Sampai
            <input
              type="date"
              value={props.sampai}
              onChange={(e) => props.onSampaiChange(e.target.value)}
            />
          </label>
        </div>
        <p className="hint">
          Data titik panas di database: 1 Jan - 23 Okt 2026.
          Kosongkan tanggal untuk semua tanggal.
        </p>
      </section>

      {profile && (
        <section className="profile">
          <h2>{profile.nama}</h2>
          <dl>
            <div>
              <dt>Sawit rakyat 2024</dt>
              <dd>{formatNumber(profile.luas_sawit_rakyat_ha)} ha</dd>
            </div>
            <div>
              <dt>Produksi sawit rakyat</dt>
              <dd>{formatNumber(profile.produksi_ton)} ton</dd>
            </div>
            <div>
              <dt>Petani sawit rakyat</dt>
              <dd>{formatNumber(profile.petani_kk)} KK</dd>
            </div>
            <div>
              <dt>Terbakar BPBD</dt>
              <dd>
                {formatNumber(profile.terbakar_bpbd_ha)} ha
                <br />
                <small>{profile.terbakar_bpbd_periode ?? '-'}</small>
              </dd>
            </div>
            <div>
              <dt>Terbakar SiPongi</dt>
              <dd>
                {profile.terbakar_sipongi_ha === null
                  ? 'Belum ada data per kabupaten di database'
                  : `${formatNumber(profile.terbakar_sipongi_ha)} ha`}
                <br />
                <small>{profile.terbakar_sipongi_periode ?? '-'}</small>
              </dd>
            </div>
            <div>
              <dt>Jumlah titik panas 2026</dt>
              <dd>{formatNumber(profile.jumlah_hotspot)}</dd>
            </div>
            <div>
              <dt>Luas poligon kebakaran</dt>
              <dd>
                {formatDecimal(profile.luas_poligon_kebakaran_ha)} ha
                <br />
                <small>Jan-Jul 2026, hasil potong poligon ke batas kabupaten</small>
              </dd>
            </div>
          </dl>
          <p className="hint">
            Tiga angka terbakar di atas beda sumber dan beda periode,
            jadi jangan dijumlahkan.
          </p>
          <button type="button" onClick={props.onClearSelection}>
            Tampilkan semua kabupaten
          </button>
        </section>
      )}

      {props.profileLoading && <p>Memuat profil kabupaten...</p>}

      <section>
        <h2>Statistik per kabupaten</h2>
        {props.statsLoading && <p>Memuat statistik...</p>}
        {!props.statsLoading && props.stats.length > 0 && (
          <table className="stats-table">
            <thead>
              <tr>
                <th>Kabupaten</th>
                <th>Sawit (ha)</th>
                <th>Terbakar BPBD (ha)</th>
                <th>Hotspot</th>
              </tr>
            </thead>
            <tbody>
              {props.stats.map((row) => (
                <tr
                  key={row.kabupaten}
                  className={
                    row.kabupaten === props.kabupatenFilter
                      ? 'selected-row'
                      : undefined
                  }
                  onClick={() =>
                    props.onKabupatenFilterChange(row.kabupaten)
                  }
                >
                  <td>{row.kabupaten}</td>
                  <td>{formatNumber(row.luas_sawit_rakyat_ha)}</td>
                  <td>{formatNumber(row.terbakar_bpbd_ha)}</td>
                  <td>{formatNumber(row.jumlah_hotspot)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="hint">
          Klik baris untuk memilih kabupaten itu di peta.
        </p>
      </section>

      <section>
        <button type="button" onClick={props.onShowTentang}>
          Tentang Data
        </button>
      </section>
    </aside>
  )
}
