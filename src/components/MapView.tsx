import { memo } from 'react'
import type { Feature, FeatureCollection } from 'geojson'
import { latLng, type Layer, type Path, type PathOptions } from 'leaflet'
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Popup,
  TileLayer,
  Tooltip,
  ZoomControl,
} from 'react-leaflet'
import { formatDecimal, type StatsRow } from '../lib/api'
import {
  choroplethColor,
  confidenceLabel,
  hotspotColor,
  type ChoroplethMode,
} from '../lib/colors'

interface MapViewProps {
  kabupatenData: FeatureCollection | null
  statsByKabupaten: Record<string, StatsRow>
  mode: ChoroplethMode
  selectedKabupaten: string | null
  onSelectKabupaten: (nama: string) => void
  showKabupaten: boolean
  showHotspot: boolean
  showKebakaran: boolean
  hotspotData: FeatureCollection | null
  kebakaranData: FeatureCollection | null
}

// Pusat peta Riau: sekitar Pekanbaru, zoom 7 mencakup
// seluruh provinsi (99-104 BT, -1,5 sampai 2,9 LU).
const RIAU_CENTER: [number, number] = [0.7, 101.9]

// Titik tengah visual daratan (visual center) untuk 12 kabupaten/kota di Provinsi Riau.
// Koordinat ini memastikan posisi label teks tepat berada di tengah daratan utama masing-masing,
// dan tidak bergeser ke laut/selat atau menumpuk di perbatasan kabupaten lain akibat
// perhitungan bounding box bawaan Leaflet pada poligon tidak beraturan / kepulauan.
const KABUPATEN_VISUAL_CENTERS: Record<string, [number, number]> = {
  'Kampar': [0.30, 101.08], // Daratan barat Kampar (Bangkinang), rapi terpisah dari Pekanbaru
  'Pekanbaru': [0.53, 101.44], // Kota Pekanbaru
  'Siak': [0.82, 101.90], // Tengah wilayah Siak Sri Indrapura
  'Pelalawan': [0.25, 102.05], // Tengah daratan Pelalawan (Pangkalan Kerinci)
  'Bengkalis': [1.35, 101.45], // Daratan utama Bengkalis (Duri / Mandau)
  'Dumai': [1.67, 101.44], // Kota Dumai
  'Rokan Hilir': [1.95, 100.80], // Tengah Rokan Hilir (Bagan Sinembah / Kubu)
  'Rokan Hulu': [0.88, 100.52], // Tengah Rokan Hulu (Pasir Pengaraian)
  'Kuantan Singingi': [-0.50, 101.42], // Tengah Kuansing (Teluk Kuantan)
  'Indragiri Hulu': [-0.55, 102.25], // Tengah Inhu (Rengat / Seberida)
  'Indragiri Hilir': [-0.38, 103.08], // Tengah daratan Inhil (Tembilahan)
  'Kepulauan Meranti': [0.98, 102.72], // Pulau Tebing Tinggi (Selatpanjang)
}

function getVisualCenter(nama: string | undefined): [number, number] | null {
  if (!nama) return null
  const clean = nama.trim().toLowerCase()
  for (const [key, coords] of Object.entries(KABUPATEN_VISUAL_CENTERS)) {
    if (key.toLowerCase() === clean) return coords
  }
  return null
}

// Gaya satu poligon kabupaten.
function kabupatenStyle(
  feature: Feature | undefined,
  mode: ChoroplethMode,
  statsByKabupaten: Record<string, StatsRow>,
  selectedKabupaten: string | null,
): PathOptions {
  const nama = feature?.properties?.['nama'] as string | undefined
  const stats = nama ? statsByKabupaten[nama] : undefined
  const isSelected = nama !== undefined && nama === selectedKabupaten
  return {
    color: isSelected ? '#ea580c' : '#334155',
    weight: isSelected ? 3.5 : 1.5,
    fillColor: choroplethColor(
      mode,
      stats?.luas_sawit_rakyat_ha,
      stats?.terbakar_bpbd_ha,
      stats?.luas_poligon_kebakaran_ha,
    ),
    // Mode netral transparan agar nama basemap OSM tetap terbaca
    fillOpacity: mode === 'netral' ? 0.08 : 0.68,
    className: 'clickable-kabupaten-path',
  }
}

// Format tanggal kebakaran dari kode YYYYMMDD di kolom ket
function formatKetDate(ket: unknown): string {
  if (typeof ket !== 'string' || ket.length !== 8) return String(ket ?? '-')
  const year = ket.slice(0, 4)
  const month = Number(ket.slice(4, 6))
  const day = ket.slice(6, 8)
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ]
  return `${day} ${months[month - 1] ?? month} ${year}`
}

