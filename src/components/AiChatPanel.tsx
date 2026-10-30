// Panel chat AI: tampilan saja, tanpa logika AI.
// Logika streaming ada di lib/ai.ts, angka ada di backend.
// Panel ini memakai gaya glass yang sama dengan header dan sidebar.

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Send, X } from 'lucide-react'
import {
  PERTANYAAN_CEPAT,
  streamAiAsk,
  type AiDataEvent,
} from '../lib/ai'
import { formatDecimal, formatNumber, type StatsRow } from '../lib/api'

interface ChatMessage {
  role: 'user' | 'ai'
  text: string
  rows?: StatsRow[]
  sources?: AiDataEvent['sources']
}

interface AiChatPanelProps {
  isOpen: boolean
  onClose: () => void
  /** Dipanggil dengan kabupaten pertama dari jawaban, supaya peta ikut menyorot. */
  onHighlight: (nama: string) => void
}

// Renderer markdown mini dan aman untuk narasi AI.
// Model Groq secara alami menulis markdown: **tebal** dan daftar "- ".
// Panel lama menampilkan teks mentah, jadi ** ikut tampil di layar.
// Fungsi ini mengubah **tebal** menjadi <strong> dan "- " menjadi <ul>,
// tanpa memakai dangerouslySetInnerHTML, jadi HTML dari model tidak bisa dieksekusi.
// Sengaja hanya mendukung tebal dan daftar, karena itu saja yang dipakai narasi.
function renderBarisDenganTebal(baris: string, kunci: string): ReactNode[] {
  const bagian = baris.split(/(\*\*[^*]+\*\*)/g)
  return bagian.map((potong, i) => {
    if (potong.startsWith('**') && potong.endsWith('**') && potong.length > 4) {
      return <strong key={`${kunci}-${i}`}>{potong.slice(2, -2)}</strong>
    }
    return <span key={`${kunci}-${i}`}>{potong}</span>
  })
}

function renderNarasi(teks: string): ReactNode[] {
  const hasil: ReactNode[] = []
  let daftar: string[] = []
  const keluarkanDaftar = () => {
    if (daftar.length === 0) return
    const isi = daftar
    daftar = []
    hasil.push(
      <ul key={`ul-${hasil.length}`} className="list-disc pl-5 space-y-0.5">
        {isi.map((item, i) => (
          <li key={i}>{renderBarisDenganTebal(item, `li-${hasil.length}-${i}`)}</li>
        ))}
      </ul>,
    )
  }
  teks.split('\n').forEach((baris, index) => {
    const bersih = baris.trim()
    if (bersih.startsWith('- ')) {
      daftar.push(bersih.slice(2))
      return
    }
    keluarkanDaftar()
    if (bersih === '') {
      hasil.push(<div key={`sp-${index}`} className="h-2" />)
      return
    }
    hasil.push(<p key={`p-${index}`}>{renderBarisDenganTebal(baris, `p-${index}`)}</p>)
  })
  keluarkanDaftar()
  return hasil
}

// Kalimat mikir yang berputar selama AI belum mengirim token pertama.
// Tujuannya supaya menunggu terasa hidup, bukan bubble kosong + satu kalimat statis.
const KALIMAT_MIKIR: string[] = [
  'AI sedang mengambil data...',
  'Sedang menghitung hotspot per kabupaten...',
  'Membuka peta Riau, mencari sawit terbanyak...',
  'Memeriksa BPBD dan SiPongi, biar tidak tercampur...',
  'Merangkai jawaban dari angka database, bukan karangan...',
  'Sedang menyorot kabupatennya di peta...',
  'Menghitung luas sawit, sabar ya, datanya 12 kabupaten...',
  'Hampir jadi, tinggal merapikan jawabannya...',
]

