# 🌟 Personal Portfolio Web

Proyek ini adalah website portofolio statis dan responsif yang dibangun menggunakan HTML5 dan CSS3 murni tanpa *framework* eksternal. Proyek ini dikembangkan sebagai pemenuhan tugas mata kuliah Pemrograman Berbasis Platform (PBP).

* **Nama:** Rama Sanjaya
* **NPM/NIM:** 2506604421
* **Kelas:** PBP - B
* **Live Deployment:** https://rama-sanjaya-myportofolio.pws.cs.ui.ac.id/

---
 
## 🛠️ Panduan Instalasi Lokal (Open-Source Guide)
 
Repositori ini bersifat terbuka. Jika Anda ingin menjalankan, mempelajari, atau memodifikasi proyek ini secara lokal, ikuti langkah-langkah berikut:
 
1. **Clone Repositori:**
   Buka terminal/CMD Anda dan jalankan perintah berikut:
```bash
   git clone https://github.com/ramasanjayadx/myportofolio.git
```
 
2. **Masuk ke Direktori Proyek:**
```bash
   cd myportofolio
```
 
3. **Jalankan Secara Lokal:**
   Karena proyek ini murni HTML/CSS statis tanpa dependency atau proses *build*, Anda cukup membuka file `index.html` langsung di browser. Alternatif lain, gunakan ekstensi **Live Server** (VS Code) agar setiap perubahan kode otomatis ter-*refresh* di browser.
 
---
 
 
# Refleksi & Jawaban Pertanyaan Tugas

### Tugas 1
 
**1. Apakah Anda menggunakan elemen semantik HTML5 seperti `<section>`, `<article>`, atau `<aside>`? Bagaimana elemen tersebut membantu (atau mengapa tidak diperlukan)?**
 
Ya, struktur halaman memakai beberapa `<section>` (pada bagian Profile, Skills, Experience), dan `<footer>`. `<section>` membantu memisahkan halaman menjadi blok tematik yang jelas dan memberi `id` yang langsung bisa ditautkan dari `<nav>`. `<article>` dan `<aside>` tidak figunakan karna tidak ada konten yang benar-benar berdiri sendiri/sampingan di luar konteks halaman utama.
 
**2. Tantangan tata letak responsive apa yang ditemukan, dan bagaimana cara mengevaluasi prioritas elemen?**
 
Tantangan utama ada pada bagian hero (foto + identitas) yang di desktop tersusun dua kolom lewat `grid-template-areas`, lalu urutannya diubah total menjadi satu kolom lewat media query di layar sempit. Evaluasi prioritas dilakukan dengan memisahkan elemen dekoratif (foto, kolom label sejajar) dari elemen berisi informasi inti (bio, skill, deskripsi experience). Elemen dekoratif disusun ulang lebih dulu, sementara teks utama dibiarkan reflow penuh agar tetap mudah dibaca.
 
**3. Batasan apa yang dirasakan dari static web, dan fungsionalitas dinamis apa yang ingin ditambahkan pada iterasi berikutnya?**
 
Karena seluruh konten dihardcode dengan HTML, setiap ada pembaruan kegiatan baru harus mengedit file secara manual dan tidak ada interaktivitas nyata (selain tautan `mailto:`). Untuk iterasi berikutnya, fungsionalitas yang paling ingin disiapkan adalah widget tanya-jawab (ask me) sederhana berbasis pencocokan kata kunci (tanpa AI biar hemat).

---
### Tugas 2

1. Jelaskan alur yang terjadi ketika pengguna membuka halaman portofolio baru, mulai dari permintaan yang diterima proyek hingga data ditampilkan pada *browser*. Dalam jawabanmu, jelaskan peran `urls.py` proyek, `urls.py` aplikasi, *view*, model, dan *template*.
* Ketika pengguna membuka halaman baru, browser akan meminta /project/. Lalu, Django mencocokkan URL tersebut ke portofolio/urls.py yang mengarahkan semua path ke main.urls lewat include(). Selanjutnya, main/urls.py mencocokkan project/ ke fungsi show_project di main/views.py. View ini memanggil Project.objects.all() dari main/models.py untuk mengambil data dari database, lalu membungkusnya dalam context dan merender project.html. Terakhir, template ini melakukan loop untuk menyusun HTML akhir yang dikirim balik ke browser sebagai response.

2. Mengapa data untuk bagian portofolio baru sebaiknya disimpan pada model dan tidak ditulis langsung di dalam *template*? Jelaskan dampaknya terhadap kemudahan pemeliharaan dan pengembangan aplikasi.
* Kalau data ditulis langsung di template (seperti yang dibuat pada tugas 1), setiap ada project/experience baru berarti harus edit HTML secara manual, padahal seharusnya cukup tambah satu baris data. Dengan model, data tersimpan di database dan bisa dimodifikasi/dimanipulasi lewat admin panel atau shell tanpa menyentuh kode tampilan sama sekali. Ini juga menerapkan SRP dimana model mengurus struktur dan validasi data, sedangkan template hanya mengurus cara data ditampilkan. 