function MapView(props: MapViewProps) {
  const {
    kabupatenData,
    statsByKabupaten,
    mode,
    selectedKabupaten,
    onSelectKabupaten,
    showKabupaten,
    showHotspot,
    showKebakaran,
    hotspotData,
    kebakaranData,
  } = props

  // Interaktivitas poligon kabupaten:
  // - Tooltip permanen elegan dengan petunjuk klik
  // - Efek hover (garis biru menyala + kursor pointer) agar user tahu bisa diklik
  // - Klik membuka profil dan modal kabupaten
  const onEachKabupaten = (feature: Feature, layer: Layer) => {
    const nama = feature.properties?.['nama'] as string | undefined
    if (nama) {
      const visualCenter = getVisualCenter(nama)
      if (visualCenter) {
        ;(layer as { getCenter?: () => unknown }).getCenter = () =>
          latLng(visualCenter[0], visualCenter[1])
      }

      layer.bindTooltip(
        `<span class="font-bold text-[12px] md:text-[13px] text-slate-900 tracking-tight select-none pointer-events-none drop-shadow-[0_0_3px_#fff]">
           ${nama}
         </span>`,
        {
          permanent: true,
          direction: 'center',
          className: 'kab-glass-label',
          opacity: 1,
        },
      )

      layer.on({
        mouseover: (e) => {
          const l = e.target as Path
          l.setStyle({
            weight: 3.5,
            color: '#0284c7',
            fillOpacity: mode === 'netral' ? 0.25 : 0.88,
          })
          if ('bringToFront' in l) {
            ;(l as { bringToFront: () => void }).bringToFront()
          }
        },
        mouseout: (e) => {
          const l = e.target as Path
          const isSelected = nama === selectedKabupaten
          const stats = statsByKabupaten[nama]
          l.setStyle({
            color: isSelected ? '#ea580c' : '#334155',
            weight: isSelected ? 3.5 : 1.5,
            fillColor: choroplethColor(
              mode,
              stats?.luas_sawit_rakyat_ha,
              stats?.terbakar_bpbd_ha,
              stats?.luas_poligon_kebakaran_ha,
            ),
            fillOpacity: mode === 'netral' ? 0.08 : 0.68,
          })
        },
        click: () => {
          onSelectKabupaten(nama)
        },
      })
    }
  }

  // Popup poligon kebakaran
  const onEachKebakaran = (feature: Feature, layer: Layer) => {
    const p = feature.properties ?? {}
    const luas = formatDecimal(p['luas_ha'] as number | null)
    layer.bindPopup(
      `<div class="text-xs text-slate-600 leading-snug">
        <h4 class="font-bold text-[13px] text-slate-900 pb-1 mb-1.5 border-b border-slate-200">Areal Kebakaran</h4>
        <p class="my-0.5"><b class="text-slate-900">Tanggal:</b> ${formatKetDate(p['ket'])}</p>
        <p class="my-0.5"><b class="text-slate-900">Periode:</b> ${p['periode'] ?? '-'}</p>
        <p class="my-0.5"><b class="text-slate-900">Objek:</b> ${p['namobj'] ?? '-'}</p>
        <p class="my-0.5"><b class="text-slate-900">Luas:</b> ${luas} ha</p>
      </div>`,
    )
  }

  // Hotspot dirender di canvas, bukan ribuan elemen SVG, supaya peta
  // tidak lag saat digeser atau di-zoom.
  return (
    <MapContainer
      center={RIAU_CENTER}
      zoom={7}
      preferCanvas
      scrollWheelZoom
      zoomControl={false}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ZoomControl position="bottomright" />

      {showKabupaten && kabupatenData && (
        <GeoJSON
          key={`kab-${mode}-${selectedKabupaten ?? 'none'}`}
          data={kabupatenData}
          style={(feature) =>
            kabupatenStyle(feature, mode, statsByKabupaten, selectedKabupaten)
          }
          onEachFeature={onEachKabupaten}
        />
      )}

      {showKebakaran && kebakaranData && (
        <GeoJSON
          key="kebakaran"
          data={kebakaranData}
          style={() => ({
            color: '#b91c1c',
            weight: 1.5,
            fillColor: '#ef4444',
            fillOpacity: 0.5,
          })}
          onEachFeature={onEachKebakaran}
        />
      )}

      {showHotspot &&
        hotspotData &&
        hotspotData.features.map((feature) => {
          const p = feature.properties ?? {}
          const lat = p['latitude'] as number | undefined
          const lon = p['longitude'] as number | undefined
          const id = p['id'] as number | string | undefined
          if (lat === undefined || lon === undefined) return null
          return (
            <CircleMarker
              key={String(id ?? `${lat}-${lon}`)}
              center={[lat, lon]}
              radius={5}
              pathOptions={{
                color: '#ffffff',
                fillColor: hotspotColor(p['confidence']),
                fillOpacity: 0.9,
                weight: 1.5,
              }}
            >
              <Popup>
                <div className="text-xs text-slate-600 leading-snug">
                  <h4 className="font-bold text-[13px] text-slate-900 pb-1 mb-1.5 border-b border-slate-200">
                    Titik Panas (Hotspot)
                  </h4>
                  <p className="my-0.5">
                    <b className="text-slate-900">Waktu:</b>{' '}
                    {String(p['acq_date'] ?? '-')} {String(p['acq_time'] ?? '')}
                  </p>
                  <p className="my-0.5">
                    <b className="text-slate-900">Satelit:</b>{' '}
                    {String(p['satellite'] ?? '-')}
                  </p>
                  <p className="my-0.5">
                    <b className="text-slate-900">Tingkat Kepercayaan:</b>{' '}
                    {confidenceLabel(p['confidence'])}
                  </p>
                  <p className="my-0.5">
                    <b className="text-slate-900">FRP:</b>{' '}
                    {String(p['frp'] ?? '-')} MW
                  </p>
                  <p className="my-0.5">
                    <b className="text-slate-900">Siang/Malam:</b>{' '}
                    {String(p['daynight'] ?? '-')}
                  </p>
                </div>
              </Popup>
              <Tooltip>
                {String(p['acq_date'] ?? '')} &bull; FRP{' '}
                {String(p['frp'] ?? '-')} MW
              </Tooltip>
            </CircleMarker>
          )
        })}
    </MapContainer>
  )
}

// Dibungkus memo supaya peta tidak dirender ulang saat App berubah
// karena state yang tidak berhubungan dengan peta (panel AI dibuka,
// sidebar dibuka, modal dibuka). Marker hotspot 6.484 titik hanya
// dibuat ulang kalau hotspotData-nya sendiri berubah.
export default memo(MapView)
