import type { FeatureCollection } from 'geojson'

// Alamat API dibaca dari file .env (VITE_API_URL).
// Kalau tidak ada .env, pakai localhost:3000 supaya jalan lokal
// tanpa setting apa pun, selama server API Hono sedang jalan.
export const API_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// Satu baris statistik per kabupaten, sesuai /api/stats.
// Angka sudah berupa number (API meng-cast NUMERIC ke float),
// kecuali terbakar_sipongi_ha yang null karena baris SiPongi
// memang belum ada di database, bukan nol.
export interface StatsRow {
  kabupaten: string
  luas_sawit_rakyat_ha: number | null
  produksi_ton: number | null
  petani_kk: number | null
  tahun: number | null
  terbakar_bpbd_ha: number | null
  terbakar_bpbd_periode: string | null
  terbakar_sipongi_ha: number | null
  terbakar_sipongi_periode: string | null
  jumlah_hotspot: number
  luas_poligon_kebakaran_ha: number
}

// Profil satu kabupaten, sesuai /api/kabupaten/:nama.
// Bentuknya satu Feature GeoJSON, propertinya sama dengan StatsRow
// ditambah id dan nama.
export interface KabupatenProfile {
  type: 'Feature'
  geometry: unknown
  properties: {
    id: number
    nama: string
    luas_sawit_rakyat_ha: number | null
    produksi_ton: number | null
    petani_kk: number | null
    tahun: number | null
    terbakar_bpbd_ha: number | null
    terbakar_bpbd_periode: string | null
    terbakar_sipongi_ha: number | null
    terbakar_sipongi_periode: string | null
    jumlah_hotspot: number
    luas_poligon_kebakaran_ha: number
  }
}

// Ambil JSON dari API, lempar pesan yang jelas kalau gagal.
// Pesan ini yang ditampilkan di sidebar, bukan stack trace.
async function fetchJson<T>(path: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`)
  } catch {
    throw new Error(
      `Tidak bisa menghubungi API di ${API_URL}. Pastikan server API jalan (bun run dev di repo api-hono-gis-riau).`,
    )
  }
  if (!response.ok) {
    throw new Error(`API ${path} mengembalikan status ${response.status}.`)
  }
  return (await response.json()) as T
}

export function fetchKabupaten(): Promise<FeatureCollection> {
  return fetchJson<FeatureCollection>('/api/kabupaten')
}

export function fetchStats(): Promise<StatsRow[]> {
  return fetchJson<StatsRow[]>('/api/stats')
}

export function fetchKabupatenProfile(
  nama: string,
): Promise<KabupatenProfile> {
  return fetchJson<KabupatenProfile>(
    `/api/kabupaten/${encodeURIComponent(nama)}`,
  )
}

export interface HotspotFilter {
  kabupaten: string
  dari: string
  sampai: string
}

// Hotspot diambil sebagai FeatureCollection. Parameter yang kosong
// tidak dikirim, supaya API mengembalikan semua data untuk filter itu.
export function fetchHotspots(
  filter: HotspotFilter,
): Promise<FeatureCollection> {
  const params = new URLSearchParams()
  if (filter.kabupaten) params.set('kabupaten', filter.kabupaten)
  if (filter.dari) params.set('dari', filter.dari)
  if (filter.sampai) params.set('sampai', filter.sampai)
  const query = params.toString()
  return fetchJson<FeatureCollection>(
    query ? `/api/hotspots?${query}` : '/api/hotspots',
  )
}

export function fetchKebakaran(): Promise<FeatureCollection> {
  return fetchJson<FeatureCollection>('/api/kebakaran')
}

// Format angka Indonesia: 402868 -> "402.868".
// Nilai null ditampilkan sebagai tanda strip, bukan nol.
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(value)
}

// Format luas desimal dengan 2 angka di belakang koma, misal 997,84.
export function formatDecimal(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2,
  }).format(value)
}
