import type { FeatureCollection } from 'geojson'
import {
  Info,
  Layers,
  MapPin,
  Sparkles,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import KabupatenModal from './components/KabupatenModal'
import MapView from './components/MapView'
import Sidebar from './components/Sidebar'
import TentangData from './components/TentangData'
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

  const [mode, setMode] = useState<ChoroplethMode>('sawit')
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
    return <TentangData onBack={() => setView('peta')} />
  }

  return (
    <div className="app-viewport">
      {/* 1. Header Melayang (Floating Glass Header) */}
      <header className="floating-header-nav">
        {/* Brand Card Melayang di Kiri */}
        <div className="brand-floating-card glass-panel">
          <div className="brand-icon-wrapper">
            <Sparkles size={20} className="brand-sparkle" />
          </div>
          <div className="brand-text">
            <h1>Peta Sawit & Kebakaran Riau</h1>
            <p>Persebaran sawit rakyat 2024 & karhutla 2026 per kabupaten</p>
          </div>
        </div>

        {/* Action Controls Melayang di Kanan */}
        <div className="floating-actions-wrap">
          <button
            type="button"
            className={`glass-nav-btn ${isSidebarOpen ? 'active' : ''}`}
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label="Toggle Panel Layer"
          >
            <Layers size={18} />
            <span>Layer & Kontrol</span>
            {hotspotData && (
              <span className="btn-badge">{hotspotData.features.length}</span>
            )}
          </button>

          <button
            type="button"
            className="glass-nav-btn secondary"
            onClick={() => setView('tentang')}
            aria-label="Tentang Data"
          >
            <Info size={18} />
            <span>Tentang Data</span>
          </button>
        </div>
      </header>

      {/* 2. Petunjuk Melayang Bawah (Interactive Hint Pill) */}
      <div className="floating-bottom-hint glass-panel">
        <MapPin size={15} className="hint-pin-icon" />
        <span>
          Arahkan kursor & <b>klik kabupaten</b> pada peta untuk melihat modal data lengkap.
        </span>
      </div>

      {/* 3. Peta Fullscreen */}
      <main className="map-fullscreen-container">
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

      {/* 5. Pop-up Modal Box Profil Kabupaten */}
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
    </div>
  )
}
