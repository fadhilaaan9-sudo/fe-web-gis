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
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/45 backdrop-blur-md p-4 sm:p-5 animate-[fadeIn_0.25s_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-[580px] max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-white/90 backdrop-blur-2xl border border-white/85 shadow-[0_24px_60px_0_rgba(15,23,42,0.25)] animate-[scaleUp_0.3s_cubic-bezier(0.16,1,0.3,1)]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/80 bg-white/60 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-11 h-11 rounded-full bg-linear-to-br from-sky-600 to-sky-700 text-white shadow-md shadow-sky-600/35 shrink-0">
              <MapPin size={22} />
            </span>
            <div>
              <h2
                id="modal-title"
                className="m-0 text-xl font-extrabold text-slate-900 tracking-tight leading-tight"
              >
                {loading ? 'Memuat Profil...' : p?.nama ?? 'Profil Kabupaten'}
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                Provinsi Riau &bull; Data Sektoral & Geospasial
              </span>
            </div>
          </div>
          <button
            type="button"
            className="flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 bg-white/80 text-slate-500 hover:text-slate-900 hover:bg-white hover:rotate-90 cursor-pointer transition-all duration-200"
            onClick={onClose}
            aria-label="Tutup modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Isi Modal */}
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500 text-sm">
            <div className="w-8 h-8 border-3 border-sky-600/20 border-t-sky-600 rounded-full animate-spin" />
            <p className="m-0">Mengambil data statistik spasial...</p>
          </div>
        ) : p ? (
          <div className="p-6 overflow-y-auto flex flex-col gap-4.5 custom-scrollbar">
            {/* Grid Kartu Metrik Utama */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Seksi Sawit Rakyat */}
              <div className="p-3.5 rounded-xl border border-slate-200/70 bg-slate-50/65 backdrop-blur-md flex flex-col">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">
                  <Palmtree size={16} />
                  <span>Sawit Rakyat (2024)</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-slate-500">Luas Perkebunan</span>
                  <span className="text-2xl font-extrabold text-slate-900">
                    {formatNumber(p.luas_sawit_rakyat_ha)}{' '}
                    <small className="text-sm font-semibold text-slate-500">ha</small>
                  </span>
                </div>
                <div className="h-px bg-slate-200/80 my-3" />
                <div className="flex justify-between text-xs">
                  <div>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Wheat size={13} /> Produksi
                    </span>
                    <span className="font-bold text-slate-900">
                      {formatNumber(p.produksi_ton)}{' '}
                      <small className="font-semibold text-slate-500">ton</small>
                    </span>
                  </div>
                  <div>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Users size={13} /> Petani
                    </span>
                    <span className="font-bold text-slate-900">
                      {formatNumber(p.petani_kk)}{' '}
                      <small className="font-semibold text-slate-500">KK</small>
                    </span>
                  </div>
                </div>
              </div>

              {/* Seksi Titik Panas VIIRS */}
              <div className="p-3.5 rounded-xl border border-slate-200/70 bg-slate-50/65 backdrop-blur-md flex flex-col">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-700 mb-2">
                  <Flame size={16} />
                  <span>Titik Panas VIIRS (2026)</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-slate-500">Total Hotspot</span>
                  <span className="text-2xl font-extrabold text-red-600">
                    {formatNumber(p.jumlah_hotspot)}{' '}
                    <small className="text-sm font-semibold text-slate-500">titik</small>
                  </span>
                </div>
                <p className="m-0 mt-2 text-[11px] text-slate-500 leading-normal">
                  Data NASA FIRMS per 1 Jan - 23 Okt 2026 dalam poligon kabupaten.
                </p>
              </div>
            </div>

            {/* Seksi Karhutla Terbakar (3 Sumber) */}
            <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-slate-50/65 border border-slate-200/70 backdrop-blur-md">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-700 mb-0.5">
                <Sparkles size={16} />
                <span>Indikator Lahan Terbakar 2026</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="flex flex-col p-2.5 bg-white/70 border border-slate-200/70 rounded-lg">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Terbakar BPBD Damkar
                  </span>
                  <span className="text-[15px] font-extrabold text-slate-900 my-0.5">
                    {formatNumber(p.terbakar_bpbd_ha)} ha
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    {p.terbakar_bpbd_periode ?? 's/d 14 Okt 2026'}
                  </span>
                </div>

                <div className="flex flex-col p-2.5 bg-white/70 border border-slate-200/70 rounded-lg">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Terbakar SiPongi KLHK
                  </span>
                  <span className="text-[15px] font-extrabold text-slate-900 my-0.5">
                    {p.terbakar_sipongi_ha === null
                      ? '-'
                      : `${formatNumber(p.terbakar_sipongi_ha)} ha`}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    {p.terbakar_sipongi_ha === null
                      ? 'Belum ada data per kabupaten'
                      : p.terbakar_sipongi_periode ?? 'Jan-Jul 2026'}
                  </span>
                </div>

                <div className="flex flex-col p-2.5 bg-white/70 border border-slate-200/70 rounded-lg">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Luas Poligon Kemenhut
                  </span>
                  <span className="text-[15px] font-extrabold text-slate-900 my-0.5">
                    {formatDecimal(p.luas_poligon_kebakaran_ha)} ha
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Hasil potong poligon Jan-Jul 2026
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 bg-sky-500/10 rounded-lg border border-sky-500/20 text-[11px] text-sky-800 leading-snug">
                <Info size={14} className="shrink-0 mt-0.5" />
                <span>
                  Ketiga data terbakar di atas berasal dari metode dan periode yang
                  berbeda, jangan dijumlahkan.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-slate-500">
            Data kabupaten tidak tersedia.
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-200/80 bg-white/60 shrink-0">
          {p && onFocusHotspot && (
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-full text-[13px] font-semibold text-white bg-linear-to-br from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 shadow-md shadow-sky-600/30 hover:shadow-lg hover:shadow-sky-600/40 hover:-translate-y-0.5 cursor-pointer transition-all duration-200"
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
            className="inline-flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-full text-[13px] font-semibold text-slate-800 bg-white/80 hover:bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition-all duration-200"
            onClick={onClose}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
