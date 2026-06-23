import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AdminLayout from './AdminLayout'

const API_URL = 'http://localhost:3000'

const kelasOptions = [
  'Kelas 1',
  'Kelas 2',
  'Kelas 3',
  'Kelas 4',
  'Kelas 5',
  'Kelas 6',
  'Kelas X IPA 1',
  'Kelas X IPA 2',
  'Kelas X IPA 3',
  'Kelas X IPS 1',
  'Kelas X IPS 2',
  'Kelas X IPS 3',
  'Kelas XI IPA 1',
  'Kelas XI IPA 2',
  'Kelas XI IPA 3',
  'Kelas XI IPS 1',
  'Kelas XI IPS 2',
  'Kelas XI IPS 3',
  'Kelas XII IPA 1',
  'Kelas XII IPA 2',
  'Kelas XII IPA 3',
  'Kelas XII IPS 1',
  'Kelas XII IPS 2',
  'Kelas XII IPS 3',
]

function TambahUserAdmin() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nama: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    is_active: true,

    // siswa
    nisn: '',
    nis: '',
    kelas: '',
    tahun_pelajaran: new Date().getFullYear().toString(),
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: 'Laki-laki',
    nama_ibu: '',
    nama_ayah: '',
    no_hp_ortu: '',
    pekerjaan_ortu: '',

    // guru
    nip: '',
    nuptk: '',
    status_kepegawaian: 'PNS',
    pendidikan_terakhir: 'S1',
    mapel_utama: '',
    wali_kelas: '',
    jabatan_tambahan: '',

    // admin/staff
    staff_id: '',
    posisi_staff: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const validateForm = () => {
    if (!form.nama.trim()) return 'Nama lengkap wajib diisi.'
    if (!form.email.trim()) return 'Email wajib diisi.'
    if (!form.password) return 'Password wajib diisi.'
    if (form.password.length < 8) return 'Password minimal 8 karakter.'
    if (form.password !== form.confirmPassword) {
      return 'Konfirmasi password tidak sama.'
    }
    if (!form.role) return 'Role wajib dipilih.'

    if (form.role === 'siswa') {
      if (!form.nisn.trim()) return 'NISN wajib diisi.'
      if (!form.kelas) return 'Kelas siswa wajib dipilih.'
    }

    if (form.role === 'guru') {
      if (!form.nip.trim()) return 'NIP / NUPTK wajib diisi.'
    }

    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const validationError = validateForm()

      if (validationError) {
        throw new Error(validationError)
      }

      const payload = {
        nama: form.nama,
        email: form.email,
        password: form.password,
        role: form.role,
        is_active: form.is_active,

        nisn: form.role === 'siswa' ? form.nisn : null,
        nis: form.role === 'siswa' ? form.nis : null,
        kelas:
          form.role === 'siswa'
            ? form.kelas
            : form.role === 'guru'
            ? form.wali_kelas || null
            : null,
        tahun_pelajaran: form.role === 'siswa' ? form.tahun_pelajaran : null,
        tempat_lahir: form.role === 'siswa' ? form.tempat_lahir : null,
        tanggal_lahir: form.role === 'siswa' ? form.tanggal_lahir || null : null,
        jenis_kelamin: form.role === 'siswa' ? form.jenis_kelamin : null,
        nama_ibu: form.role === 'siswa' ? form.nama_ibu : null,
        nama_ayah: form.role === 'siswa' ? form.nama_ayah : null,
        no_hp_ortu: form.role === 'siswa' ? form.no_hp_ortu : null,
        pekerjaan_ortu: form.role === 'siswa' ? form.pekerjaan_ortu : null,

        nip: form.role === 'guru' ? form.nip : null,
        nuptk: form.role === 'guru' ? form.nuptk : null,
        status_kepegawaian:
          form.role === 'guru' ? form.status_kepegawaian : null,
        pendidikan_terakhir:
          form.role === 'guru' ? form.pendidikan_terakhir : null,
        mapel_utama: form.role === 'guru' ? form.mapel_utama : null,
        wali_kelas: form.role === 'guru' ? form.wali_kelas || null : null,
        jabatan_tambahan:
          form.role === 'guru' ? form.jabatan_tambahan : null,

        staff_id: form.role === 'admin' ? form.staff_id : null,
        posisi_staff: form.role === 'admin' ? form.posisi_staff : null,
      }

      const response = await fetch(`${API_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.detail || result.error || 'Gagal membuat user.')
      }

      alert('User berhasil dibuat.')
      navigate('/admin/users')
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h1 className="font-semibold text-blue-600">Tambah User Baru</h1>

          <Link
            to="/admin/users"
            className="rounded bg-gray-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600"
          >
            Kembali
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 p-5">
            <div>
              <h2 className="mb-5 font-medium text-gray-700">
                Informasi Akun (Login)
              </h2>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block font-semibold">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nama"
                    value={form.nama}
                    onChange={handleChange}
                    placeholder="Nama lengkap pengguna"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-semibold">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="email@sekolah.com"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-semibold">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Minimal 8 karakter"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-semibold">
                    Konfirmasi Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Ulangi password"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-semibold">
                    Peran / Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3"
                  >
                    <option value="">-- Pilih Role --</option>
                    <option value="siswa">Siswa</option>
                    <option value="guru">Guru</option>
                    <option value="admin">Admin / Staff</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 font-medium">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={form.is_active}
                      onChange={handleChange}
                    />
                    Aktifkan Akun User Ini
                  </label>
                </div>
              </div>
            </div>

            {form.role === 'guru' && (
              <div className="border-t pt-6">
                <h2 className="mb-5 font-semibold text-green-600">
                  Data Kepegawaian Guru
                </h2>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block font-medium">
                      NIP / NUPTK <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nip"
                      value={form.nip}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-medium">
                      Status Kepegawaian
                    </label>
                    <select
                      name="status_kepegawaian"
                      value={form.status_kepegawaian}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3"
                    >
                      <option value="PNS">PNS</option>
                      <option value="PPPK">PPPK</option>
                      <option value="Honorer">Honorer</option>
                      <option value="GTY">GTY</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block font-medium">
                      Pendidikan Terakhir
                    </label>
                    <select
                      name="pendidikan_terakhir"
                      value={form.pendidikan_terakhir}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3"
                    >
                      <option value="S1">S1</option>
                      <option value="S2">S2</option>
                      <option value="S3">S3</option>
                      <option value="D3">D3</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block font-medium">
                      Mata Pelajaran Utama
                    </label>
                    <input
                      type="text"
                      name="mapel_utama"
                      value={form.mapel_utama}
                      onChange={handleChange}
                      placeholder="Cth: Matematika"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-medium">
                      Tugas Wali Kelas (Opsional)
                    </label>
                    <select
                      name="wali_kelas"
                      value={form.wali_kelas}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3"
                    >
                      <option value="">Bukan Wali Kelas</option>
                      {kelasOptions.map((kelas) => (
                        <option key={kelas} value={kelas}>
                          {kelas}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block font-medium">
                      Jabatan Tambahan
                    </label>
                    <input
                      type="text"
                      name="jabatan_tambahan"
                      value={form.jabatan_tambahan}
                      onChange={handleChange}
                      placeholder="Cth: Kepala Perpustakaan"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3"
                    />
                  </div>
                </div>
              </div>
            )}

            {form.role === 'siswa' && (
              <div className="border-t pt-6">
                <h2 className="mb-5 font-semibold text-blue-600">
                  Data Akademik & Pribadi Siswa
                </h2>

                <div className="grid gap-5 md:grid-cols-4">
                  <div>
                    <label className="mb-2 block font-medium">
                      NISN <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nisn"
                      value={form.nisn}
                      onChange={handleChange}
                      placeholder="Nomor Induk Siswa Nasional"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-medium">
                      NIS (Opsional)
                    </label>
                    <input
                      type="text"
                      name="nis"
                      value={form.nis}
                      onChange={handleChange}
                      placeholder="Nomor Induk Sekolah"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-medium">
                      Kelas <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="kelas"
                      value={form.kelas}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3"
                    >
                      <option value="">Pilih</option>
                      {kelasOptions.map((kelas) => (
                        <option key={kelas} value={kelas}>
                          {kelas}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block font-medium">Tahun Pelajaran</label>
                    <input
                      type="text"
                      name="tahun_pelajaran"
                      value={form.tahun_pelajaran}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-medium">Tempat Lahir</label>
                    <input
                      type="text"
                      name="tempat_lahir"
                      value={form.tempat_lahir}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-medium">Tanggal Lahir</label>
                    <input
                      type="date"
                      name="tanggal_lahir"
                      value={form.tanggal_lahir}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-medium">Jenis Kelamin</label>
                    <select
                      name="jenis_kelamin"
                      value={form.jenis_kelamin}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3"
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                </div>

                <h3 className="mt-7 mb-4 text-sm font-semibold text-gray-600">
                  DATA ORANG TUA
                </h3>

                <div className="grid gap-5 md:grid-cols-2">
                  <input
                    type="text"
                    name="nama_ibu"
                    value={form.nama_ibu}
                    onChange={handleChange}
                    placeholder="Nama Ibu Kandung"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3"
                  />

                  <input
                    type="text"
                    name="nama_ayah"
                    value={form.nama_ayah}
                    onChange={handleChange}
                    placeholder="Nama Ayah"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3"
                  />

                  <input
                    type="text"
                    name="no_hp_ortu"
                    value={form.no_hp_ortu}
                    onChange={handleChange}
                    placeholder="No. HP Orang Tua"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3"
                  />

                  <input
                    type="text"
                    name="pekerjaan_ortu"
                    value={form.pekerjaan_ortu}
                    onChange={handleChange}
                    placeholder="Pekerjaan Orang Tua"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3"
                  />
                </div>
              </div>
            )}

            {form.role === 'admin' && (
              <div className="border-t pt-6">
                <h2 className="mb-5 font-semibold text-red-500">
                  Profil Admin / Staff
                </h2>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block font-medium">
                      ID Pegawai / Staff
                    </label>
                    <input
                      type="text"
                      name="staff_id"
                      value={form.staff_id}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-medium">
                      Posisi / Bagian
                    </label>
                    <input
                      type="text"
                      name="posisi_staff"
                      value={form.posisi_staff}
                      onChange={handleChange}
                      placeholder="Cth: Tata Usaha"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3"
                    />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-500">
                {error}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t px-5 py-4">
            <Link
              to="/admin/users"
              className="rounded-lg bg-gray-500 px-5 py-3 font-semibold text-white hover:bg-gray-600"
            >
              Batal
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan User Baru'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}

export default TambahUserAdmin