3. Apa perbedaan fungsi `makemigrations` dan `migrate` pada Django? Berikan contoh perubahan model yang mengharuskanmu menjalankan kedua perintah tersebut.
* `makemigrations` membaca perubahan pada models.py dan membuat file migration yang mendeskripsikan perubahan skema tersebut. `migrate` kemudian benar-benar menjalankan file migration itu ke database, membuat atau mengubah tabel sesuai definisi di dalamnya. Contohnya seperti kasus penambahan model Project, makemigrations menghasilkan instruksi CreateModel untuk tabel baru, lalu migrate mengeksekusinya sehingga tabel main_project terbentuk di database. 
---

# Pengungkapan Penggunaan AI (AI Disclosure)
Dalam pengembangan website portofolio ini, saya menggunakan **Gemini AI** sebagai *thought partner* dan asisten pendamping untuk mendiskusikan konsep tata letak (CSS Grid/Flexbox) dan mencari solusi atas *bug* tata letak visual. Namun, saya menyadari bahwa AI memiliki keterbatasan kontekstual. Oleh karena itu, saya melakukan analisis kritis terhadap *output* yang dihasilkan AI dan melakukan modifikasi manual secara ekstensif:

## Tugas 1
### 1. Keterbatasan AI pada Pendekatan *Mobile-First* & Skalabilitas
* **Saran AI:** Saat saya meminta panduan untuk membuat *Hero Section* dan form kontak, AI memberikan kode CSS yang menggunakan satuan absolut seperti `width: 600px;` atau membagi kolom secara statis di layar.
* **Analisis Kritis:** Kode yang diberikan AI mengasumsikan layar pengguna adalah layar desktop (*desktop-first bias*). Jika kode tersebut saya gunakan mentah-mentah, website akan mengalami tumpah konten (*overflow*) dan memunculkan *scroll* horizontal di perangkat *mobile*.
* **Perbaikan Manual:** Saya membuang nilai piksel statis tersebut dan membangun ulang strukturnya menggunakan prinsip *Mobile-First*. Saya menerapkan satuan relatif (`%`, `rem`, `vw`), menggunakan `max-width`, serta menulis ulang instruksi *Media Queries* (`@media (min-width: 768px)`) agar tata letak menyesuaikan diri secara mulus di berbagai perangkat.

### 2. Keterbatasan AI pada Aksesibilitas dan *Semantic HTML*
* **Saran AI:** Saat memberikan struktur kerangka HTML untuk komponen daftar proyek dan profil, AI cenderung menghasilkan *Div Soup* (menggunakan tag `<div>` berulang kali) untuk membungkus semua elemen.
* **Analisis Kritis:** AI memprioritaskan "tampilan yang bekerja" di layar, tetapi mengabaikan standar aksesibilitas web dan SEO. *Screen reader* bagi tunanetra akan kesulitan membaca hierarki informasi jika semuanya hanya berupa `<div>`.
* **Perbaikan Manual:** Saya melakukan *refactoring* mandiri pada kerangka HTML tersebut. Saya mengganti div pembungkus utama dengan tag semantik `<main>`, mengubah kartu proyek dari `<div>` menjadi `<article>`, dan memastikan setiap teks di form kontak terhubung dengan benar menggunakan `<label for="...">`.

### 3. Keterbatasan AI dalam Logika Visual Komponen Spesifik (*Timeline*)
* **Saran AI:** Untuk pembuatan garis vertikal riwayat pendidikan, AI menyarankan agar garis diletakkan tepat di tengah layar (`left: 50%`), dengan teks selang-seling di kiri dan kanan.
* **Analisis Kritis:** Logika visual AI terlihat bagus di monitor besar, tetapi sangat buruk untuk UX (*User Experience*) di HP. Teks di layar kecil akan terhimpit menjadi kolom yang sangat sempit dan memanjang ke bawah sehingga sulit dibaca.
* **Perbaikan Manual:** Saya merancang ulang logikanya secara manual menggunakan properti `position: relative` dan `absolute`. Saya memindahkan garis tersebut ke margin kiri penuh (`left: 20px`) dan menambahkan *padding* pada kontainer teks. Desain asimetris ini memastikan keterbacaan yang sangat baik di HP maupun di Laptop.

## Tugas 2
* Pada tugas ini saya menggunakan Gemini AI untuk membantu saya membuat halaman project yang merupakan halaman experience yang dimodifikasi.
* Dikarenakan tidak ada perubahan yang memerlukan input visual, output yang dihasilkan Gemini sudah sangat membantu saya untuk mengembangkan dan menyelesaikan tugas ini.
---

# Link Percakapan Dengan AI
* Tugas 1 : https://share.gemini.google/oTEZk2WsEpOk
* Tugas 2 : https://share.gemini.google/xTg1abUKK8Vz
