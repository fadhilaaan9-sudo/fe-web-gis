import {
  Flame,
  Info,
  MapPin,
  Palmtree,
  Sparkles,
  Users,
  Wheat,
  X,
} from 'lucide-react'
import type { KabupatenProfile } from '../lib/api'
import { formatDecimal, formatNumber } from '../lib/api'

interface KabupatenModalProps {
  profile: KabupatenProfile | null
  loading?: boolean
  isOpen: boolean
  onClose: () => void
  onFocusHotspot?: (nama: string) => void
}

export default function KabupatenModal({
  profile,
  loading = false,
  isOpen,
  onClose,
  onFocusHotspot,
}: KabupatenModalProps) {
  if (!isOpen) return null

  const p = profile?.properties

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-container glass-card">
        {/* Header Modal */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-pin-icon">
              <MapPin size={22} />
            </span>
            <div>
              <h2 id="modal-title">
                {loading ? 'Memuat Profil...' : p?.nama ?? 'Profil Kabupaten'}
              </h2>
              <span className="modal-subtitle">
                Provinsi Riau &bull; Data Sektoral & Geospasial
              </span>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Tutup modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Isi Modal */}
        {loading ? (
          <div className="modal-loading">
            <div className="loading-spinner" />
            <p>Mengambil data statistik spasial...</p>
          </div>
        ) : p ? (
          <div className="modal-body">
            {/* Grid Kartu Metrik Utama */}
            <div className="metric-grid">
              {/* Seksi Sawit Rakyat */}
              <div className="metric-card glass-subcard palm-theme">
                <div className="card-badge">
                  <Palmtree size={16} />
                  <span>Sawit Rakyat (2024)</span>
                </div>
                <div className="metric-row main-stat">
                  <span className="stat-label">Luas Perkebunan</span>
                  <span className="stat-value">
                    {formatNumber(p.luas_sawit_rakyat_ha)}{' '}
                    <small>ha</small>
                  </span>
                </div>
                <div className="metric-divider" />
                <div className="metric-sub-row">
                  <div>
                    <span className="sub-label">
                      <Wheat size={13} /> Produksi
                    </span>
                    <span className="sub-value">
                      {formatNumber(p.produksi_ton)} <small>ton</small>
                    </span>
                  </div>
                  <div>
                    <span className="sub-label">
                      <Users size={13} /> Petani
                    </span>
                    <span className="sub-value">
                      {formatNumber(p.petani_kk)} <small>KK</small>
                    </span>
                  </div>
                </div>
              </div>

              {/* Seksi Titik Panas VIIRS */}
              <div className="metric-card glass-subcard fire-theme">
                <div className="card-badge">
                  <Flame size={16} />
                  <span>Titik Panas VIIRS (2026)</span>
                </div>
                <div className="metric-row main-stat">
                  <span className="stat-label">Total Hotspot</span>
                  <span className="stat-value text-red">
                    {formatNumber(p.jumlah_hotspot)}{' '}
                    <small>titik</small>
                  </span>
                </div>
                <p className="card-hint">
                  Data NASA FIRMS per 1 Jan - 23 Okt 2026 dalam poligon kabupaten.
                </p>
              </div>
            </div>

            {/* Seksi Karhutla Terbakar (3 Sumber) */}
            <div className="burned-section glass-subcard">
              <div className="card-badge mb-2">
                <Sparkles size={16} />
                <span>Indikator Lahan Terbakar 2026</span>
              </div>

              <div className="burned-grid">
                <div className="burned-item">
                  <span className="item-title">Terbakar BPBD Damkar</span>
                  <span className="item-value">
                    {formatNumber(p.terbakar_bpbd_ha)} ha
                  </span>
                  <span className="item-period">
                    {p.terbakar_bpbd_periode ?? 's/d 14 Okt 2026'}
                  </span>
                </div>

                <div className="burned-item">
                  <span className="item-title">Terbakar SiPongi KLHK</span>
                  <span className="item-value">
                    {p.terbakar_sipongi_ha === null
                      ? '-'
                      : `${formatNumber(p.terbakar_sipongi_ha)} ha`}
                  </span>
                  <span className="item-period">
                    {p.terbakar_sipongi_ha === null
                      ? 'Belum ada data per kabupaten'
                      : p.terbakar_sipongi_periode ?? 'Jan-Jul 2026'}
                  </span>
                </div>

                <div className="burned-item">
                  <span className="item-title">Luas Poligon Kemenhut</span>
                  <span className="item-value">
                    {formatDecimal(p.luas_poligon_kebakaran_ha)} ha
                  </span>
                  <span className="item-period">
                    Hasil potong poligon Jan-Jul 2026
                  </span>
                </div>
              </div>

              <div className="info-note">
                <Info size={14} className="info-icon" />
                <span>
                  Ketiga data terbakar di atas berasal dari metode dan periode yang
                  berbeda, jangan dijumlahkan.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="modal-empty">Data kabupaten tidak tersedia.</div>
        )}

        {/* Modal Footer */}
        <div className="modal-footer">
          {p && onFocusHotspot && (
            <button
              type="button"
              className="glass-btn btn-primary"
              onClick={() => {
                onFocusHotspot(p.nama)
                onClose()
              }}
            >
              <Flame size={16} />
              Filter Hotspot di {p.nama}
            </button>
          )}
          <button
            type="button"
            className="glass-btn btn-secondary"
            onClick={onClose}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
