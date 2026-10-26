import type { FeatureCollection } from 'geojson'
import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import MapView from './components/MapView'
import Sidebar from './components/Sidebar'
import TentangData from './components/TentangData'
import {
  API_URL,
  fetchHotspots,
  fetchKabupaten,
  fetchKabupatenProfile,
  fetchKebakaran,
  fetchStats,
  type KabupatenProfile,
  type StatsRow,
} from './lib/api'
import type { ChoroplethMode } from './lib/colors'

// Satu state kabupaten dipakai untuk tiga hal sekaligus:
// filter hotspot, baris yang dipilih di tabel, dan profil.
// Jadi klik di peta, klik di tabel, dan dropdown selalu sinkron.
export default function App() {
  const [view, setView] = useState<'peta' | 'tentang'>('peta')
  const [kabupatenData, setKabupatenData] =
    useState<FeatureCollection | null>(null)
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

  // Muat peta kabupaten dan statistik sekali saat aplikasi dibuka.
  useEffect(() => {
    let cancelled = false
    async function loadBase() {
      try {
        const [kabupaten, statsRows] = await Promise.all([
          fetchKabupaten(),
          fetchStats(),
        ])
        if (cancelled) return
        setKabupatenData(kabupaten)
        setStats(statsRows)
        setError(null)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
        }
      } finally {
        if (!cancelled) setStatsLoading(false)
      }
    }
    void loadBase()
    return () => {
      cancelled = true
    }
  }, [])

  // Muat hotspot setiap kali filter berubah. Filter kabupaten
  // di sini sama dengan kabupaten yang dipilih di peta/tabel.
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

  // Poligon kebakaran dimuat hanya saat layer diaktifkan pertama
  // kali, supaya pembuka peta tidak menunggu 1.814 poligon.
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

  // Pilih kabupaten: ambil profilnya dari API, sekaligus
  // menjadi filter hotspot (lihat efek di atas).
  const selectKabupaten = useCallback(async (nama: string) => {
    setKabupatenFilter(nama)
    setProfileLoading(true)
    try {
      const profile = await fetchKabupatenProfile(nama)
      setSelectedProfile(profile)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSelectedProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }, [])

  const clearSelection = useCallback(() => {
    setKabupatenFilter('')
    setSelectedProfile(null)
  }, [])

  // Handler tunggal untuk dropdown dan klik baris tabel:
  // mengubah filter SEKALIGUS mengambil profil, supaya tidak
  // ada dua jalur yang saling memanggil dan fetch ganda.
  const handleKabupatenFilterChange = useCallback(
    (nama: string) => {
      if (nama === '') {
        clearSelection()
      } else {
        void selectKabupaten(nama)
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
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Peta Sawit dan Kebakaran Riau</h1>
          <p>
            Persebaran sawit rakyat 2024 dan lahan terbakar 2026,
            per kabupaten/kota
          </p>
        </div>
        <p className="api-note">API: {API_URL}</p>
      </header>

      <div className="main">
        <div className="map-wrap">
          <MapView
            kabupatenData={kabupatenData}
            statsByKabupaten={statsByKabupaten}
            mode={mode}
            selectedKabupaten={
              kabupatenFilter === '' ? null : kabupatenFilter
            }
            onSelectKabupaten={(nama) => void selectKabupaten(nama)}
            showKabupaten={showKabupaten}
            showHotspot={showHotspot}
            showKebakaran={showKebakaran}
            hotspotData={hotspotData}
            kebakaranData={kebakaranData}
          />
        </div>

        <Sidebar
          stats={stats}
          statsLoading={statsLoading}
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
        />
      </div>
    </div>
  )
}
