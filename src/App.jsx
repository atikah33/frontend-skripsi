import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import GuruDashboard from './pages/guru/GuruDashboard'
import PrediksiRemedial from './pages/guru/PrediksiRemedial'
import AbsensiSiswa from './pages/guru/AbsensiSiswa'
import KelolaMateri from './pages/guru/KelolaMateri'
import TambahMateri from './pages/guru/TambahMateri'
import EditMateri from './pages/guru/EditMateri'
import DetailMateri from './pages/guru/DetailMateri'
import TambahKuis from './pages/guru/TambahKuis'
import EditKuis from './pages/guru/EditKuis'
import HasilKuis from './pages/guru/HasilKuis'
import NilaiKuis from './pages/guru/NilaiKuis'
import ProfilGuru from './pages/guru/ProfilGuru'
import ExportHasilNilai from './pages/guru/ExportHasilNilai'

import SiswaDashboard from './pages/siswa/SiswaDashboard'
import SiswaMateriKuis from './pages/siswa/SiswaMateriKuis'
import DetailMateriSiswa from './pages/siswa/DetailMateriSiswa'
import KerjakanKuisSiswa from './pages/siswa/KerjakanKuisSiswa'
import ProfilSiswa from './pages/siswa/ProfilSiswa'
import SiswaAbsensi from './pages/siswa/SiswaAbsensi'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import TambahUserAdmin from './pages/admin/TambahUserAdmin'
import AdminMateri from './pages/admin/AdminMateri'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/users" element={<AdminUsers />} />
      <Route path="/admin/users/create" element={<TambahUserAdmin />} />
      <Route path="/admin/materi" element={<AdminMateri />} />

      <Route path="/guru/dashboard" element={<GuruDashboard />} />
      <Route path="/guru/prediksi-remedial" element={<PrediksiRemedial />} />
      <Route path="/guru/absensi" element={<AbsensiSiswa />} />
      <Route path="/guru/export-nilai" element={<ExportHasilNilai />} />
      <Route path="/guru/kelola-materi" element={<KelolaMateri />} />
      <Route path="/guru/materi/tambah" element={<TambahMateri />} />
      <Route path="/guru/materi/:id" element={<DetailMateri />} />
      <Route path="/guru/materi/:id/edit" element={<EditMateri />} />
      <Route path="/guru/kuis/tambah" element={<TambahKuis />} />
      <Route path="/guru/kuis/:id/edit" element={<EditKuis />} />
      <Route path="/guru/kuis/:id/hasil" element={<HasilKuis />} />
      <Route path="/guru/kuis/:id/nilai/:submissionId" element={<NilaiKuis />} />
      <Route path="/guru/profil" element={<ProfilGuru />} />

      <Route path="/siswa/dashboard" element={<SiswaDashboard />} />
      <Route path="/siswa/materi-kuis" element={<SiswaMateriKuis />} />
      <Route path="/siswa/materi/:id" element={<DetailMateriSiswa />} />
      <Route path="/siswa/kuis/:id" element={<KerjakanKuisSiswa />} />
      <Route path="/siswa/profil" element={<ProfilSiswa />} />
      <Route path="/siswa/absensi" element={<SiswaAbsensi />} />
    </Routes>
  )
}

export default App