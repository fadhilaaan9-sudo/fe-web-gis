import type { FeatureCollection } from 'geojson'
import {
  Info,
  Layers,
  MapPin,
  Sparkles,
} from 'lucide-react'
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import MapView from './components/MapView'
// Sidebar, modal, dan Tentang Data dimuat malas supaya bundle pertama
// hanya berisi peta; ketiganya baru diunduh saat dibutuhkan.
const KabupatenModal = lazy(() => import('./components/KabupatenModal'))
const Sidebar = lazy(() => import('./components/Sidebar'))
const TentangData = lazy(() => import('./components/TentangData'))
import {
  fetchHotspots,
  fetchKabupaten,
  fetchKabupatenProfile,
  fetchKebakaran,
  fetchStats,
  type KabupatenProfile,
  type StatsRow,
} from './lib/api'
import type { ChoroplethMode } from './lib/colors'

export default function App() {
  const [view, setView] = useState<'peta' | 'tentang'>('peta')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [kabupatenData, setKabupatenData] =
    useState<FeatureCollection | null>(null)
  const [kabupatenLoading, setKabupatenLoading] = useState(true)
  const [stats, setStats] = useState<StatsRow[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [mode, setMode] = useState<ChoroplethMode>('netral')
  const [kabupatenFilter, setKabupatenFilter] = useState('')
  const [dari, setDari] = useState('2026-01-01')
  const [sampai, setSampai] = useState('2026-10-23')

  const [showKabupaten, setShowKabupaten] = useState(true)
  const [showHotspot, setShowHotspot] = useState(true)
  const [showKebakaran, setShowKebakaran] = useState(false)

  const [hotspotData, setHotspotData] =
    useState<FeatureCollection | null>(null)
  const [kebakaranData, setKebakaranData] =
    useState<FeatureCollection | null>(null)
  const [kebakaranLoading, setKebakaranLoading] = useState(false)

  const [selectedProfile, setSelectedProfile] =
    useState<KabupatenProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  // Muat kabupaten dan statistik secara independen
  useEffect(() => {
    let cancelled = false
    async function loadKabupaten() {
      try {
        const kabupaten = await fetchKabupaten()
        if (!cancelled) setKabupatenData(kabupaten)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
        }
      } finally {
        if (!cancelled) setKabupatenLoading(false)
      }
    }
    async function loadStats() {
      try {
        const statsRows = await fetchStats()
        if (!cancelled) setStats(statsRows)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
        }
      } finally {
        if (!cancelled) setStatsLoading(false)
      }
    }
    void loadKabupaten()
    void loadStats()
    return () => {
      cancelled = true
    }
  }, [])

  // Muat hotspot setiap kali filter berubah
  useEffect(() => {
    let cancelled = false
    async function loadHotspots() {
      try {
        const data = await fetchHotspots({
          kabupaten: kabupatenFilter,
          dari,
          sampai,
        })
        if (!cancelled) setHotspotData(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
        }
      }
    }
    void loadHotspots()
    return () => {
      cancelled = true
    }
  }, [kabupatenFilter, dari, sampai])

  // Poligon kebakaran dimuat saat layer diaktifkan
  useEffect(() => {
    if (!showKebakaran || kebakaranData) return
    let cancelled = false
    async function loadKebakaran() {
      setKebakaranLoading(true)
      try {
        const data = await fetchKebakaran()
        if (!cancelled) setKebakaranData(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
        }
      } finally {
        if (!cancelled) setKebakaranLoading(false)
      }
    }
    void loadKebakaran()
    return () => {
      cancelled = true
    }
  }, [showKebakaran, kebakaranData])

  // Pilih kabupaten: ambil profil & buka modal dialog
  const selectKabupaten = useCallback(
    async (nama: string, openModal = true) => {
      setKabupatenFilter(nama)
      setProfileLoading(true)
      if (openModal) {
        setIsModalOpen(true)
      }
      try {
        const profile = await fetchKabupatenProfile(nama)
        setSelectedProfile(profile)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        setSelectedProfile(null)
      } finally {
        setProfileLoading(false)
      }
    },
    [],
  )

  const clearSelection = useCallback(() => {
    setKabupatenFilter('')
    setSelectedProfile(null)
    setIsModalOpen(false)
  }, [])

  const handleKabupatenFilterChange = useCallback(
    (nama: string) => {
      if (nama === '') {
        clearSelection()
      } else {
        void selectKabupaten(nama, false)
      }
    },
    [clearSelection, selectKabupaten],
  )

  const statsByKabupaten = useMemo(() => {
    const map: Record<string, StatsRow> = {}
    for (const row of stats) {
      map[row.kabupaten] = row
    }
    return map
  }, [stats])

  if (view === 'tentang') {
    return (
      <Suspense fallback={null}>
        <TentangData onBack={() => setView('peta')} />
      </Suspense>
    )
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden font-sans text-slate-900 bg-slate-900 select-none">
      {/* 1. Header Melayang (Floating Glass Header) */}
      <header className="absolute top-4 left-4 right-4 z-[1000] flex flex-col md:flex-row justify-between items-start gap-2.5 pointer-events-none">
        {/* Brand Card Melayang di Kiri */}
        <div className="pointer-events-auto flex items-center gap-3 px-4.5 py-2.5 rounded-2xl md:rounded-full bg-white/80 hover:bg-white/90 backdrop-blur-xl border border-white/70 shadow-[0_12px_36px_0_rgba(15,23,42,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_0_rgba(15,23,42,0.15)]">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-linear-to-br from-sky-600 to-sky-700 text-white shadow-md shadow-sky-600/35 shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-[15px] font-bold tracking-tight text-slate-900 leading-tight">
              Peta Sawit & Kebakaran Riau
            </h1>
            <p className="text-[11px] font-medium text-slate-500 leading-tight mt-0.5">
              Persebaran sawit rakyat 2024 & karhutla 2026 per kabupaten
            </p>
          </div>
        </div>

        {/* Action Controls Melayang di Kanan */}
        <div className="pointer-events-auto flex items-center gap-2.5 self-end md:self-auto">
          <button
            type="button"
            className={`flex items-center gap-2 px-4.5 py-2.5 rounded-full backdrop-blur-xl border shadow-[0_12px_36px_0_rgba(15,23,42,0.12)] text-[13px] font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_0_rgba(15,23,42,0.16)] ${
              isSidebarOpen
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white/80 hover:bg-white/90 text-slate-900 border-white/70'
            }`}
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label="Toggle Panel Layer"
          >
            <Layers size={18} />
            <span>Layer & Kontrol</span>
            {hotspotData && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-orange-500 text-white">
                {hotspotData.features.length}
              </span>
            )}
          </button>

          <button
            type="button"
            className="flex items-center gap-2 px-4.5 py-2.5 rounded-full bg-white/80 hover:bg-white/90 backdrop-blur-xl border border-white/70 shadow-[0_12px_36px_0_rgba(15,23,42,0.12)] text-[13px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_0_rgba(15,23,42,0.16)]"
            onClick={() => setView('tentang')}
            aria-label="Tentang Data"
          >
            <Info size={18} />
            <span>Tentang Data</span>
          </button>
        </div>
      </header>

      {/* 2. Petunjuk Melayang Bawah (Interactive Hint Pill) */}
      <div className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 z-[900] items-center gap-2 px-4.5 py-2 rounded-full bg-white/80 backdrop-blur-xl border border-white/70 shadow-[0_12px_36px_0_rgba(15,23,42,0.12)] text-xs text-slate-800 pointer-events-none animate-[floatSoft_3s_ease-in-out_infinite]">
        <MapPin size={15} className="text-sky-600" />
        <span>
          Arahkan kursor & <b>klik kabupaten</b> pada peta untuk melihat modal data lengkap.
        </span>
      </div>

      {/* 3. Peta Fullscreen */}
      <main className="absolute inset-0 w-full h-full z-1">
        <MapView
          kabupatenData={kabupatenData}
          statsByKabupaten={statsByKabupaten}
          mode={mode}
          selectedKabupaten={
            kabupatenFilter === '' ? null : kabupatenFilter
          }
          onSelectKabupaten={(nama) => void selectKabupaten(nama, true)}
          showKabupaten={showKabupaten}
          showHotspot={showHotspot}
          showKebakaran={showKebakaran}
          hotspotData={hotspotData}
          kebakaranData={kebakaranData}
        />
      </main>

      {/* 4. Sidebar Collapsible Drawer Melayang di Kanan */}
      <Suspense fallback={null}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        stats={stats}
        statsLoading={statsLoading}
        kabupatenLoading={kabupatenLoading}
        error={error}
        mode={mode}
        onModeChange={setMode}
        kabupatenFilter={kabupatenFilter}
        onKabupatenFilterChange={handleKabupatenFilterChange}
        dari={dari}
        sampai={sampai}
        onDariChange={setDari}
        onSampaiChange={setSampai}
        showKabupaten={showKabupaten}
        onShowKabupatenChange={setShowKabupaten}
        showHotspot={showHotspot}
        onShowHotspotChange={setShowHotspot}
        showKebakaran={showKebakaran}
        onShowKebakaranChange={setShowKebakaran}
        kebakaranLoading={kebakaranLoading}
        hotspotCount={hotspotData ? hotspotData.features.length : null}
        selectedProfile={selectedProfile}
        profileLoading={profileLoading}
        onClearSelection={clearSelection}
        onShowTentang={() => setView('tentang')}
        onOpenModal={() => setIsModalOpen(true)}
      />
      </Suspense>

      {/* 5. Pop-up Modal Box Profil Kabupaten */}
      <Suspense fallback={null}>
      <KabupatenModal
        isOpen={isModalOpen}
        profile={selectedProfile}
        loading={profileLoading}
        onClose={() => setIsModalOpen(false)}
        onFocusHotspot={(nama) => {
          setKabupatenFilter(nama)
          setIsSidebarOpen(true)
        }}
      />
      </Suspense>
    </div>
  )
}
