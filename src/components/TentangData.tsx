interface TentangDataProps {
  onBack: () => void
}

// Halaman ini sengaja ditulis manual, bukan diambil dari API,
// karena API tidak punya endpoint metadata. Setiap angka di
// halaman ini harus cocok dengan sumber di bawah. Kalau sumber
// berubah, ubah halaman ini juga.
export default function TentangData(props: TentangDataProps) {
  return (
    <main className="tentang">
      <button type="button" onClick={props.onBack}>
        Kembali ke peta
      </button>
      <h1>Tentang Data</h1>
      <p>
        Peta ini menampilkan persebaran sawit dan lahan terbakar di
        Provinsi Riau, di level kabupaten/kota saja. Tidak ada
        drill-down kecamatan atau desa.
      </p>

      <h2>Batas kabupaten (12)</h2>
      <p>
        Sumber: Badan Informasi Geospasial (BIG), batas wilayah
        kabupaten/kota nasional. Nama kabupaten memakai kolom WADMKK
        apa adanya, tanpa awalan &quot;Kota &quot; (jadi Dumai dan
        Pekanbaru, bukan Kota Dumai atau Kota Pekanbaru).
      </p>

      <h2>Sawit: choropleth, bukan poligon</h2>
      <p>
        Yang ditampilkan sebagai warna peta adalah luas sawit
        rakyat per kabupaten tahun 2024, dari Dinas Perkebunan
        Provinsi Riau, Statistik Perkebunan 2024 (ATAP), Tabel 3D.
        Ini HANYA perkebunan rakyat, bukan total sawit Riau.
        Total gabungan provinsi (rakyat + perusahaan besar)
        3.371.424 ha, tapi rincian per kabupaten untuk perusahaan
        besar tidak dipublikasikan, jadi jangan pernah melabeli
        angka ini &quot;total sawit Riau&quot;.
      </p>
      <p>
        Alasan tidak memakai poligon sawit: tutupan lahan KLHK
        tidak punya kelas khusus sawit. Sawit masuk kelas campuran
        &quot;Perkebunan&quot; (kode 2010), sama jebakannya dengan
        PERKEBUNAN_AR_50K di RBI. Melabeli poligon Perkebunan
        sebagai sawit adalah salah.
      </p>

      <h2>Titik panas: bukan luas terbakar</h2>
      <p>
        Titik di peta adalah titik panas (hotspot) VIIRS dari NASA
        FIRMS, 1 Januari - 23 Oktober 2026, sudah dipotong tepat
        ke batas Riau. Titik panas BUKAN luas terbakar, dan NASA
        FIRMS sendiri tidak menganjurkan menaksir luas terbakar
        dari titik panas. Warna titik dari confidence FIRMS:
        merah = tinggi, oranye = sedang (nominal), kuning = rendah.
      </p>

      <h2>Lahan terbakar: tiga angka, jangan dijumlahkan</h2>
      <ul>
        <li>
          <b>Terbakar BPBD:</b> BPBD Damkar Riau, 1 Januari - 14
          Oktober 2026 (angka berjalan, laporan lapangan). Total
          yang dikutip 20.691,20 ha, sedangkan jumlah per kabupaten
          di file 20.685 ha (selisih pembulatan berita). Rokan Hulu
          tidak tercantum di rilis ini, jadi nilainya kosong,
          bukan nol.
        </li>
        <li>
          <b>Terbakar SiPongi:</b> SiPongi Kemenhut, Januari - Juli
          2026, total Riau 15.738,92 ha, metode analisis citra
          Landsat 8 ditumpuk data titik panas + groundcheck +
          laporan Manggala Agni. Di database saat ini, angka
          per kabupaten SiPongi BELUM diimport, jadi kolomnya
          kosong. Halaman bukti SiPongi:{' '}
          <a href="https://sipongi.gakkum.kehutanan.go.id/indikasi-luas-kebakaran">
            sipongi.gakkum.kehutanan.go.id/indikasi-luas-kebakaran
          </a>
          . Halaman itu hanya bukti keberadaan, periode, dan
          metode, BUKAN tempat unduh poligon.
        </li>
        <li>
          <b>Luas poligon kebakaran:</b> poligon resmi Kemenhut
          dari layanan ArcGIS &quot;Areal Kebakaran Hutan dan
          Lahan Periode Berjalan&quot;, Januari - Juli 2026,
          sudah dipotong ke batas Riau (1.814 poligon). Angka per
          kabupaten dihitung di PostGIS dengan memotong poligon
          ke batas kabupaten (ST_Intersection) lalu menghitung
          luas geography. Ini angka hitung dari poligon, bukan
          angka resmi BPBD atau SiPongi.
        </li>
      </ul>

      <h2>Basemap</h2>
      <p>
        Peta dasar dari OpenStreetMap. Jalan, sungai, dan nama
        tempat berasal dari basemap itu, bukan dari data proyek
        ini.
      </p>
    </main>
  )
}
