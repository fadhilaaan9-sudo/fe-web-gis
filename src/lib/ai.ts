// Client streaming untuk endpoint AI.
// Tugas file ini hanya: kirim pertanyaan, baca SSE, dan panggil callback.
// Semua angka dan narasi tetap diproduksi backend, bukan di sini.

import { API_URL, type StatsRow } from './api'

export interface AiDataEvent {
  rows: StatsRow[]
  kabupatenSorot: string[]
  sources: { label: string; detail: string }[]
}

export interface AiStreamCallbacks {
  onData: (data: AiDataEvent) => void
  onToken: (text: string) => void
  onDone: () => void
  onError: (message: string) => void
}

export const PERTANYAAN_CEPAT: string[] = [
  'Kabupaten mana yang paling banyak hotspot 2026?',
  'Kabupaten mana yang luas sawit rakyatnya terbesar?',
  'Berapa luas terbakar di Siak menurut BPBD dan SiPongi?',
  'Ringkas kondisi sawit dan kebakaran di Riau.',
]

/**
 * Kirim pertanyaan ke POST /api/ai/ask dan baca stream SSE-nya.
 * Kalau koneksi putus di tengah, token yang sudah tampil tetap dipertahankan
 * dan pesan error ditampilkan di bawahnya, bukan menghapus jawaban.
 */
export async function streamAiAsk(
  pertanyaan: string,
  callbacks: AiStreamCallbacks,
): Promise<void> {
  let response: Response
  try {
    response = await fetch(`${API_URL}/api/ai/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pertanyaan }),
    })
  } catch {
    callbacks.onError(
      `Tidak bisa menghubungi API di ${API_URL}. Pastikan server API jalan (bun run dev di repo api-hono-gis-riau).`,
    )
    return
  }

  if (!response.ok) {
    let pesan = `API AI mengembalikan status ${response.status}.`
    try {
      const data = (await response.json()) as { error?: string }
      if (data.error) pesan = data.error
    } catch {
      // Biarkan pesan default kalau body bukan JSON.
    }
    callbacks.onError(pesan)
    return
  }
  if (!response.body) {
    callbacks.onError('Server tidak mengirim stream jawaban.')
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      // Event SSE dipisah baris kosong, tiap event diawali "data: ".
      const potongan = buffer.split('\n\n')
      buffer = potongan.pop() ?? ''
      for (const event of potongan) {
        const baris = event.split('\n').find((line) => line.startsWith('data: '))
        if (!baris) continue
        const payload = JSON.parse(baris.slice(6)) as
          | { type: 'data'; rows: StatsRow[]; kabupatenSorot: string[]; sources: AiDataEvent['sources'] }
          | { type: 'token'; text: string }
          | { type: 'done' }
          | { type: 'error'; message: string }
        if (payload.type === 'data') {
          callbacks.onData({
            rows: payload.rows,
            kabupatenSorot: payload.kabupatenSorot,
            sources: payload.sources,
          })
        } else if (payload.type === 'token') {
          callbacks.onToken(payload.text)
        } else if (payload.type === 'error') {
          callbacks.onError(payload.message)
          return
        } else if (payload.type === 'done') {
          callbacks.onDone()
          return
        }
      }
    }
    callbacks.onDone()
  } catch {
    callbacks.onError('Stream jawaban terputus. Coba kirim pertanyaan lagi.')
  } finally {
    reader.releaseLock()
  }
}
