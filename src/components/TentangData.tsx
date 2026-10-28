interface TentangDataProps {
  onBack: () => void
}

// Halaman ini sengaja ditulis manual, bukan diambil dari API,
// karena API tidak punya endpoint metadata. Setiap angka di
// halaman ini harus cocok dengan sumber di bawah. Kalau sumber
// berubah, ubah halaman ini juga.
export default function TentangData(props: TentangDataProps) {
  // Halaman ini lebih panjang dari layar, jadi pembungkusnya yang
  // bisa di-scroll: body sengaja overflow-hidden untuk peta fullscreen.
  return (
    <div className="h-screen overflow-y-auto bg-slate-900 px-4 py-10">
    <main className="max-w-[800px] mx-auto p-8 bg-white/80 backdrop-blur-xl border border-white/70 shadow-[0_24px_60px_0_rgba(15,23,42,0.15)] rounded-2xl leading-relaxed text-slate-900">
      <button
        type="button"
        className="px-4 py-2 rounded-full bg-slate-900 text-white text-[13px] font-semibold hover:bg-slate-700 hover:-translate-y-0.5 cursor-pointer transition-all duration-200"
        onClick={props.onBack}
      >
        Kembali ke peta
      </button>

      <h1 className="text-2xl font-extrabold text-slate-900 mt-4 mb-2">
        Tentang Data
      </h1>
      <p className="text-sm text-slate-800 leading-relaxed">
        Peta ini menampilkan persebaran sawit rakyat dan lahan terbakar
        di Provinsi Riau, per kabupaten/kota. Gunakan angka di halaman
        ini untuk membandingkan antar kabupaten/kota, bukan untuk
        menilai satu kecamatan atau desa, karena data sedetail itu
        tidak tersedia di sumber yang dipakai.
      </p>

      <h2 className="text-[17px] font-bold text-sky-600 mt-6 mb-2">
        Batas kabupaten (12)
      </h2>
      <p className="text-sm text-slate-800 leading-relaxed">
        Sumber: Badan Informasi Geospasial (BIG), batas wilayah
        kabupaten/kota nasional. Nama kabupaten ditulis persis seperti
        kolom WADMKK di data BIG, tanpa awalan &quot;Kota &quot; (jadi
        Dumai dan Pekanbaru, bukan Kota Dumai atau Kota Pekanbaru).
        Penulisan ini disengaja supaya nama di peta cocok dengan
        dokumen resmi, bukan karena datanya kurang.
      </p>

      <h2 className="text-[17px] font-bold text-sky-600 mt-6 mb-2">
        Sawit: choropleth, bukan poligon
      </h2>
      <p className="text-sm text-slate-800 leading-relaxed mb-3">
        Warna peta menunjukkan luas sawit rakyat per kabupaten tahun
        2024, dari Dinas Perkebunan Provinsi Riau, Statistik
        Perkebunan 2024 (ATAP), Tabel 3D. Warna yang lebih gelap
        berarti sawit rakyatnya lebih luas. Angka ini hanya
        perkebunan rakyat, bukan total sawit Riau. Total gabungan
        provinsi (rakyat + perusahaan besar) adalah 3.371.424 ha,
        tapi rincian per kabupaten untuk perusahaan besar tidak
        dipublikasikan, jadi angka di peta ini tidak boleh dilabeli
        &quot;total sawit Riau&quot;.
      </p>
      <p className="text-sm text-slate-800 leading-relaxed">
        Mengapa peta ini tidak menampilkan poligon sawit? Peta
        tutupan lahan KLHK tidak memiliki kelas khusus untuk sawit:
        sawit tercampur dalam kelas &quot;Perkebunan&quot; (kode
        2010), begitu pula data PERKEBUNAN_AR_50K di RBI. Poligon
        dari kelas tersebut mencakup berbagai jenis perkebunan,
        bukan sawit saja, sehingga menampilkannya sebagai poligon
        sawit akan menyesatkan: wilayah yang sebenarnya bukan sawit
        bisa terbaca sebagai kebun sawit. Karena itu, sawit
        ditampilkan sebagai warna per kabupaten dari angka resmi,
        supaya perbandingan antar kabupaten tetap akurat dan tidak
        ada wilayah yang salah dikira kebun sawit.
      </p>

      <h2 className="text-[17px] font-bold text-sky-600 mt-6 mb-2">
        Titik panas: bukan luas terbakar
      </h2>
      <p className="text-sm text-slate-800 leading-relaxed">
        Titik di peta adalah titik panas (hotspot) VIIRS dari NASA
        FIRMS, 1 Januari - 23 Oktober 2026, sudah dipotong tepat
        ke batas Riau. Satu titik berarti satelit mendeteksi panas
        di lokasi itu pada waktu tertentu, bukan berarti ada
        sebidang lahan terbakar seluas titik tersebut. NASA FIRMS
        sendiri tidak menganjurkan menaksir luas terbakar dari
        titik panas, jadi jangan membaca banyaknya titik sebagai
        besarnya luas yang terbakar. Untuk luas, pakai angka lahan
        terbakar di bawah. Warna titik mengikuti confidence FIRMS:
        merah = tinggi, oranye = sedang (nominal), kuning = rendah.
      </p>

      <h2 className="text-[17px] font-bold text-sky-600 mt-6 mb-2">
        Lahan terbakar: tiga angka, jangan dijumlahkan
      </h2>
      <ul className="list-disc pl-5 text-sm text-slate-800 space-y-2 leading-relaxed">
        <li>
          <b>Terbakar BPBD:</b> BPBD Damkar Riau, 1 Januari - 14
          Oktober 2026, dari laporan lapangan (angka berjalan).
          Total yang dikutip 20.691,20 ha, sedangkan jumlah per
          kabupaten di file 20.685 ha (selisih pembulatan berita).
          Rokan Hulu tidak tercantum di rilis ini, jadi nilainya
          kosong. Kosong di sini artinya tidak ada data, bukan nol.
        </li>
        <li>
          <b>Terbakar SiPongi:</b> SiPongi Kemenhut, Januari - Juli
          2026, total Riau 15.738,92 ha. Angka ini dihitung dari
          analisis citra Landsat 8 yang dipadukan dengan data
          titik panas, groundcheck, dan laporan Manggala Agni,
          sehingga metodenya berbeda dari BPBD dan hasilnya tidak
          bisa dijumlahkan dengan angka BPBD. Gunakan angka ini
          untuk gambaran tingkat provinsi, karena angka per
          kabupaten SiPongi belum diimport ke database saat ini,
          jadi kolomnya kosong. Halaman bukti SiPongi:{' '}
          <a
            href="https://sipongi.gakkum.kehutanan.go.id/indikasi-luas-kebakaran"
            className="text-sky-600 underline font-medium hover:text-sky-800"
          >
            sipongi.gakkum.kehutanan.go.id/indikasi-luas-kebakaran
          </a>
          . Halaman itu hanya bukti keberadaan, periode, dan
          metode, bukan tempat unduh poligon.
        </li>
        <li>
          <b>Luas poligon kebakaran:</b> poligon resmi Kemenhut
          dari layanan ArcGIS &quot;Areal Kebakaran Hutan dan
          Lahan Periode Berjalan&quot;, Januari - Juli 2026,
          sudah dipotong ke batas Riau (1.814 poligon). Angka per
          kabupaten dihitung dengan memotong poligon kebakaran ke
          batas tiap kabupaten, lalu menghitung luasnya. Ini angka
          hitung dari poligon, bukan angka resmi BPBD atau
          SiPongi, jadi jangan mencampurnya dengan dua angka
          di atas.
        </li>
      </ul>

      <h2 className="text-[17px] font-bold text-sky-600 mt-6 mb-2">
        Basemap
      </h2>
      <p className="text-sm text-slate-800 leading-relaxed">
        Peta dasar dari OpenStreetMap. Jalan, sungai, dan nama
        tempat berasal dari basemap itu, bukan dari data proyek
        ini. Itulah sebabnya jalan dan sungai tetap terlihat
        meski semua layer data dimatikan.
      </p>
    </main>
    </div>
  )
}