export default function AiChatPanel({ isOpen, onClose, onHighlight }: AiChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [indeksMikir, setIndeksMikir] = useState(0)
  const daftarRef = useRef<HTMLDivElement>(null)

  // Antrean pacing: Groq mengirim token sangat cepat dalam chunk besar,
  // jadi token tidak langsung ditampilkan. Token ditampung di sini lalu
  // dikeluarkan satu potong tiap 35ms, supaya di layar terasa mengalir
  // seperti diketik, bukan muncul sekaligus. Backend tetap streaming asli.
  const tokenQueueRef = useRef<string[]>([])
  const drainTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamDoneRef = useRef(false)

  // Data tabel ditunda: event data dari backend memang datang duluan,
  // tapi kalau langsung ditampilkan, tabel muncul duluan lalu teks di atasnya
  // mengalir dan mendorong tabel ke bawah. Jadi data disimpan di sini dulu,
  // dan baru ditempel ke pesan setelah narasi selesai diketik.
  const pendingDataRef = useRef<AiDataEvent | null>(null)

  function tampilkanTabelTertunda() {
    const data = pendingDataRef.current
    if (!data) return
    pendingDataRef.current = null
    setMessages((prev) => {
      const salinan = [...prev]
      const terakhir = salinan[salinan.length - 1]
      if (terakhir && terakhir.role === 'ai') {
        salinan[salinan.length - 1] = { ...terakhir, rows: data.rows, sources: data.sources }
      }
      return salinan
    })
  }

  function hentikanDrain() {
    if (drainTimerRef.current) {
      clearInterval(drainTimerRef.current)
      drainTimerRef.current = null
    }
  }

  function mulaiDrain() {
    if (drainTimerRef.current) return
    drainTimerRef.current = setInterval(() => {
      const potong = tokenQueueRef.current.shift()
      if (potong === undefined) {
        // Antrean habis dan stream sudah selesai: tampilkan tabel dulu,
        // baru berhenti loading, supaya urutannya teks dulu, tabel belakangan.
        if (streamDoneRef.current) {
          tampilkanTabelTertunda()
          hentikanDrain()
          setLoading(false)
        }
        return
      }
      setMessages((prev) => {
        const salinan = [...prev]
        const terakhir = salinan[salinan.length - 1]
        if (terakhir && terakhir.role === 'ai') {
          salinan[salinan.length - 1] = { ...terakhir, text: terakhir.text + potong }
        }
        return salinan
      })
    }, 35)
  }

  // Selalu scroll ke pesan terbaru saat token mengalir.
  useEffect(() => {
    daftarRef.current?.scrollTo({ top: daftarRef.current.scrollHeight })
  }, [messages])

  // Bersihkan timer kalau panel dilepas dari layar.
  useEffect(() => () => hentikanDrain(), [])

  // Selama loading, ganti kalimat mikir tiap 1,8 detik.
  useEffect(() => {
    if (!loading) return
    const timer = setInterval(() => {
      setIndeksMikir((prev) => (prev + 1) % KALIMAT_MIKIR.length)
    }, 1800)
    return () => clearInterval(timer)
  }, [loading])

  if (!isOpen) return null

  async function kirim(pertanyaan: string) {
    const bersih = pertanyaan.trim()
    if (!bersih || loading) return
    setError(null)
    setInput('')
    hentikanDrain()
    tokenQueueRef.current = []
    pendingDataRef.current = null
    streamDoneRef.current = false
    setIndeksMikir(0)
    setLoading(true)
    setMessages((prev) => [...prev, { role: 'user', text: bersih }, { role: 'ai', text: '' }])

    await streamAiAsk(bersih, {
      onData: (data) => {
        // Sorot peta langsung (ini tidak mengganggu teks), tapi tabel
        // jangan langsung ditampilkan. Simpan dulu, tampilkan belakangan
        // setelah narasi selesai, supaya tidak muncul duluan.
        if (data.kabupatenSorot.length > 0) onHighlight(data.kabupatenSorot[0])
        pendingDataRef.current = data
      },
      onToken: (teks) => {
        // Jangan tampilkan langsung, masukkan antrean pacing dulu.
        tokenQueueRef.current.push(teks)
        mulaiDrain()
      },
      onDone: () => {
        streamDoneRef.current = true
        // Kalau antrean sudah kosong, berhenti sekarang juga.
        // Kalau masih ada sisa, interval di atas yang akan menghentikannya
        // setelah antrean habis, supaya teks terakhir tidak terpotong.
        if (tokenQueueRef.current.length === 0) {
          tampilkanTabelTertunda()
          hentikanDrain()
          setLoading(false)
        }
      },
      onError: (pesan) => {
        hentikanDrain()
        tokenQueueRef.current = []
        pendingDataRef.current = null
        // Kalau pesan AI masih kosong (gagal sebelum token pertama),
        // hapus bubble kosongnya, supaya tidak tersisa border kosong.
        setMessages((prev) => {
          const terakhir = prev[prev.length - 1]
          if (terakhir && terakhir.role === 'ai' && terakhir.text === '' && !terakhir.rows) {
            return prev.slice(0, -1)
          }
          return prev
        })
        setError(pesan)
        setLoading(false)
      },
    })
  }

  return (
    <div className="absolute bottom-24 right-4 z-[1200] w-[min(92vw,380px)] pointer-events-auto">
      <div className="flex flex-col max-h-[70vh] rounded-2xl bg-white/90 backdrop-blur-xl border border-white/70 shadow-[0_12px_36px_0_rgba(15,23,42,0.18)] overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-200/70">
          <div className="flex items-center gap-2">
            {/* Logo resmi pin belah daun/api, sama dengan favicon dan brand header. */}
            <img
              src="/favicon.svg"
              alt=""
              aria-hidden="true"
              className="h-[18px] w-[18px] drop-shadow-sm"
            />
            <div>
              <p className="text-[14px] font-bold text-slate-900 leading-tight">Tanya AI WebGIS</p>
              <p className="text-[11px] text-slate-500 leading-tight">
                Jawaban dirangkai dari data database, bukan karangan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panel AI"
            className="flex items-center justify-center w-8 h-8 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-900/5 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div ref={daftarRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <div className="space-y-2">
              <p className="text-[13px] text-slate-600">
                Coba salah satu pertanyaan ini, atau tulis pertanyaanmu sendiri dalam Bahasa
                Indonesia:
              </p>
              <div className="flex flex-wrap gap-2">
                {PERTANYAAN_CEPAT.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => void kirim(item)}
                    className="px-3 py-1.5 rounded-full bg-slate-900/5 hover:bg-slate-900/10 text-[12px] font-medium text-slate-800 cursor-pointer text-left"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((pesan, index) => (
            <div
              key={index}
              className={`max-w-[90%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                pesan.role === 'user'
                  ? 'ml-auto bg-slate-900 text-white'
                  : 'bg-white border border-slate-200/80 text-slate-800'
              }`}
            >
              {!pesan.text && pesan.role === 'ai' && loading && (
                <p className="text-slate-500 animate-pulse">{KALIMAT_MIKIR[indeksMikir]}</p>
              )}
              {pesan.text &&
                (pesan.role === 'ai' ? (
                  <div className="space-y-1">{renderNarasi(pesan.text)}</div>
                ) : (
                  <p className="whitespace-pre-wrap">{pesan.text}</p>
                ))}
              {pesan.role === 'ai' && pesan.rows && pesan.rows.length > 0 && (
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="text-left text-slate-500">
                        <th className="pr-2 py-1">Kabupaten</th>
                        <th className="pr-2 py-1">Hotspot</th>
                        <th className="pr-2 py-1">Sawit (ha)</th>
                        <th className="py-1">Terbakar BPBD (ha)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pesan.rows.map((row) => (
                        <tr key={row.kabupaten} className="border-t border-slate-100">
                          <td className="pr-2 py-1 font-semibold">{row.kabupaten}</td>
                          <td className="pr-2 py-1">{formatNumber(row.jumlah_hotspot)}</td>
                          <td className="pr-2 py-1">{formatNumber(row.luas_sawit_rakyat_ha)}</td>
                          <td className="py-1">{formatDecimal(row.terbakar_bpbd_ha)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Nilai - artinya tidak ada data, bukan 0. BPBD dan SiPongi ditampilkan
                    terpisah di jawaban.
                  </p>
                </div>
              )}
              {pesan.role === 'ai' && pesan.sources && (
                <p className="mt-2 text-[11px] text-slate-500">
                  Sumber: {pesan.sources.map((s) => s.label).join(', ')}
                </p>
              )}
            </div>
          ))}
          {/* Kalimat mikir sekarang ada di dalam bubble AI, bukan di sini. */}
          {error && <p className="text-[13px] text-red-600">{error}</p>}
        </div>

        <form
          className="flex items-center gap-2 px-3 py-3 border-t border-slate-200/70"
          onSubmit={(e) => {
            e.preventDefault()
            void kirim(input)
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanya soal sawit atau kebakaran Riau..."
            aria-label="Pertanyaan untuk AI"
            className="flex-1 min-w-0 px-3 py-2 rounded-full border border-slate-200 bg-white text-[13px] text-slate-900 outline-none focus:border-slate-400"
          />
          <button
            type="submit"
            disabled={loading || input.trim() === ''}
            aria-label="Kirim pertanyaan"
            className="flex items-center justify-center w-10 h-10 shrink-0 rounded-full bg-slate-900 text-white disabled:opacity-40 cursor-pointer"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}
