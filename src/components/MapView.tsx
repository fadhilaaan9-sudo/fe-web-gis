import type { Feature, FeatureCollection } from 'geojson'
import type { Layer, PathOptions } from 'leaflet'
import { CircleMarker, GeoJSON, MapContainer, Popup, TileLayer, Tooltip } from 'react-leaflet'
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

// Gaya satu poligon kabupaten. Kabupaten yang dipilih
// digarisbawahi tebal supaya kelihatan di antara yang lain.
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
    color: isSelected ? '#b64400' : '#333333',
    weight: isSelected ? 3 : 1,
    fillColor: choroplethColor(
      mode,
      stats?.luas_sawit_rakyat_ha,
      stats?.terbakar_bpbd_ha,
      stats?.luas_poligon_kebakaran_ha,
    ),
    // Mode netral sengaja transparan supaya nama tempat
    // di basemap OSM tetap terbaca lewat poligon.
    fillOpacity: mode === 'netral' ? 0.05 : 0.65,
  }
}

// Format tanggal kebakaran dari kode YYYYMMDD di kolom ket,
// misal 20260211 menjadi 11 Feb 2026. Kalau formatnya tidak
// sesuai, tampilkan apa adanya supaya tidak menyembunyikan data.
function formatKetDate(ket: unknown): string {
  if (typeof ket !== 'string' || ket.length !== 8) return String(ket ?? '-')
  const year = ket.slice(0, 4)
  const month = Number(ket.slice(4, 6))
  const day = ket.slice(6, 8)
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ]
  return `${day} ${months[month - 1] ?? month} ${year}`
}

export default function MapView(props: MapViewProps) {
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

  // Label nama kabupaten menempel permanen di tengah poligon.
  // Klik poligon memilih kabupaten itu dan menampilkan profilnya.
  const onEachKabupaten = (feature: Feature, layer: Layer) => {
    const nama = feature.properties?.['nama'] as string | undefined
    if (nama) {
      layer.bindTooltip(nama, {
        permanent: true,
        direction: 'center',
        className: 'kab-label',
        opacity: 1,
      })
      layer.on('click', () => {
        onSelectKabupaten(nama)
      })
    }
  }

  // Popup poligon kebakaran memakai bindPopup supaya 1.814
  // poligon tidak dirender sebagai komponen React satu per satu.
  const onEachKebakaran = (feature: Feature, layer: Layer) => {
    const p = feature.properties ?? {}
    const luas = formatDecimal(p['luas_ha'] as number | null)
    layer.bindPopup(
      `<b>Areal kebakaran</b><br/>` +
        `Tanggal: ${formatKetDate(p['ket'])}<br/>` +
        `Periode: ${p['periode'] ?? '-'}<br/>` +
        `Nama objek: ${p['namobj'] ?? '-'}<br/>` +
        `Luas poligon: ${luas} ha`,
    )
  }

  return (
    <MapContainer
      center={RIAU_CENTER}
      zoom={7}
      scrollWheelZoom
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {showKabupaten && kabupatenData && (
        <GeoJSON
          // Key berubah saat mode atau pilihan berubah, supaya
          // react-leaflet menggambar ulang gaya choropleth.
          // Tanpa key ini, perubahan warna tidak selalu muncul.
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
            color: '#a50f15',
            weight: 1,
            fillColor: '#fb6a4a',
            fillOpacity: 0.45,
          })}
          onEachFeature={onEachKebakaran}
        />
      )}

      {showHotspot &&
        hotspotData &&
        hotspotData.features.map((feature) => {
          const p = feature.properties ?? {}
          // Posisi titik memakai kolom latitude/longitude, bukan
          // urutan koordinat GeoJSON, supaya tidak tertukar.
          const lat = p['latitude'] as number | undefined
          const lon = p['longitude'] as number | undefined
          const id = p['id'] as number | string | undefined
          if (lat === undefined || lon === undefined) return null
          return (
            <CircleMarker
              key={String(id ?? `${lat}-${lon}`)}
              center={[lat, lon]}
              radius={4}
              pathOptions={{
                color: hotspotColor(p['confidence']),
                fillColor: hotspotColor(p['confidence']),
                fillOpacity: 0.85,
                weight: 1,
              }}
            >
              <Popup>
                <b>Titik panas</b>
                <br />
                Tanggal: {String(p['acq_date'] ?? '-')} {String(p['acq_time'] ?? '')}
                <br />
                Satelit: {String(p['satellite'] ?? '-')}
                <br />
                Confidence: {confidenceLabel(p['confidence'])}
                <br />
                FRP: {String(p['frp'] ?? '-')}
                <br />
                Siang/malam: {String(p['daynight'] ?? '-')}
              </Popup>
              <Tooltip>
                {String(p['acq_date'] ?? '')} - FRP {String(p['frp'] ?? '-')}
              </Tooltip>
            </CircleMarker>
          )
        })}
    </MapContainer>
  )
}
