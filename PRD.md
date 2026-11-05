# Product Requirements Document: CampusSprint

## 1. Product Overview
- **Product Vision:** Aplikasi manajemen tugas mobile-first yang sangat ringan, didesain untuk membantu mahasiswa memantau prioritas akademik dan proyek coding secara instan saat mobilitas tinggi tanpa friksi antarmuka yang kompleks.
- **Target Users:** 
  - Mahasiswa ilmu komputer / rekayasa perangkat lunak dengan jadwal padat dan mobilitas tinggi.
  - Tim pengembang proyek kampus skala kecil yang membutuhkan tracking prototipe cepat.
- **Business / Academic Objectives:**
  - Memenuhi capaian tugas Agile & Kanban Board dengan visualisasi alur kerja yang jelas.
  - Memangkas waktu pencatatan dan update status tugas menjadi kurang dari 3 detik via interaksi mobile-friendly.
- **Success Metrics:**
  - **Usability Benchmark:** Pengguna dapat membuat tugas baru dan mengubah status alur kerja dalam < 3 ketukan (taps).
  - **Load Speed:** Waktu muat awal (First Contentful Paint) < 1.0 detik saat diakses online di Vercel.
  - **Retention & Reliability:** Tidak ada kehilangan data saat aplikasi ditutup/direfresh berkat persistensi browser storage.

---

## 2. User Research & UX Flows
### User Personas & Pain Points
- **Persona:** Radja (Mahasiswa Software Engineering, 20 tahun)
  - **Karakteristik:** Sering berpindah kelas/lab, mengakses sistem lewat smartphone, mengerjakan multiple task (kuliah, organisasi, project coding).
  - **Pain Points:** 
    - Aplikasi manajemen proyek seperti Jira atau Trello versi mobile terasa berat, lambat dibuka saat sinyal tidak stabil, dan interaksi drag-and-drop sering meleset di layar smartphone kecil.
    - Sering bingung menentukan tugas mana yang harus diselesaikan lebih dulu di tengah jadwal padat.
  - **Key Quote:** *"Aku cuma butuh buka HP 5 detik, tahu apa prioritas utama hari ini, dan sekali tap untuk ubah status tugas selesai."*

### User Flows
- **Flow 1: Quick Add & Prioritization**
  1. Pengguna membuka aplikasi CampusSprint di browser mobile / Vercel.
  2. Klik tombol floating `+ New Task`.
  3. Masukkan judul tugas, pilih prioritas (`High`, `Medium`, `Low`), dan deadline singkat.
  4. Klik `Add Task` -> Tugas otomatis masuk ke kolom `To do`.
- **Flow 2: Tap-to-Change Status (No Drag-and-Drop)**
  1. Pengguna melihat kartu tugas di kolom `To do`.
  2. Pengguna menekan tombol aksi cepat pada kartu (misal panah maju `->` atau menu tap status).
  3. Status langsung berpindah secara mulus ke `In progress`.
  4. Dari `In progress`, satu tap lagi memindahkannya ke kolom `Done`.
  - *Alternative/Error Path:* Pengguna salah tap -> Tersedia tombol `<-` untuk mengembalikan status ke kolom sebelumnya, atau opsi `Delete`.
- **UX Requirements:**
  - Mobile-first responsive view (optimal pada rasio 9:16 / resolusi viewport 360px - 430px).
  - Standar WCAG AA untuk kontras warna label prioritas: High (Merah Crimson/Pastel), Medium (Amber/Kuning), Low (Emerald/Hijau).
  - Minimum tap target size 44x44 px untuk kenyamanan navigasi satu tangan.

---

## 3. Feature Requirements & Prioritization
| Feature | Description | User Stories & Acceptance Criteria | Priority (MoSCoW) | Technical Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| **3-Column Kanban Board** | Kolom visual alur kerja utama | *Sebagai mahasiswa, saya ingin melihat tugas terbagi rapi dalam kolom To do, In progress, dan Done agar alur kerja jelas.* Kriteria: Kolom dapat di-scroll vertikal atau di-switch via tab bar atas di mobile. | **Must-Have** | State array filtering |
| **Priority Tagging** | Label penanda urgensi tugas | *Sebagai mahasiswa, saya ingin melihat badge High, Medium, Low pada kartu tugas agar fokus pada yang terpenting.* Kriteria: Badge memiliki warna berbeda yang tegas dan mudah dikenali. | **Must-Have** | Tailwind CSS styling |
| **Tap-to-Move Status** | Navigasi status tanpa drag | *Sebagai pengguna mobile, saya ingin memindahkan tugas ke kolom berikutnya dengan sekali tap agar tidak ribet di layar sentuh.* Kriteria: Tersedia tombol next step `->` dan back step `<-` pada setiap kartu. | **Must-Have** | State update handler |
| **Local Storage Persistence** | Penyimpanan lokal tanpa login | *Sebagai pengguna prototipe, saya ingin data tugas tetap tersimpan saat reload halaman tanpa harus registrasi/login.* Kriteria: Sinkronisasi instan ke `window.localStorage`. | **Must-Have** | Web Storage API |
| **Quick Filter & Counter** | Filter prioritas & progress | *Sebagai pengguna, saya ingin memfilter tampilan hanya tugas High priority serta melihat rasio progress (misal 4/10 Done).* Kriteria: Tab filter berfungsi real-time. | **Should-Have** | Client-side search/filter |
| **Delete / Archive Task** | Manajemen kartu yang selesai | *Sebagai pengguna, saya ingin menghapus tugas yang dibatalkan atau merapikan kolom Done.* Kriteria: Konfirmasi hapus sederhana via modal atau quick dismiss. | **Should-Have** | State removal action |
| **Collaborative Team Mode** | Mode multi-user dengan invite code | *Sebagai anggota tim, saya ingin berbagi board dengan teman sekelompok.* Kriteria: Sinkronisasi data multi-user. | **Could-Have** (Future) | Supabase / Firebase backend |

---

## 4. Technical Specifications & Architecture
- **Frontend Framework:** Next.js (React 18/19, App Router) atau Vite + React.
- **UI Library & Styling:** Tailwind CSS + Lucide-React (ikon modern dan ringan).
- **Architecture Pattern:** Client-Side Single Page Application (SPA), Mobile-first container dengan wrapper responsif desktop (max-w-md di tengah layar jika dibuka via PC).
- **Data Model & Schema (TypeScript Interface):**
  ```typescript
  type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
  type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

  interface Task {
    id: string;
    title: string;
    description?: string;
    priority: Priority;
    status: TaskStatus;
    dueDate?: string;
    createdAt: number;
  }
