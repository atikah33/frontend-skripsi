import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  Filter,
  Upload,
  Download,
  Eye,
  Pencil,
  Trash2,
  KeyRound,
  X,
  RefreshCw,
} from 'lucide-react'
import AdminLayout from './AdminLayout'
import { supabase } from '../../lib/supabase'

const API_URL = 'http://localhost:3000'

function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('semua')
  const [kelasFilter, setKelasFilter] = useState('semua')
  const [statusFilter, setStatusFilter] = useState('semua')

  const [showImportModal, setShowImportModal] = useState(false)
  const [csvFile, setCsvFile] = useState(null)
  const [defaultRole, setDefaultRole] = useState('siswa')
  const [importing, setImporting] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(`Gagal memuat user: ${error.message}`)
      setLoading(false)
      return
    }

    setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const kelasOptions = useMemo(() => {
    const kelas = users
      .map((item) => item.kelas)
      .filter(Boolean)

    return [...new Set(kelas)]
  }, [users])

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const keyword = search.toLowerCase()

      const cocokSearch =
        user.nama?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword) ||
        user.nip?.toLowerCase().includes(keyword) ||
        user.nisn?.toLowerCase().includes(keyword)

      const cocokRole = roleFilter === 'semua' || user.role === roleFilter
      const cocokKelas = kelasFilter === 'semua' || user.kelas === kelasFilter

      const cocokStatus =
        statusFilter === 'semua' ||
        (statusFilter === 'aktif' && user.is_active !== false) ||
        (statusFilter === 'nonaktif' && user.is_active === false)

      return cocokSearch && cocokRole && cocokKelas && cocokStatus
    })
  }, [users, search, roleFilter, kelasFilter, statusFilter])

  const handleImportCsv = async (e) => {
    e.preventDefault()

    if (!csvFile) {
      alert('Pilih file CSV terlebih dahulu.')
      return
    }

    setImporting(true)

    try {
      const formData = new FormData()
      formData.append('file', csvFile)
      formData.append('default_role', defaultRole)

      const response = await fetch(`${API_URL}/api/admin/users/import-csv`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.detail || result.error || 'Gagal import CSV.')
      }

      alert(`Import selesai. Berhasil: ${result.berhasil}, Gagal: ${result.gagal}`)

      setShowImportModal(false)
      setCsvFile(null)
      setDefaultRole('siswa')
      fetchUsers()
    } catch (err) {
      alert(err.message || 'Gagal import CSV.')
    } finally {
      setImporting(false)
    }
  }

  const handleExportCsv = () => {
    const headers = [
      'nama',
      'email',
      'role',
      'kelas',
      'nisn',
      'nis',
      'nip',
      'is_active',
    ]

    const rows = filteredUsers.map((user) => [
      user.nama || '',
      user.email || '',
      user.role || '',
      user.kelas || '',
      user.nisn || '',
      user.nis || '',
      user.nip || '',
      user.is_active === false ? 'nonaktif' : 'aktif',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((value) => `"${value}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = 'data-user.csv'
    link.click()

    URL.revokeObjectURL(url)
  }

  const handleDeleteUser = async (id) => {
    const confirmDelete = window.confirm(
      'Yakin ingin menghapus user ini dari tabel profile?',
    )

    if (!confirmDelete) return

    const { error } = await supabase.from('profiles').delete().eq('id', id)

    if (error) {
      alert(`Gagal menghapus user: ${error.message}`)
      return
    }

    fetchUsers()
  }

  const resetFilter = () => {
    setSearch('')
    setRoleFilter('semua')
    setKelasFilter('semua')
    setStatusFilter('semua')
  }

  const getRoleBadge = (role) => {
    if (role === 'siswa') {
      return 'bg-cyan-100 text-cyan-700'
    }

    if (role === 'guru') {
      return 'bg-green-100 text-green-700'
    }

    return 'bg-red-100 text-red-700'
  }

  const getRoleLabel = (role) => {
    if (role === 'siswa') return 'Siswa'
    if (role === 'guru') return 'Guru'
    if (role === 'admin') return 'Admin'
    return role || '-'
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Manajemen User</h1>
          <p className="mt-1 text-gray-500">
            Kelola data guru, siswa, dan admin sekolah.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700"
          >
            <Upload size={18} />
            Import CSV
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-3 font-semibold text-white hover:bg-cyan-600"
          >
            <Download size={18} />
            Export
          </button>

          <Link
            to="/admin/users/create"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Tambah User
          </Link>
        </div>
      </div>

      <div className="mb-5 rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="flex items-center gap-2 font-bold text-blue-600">
            <Filter size={18} />
            Filter & Pencarian
          </h2>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <label className="mb-2 block text-sm text-gray-600">Pencarian</label>
            <div className="flex">
              <div className="flex items-center rounded-l-lg border border-r-0 border-gray-300 px-3">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Nama / Email / NIP / NISN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-r-lg border border-gray-300 px-3 py-3 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm text-gray-600">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-blue-500"
            >
              <option value="semua">Semua Role</option>
              <option value="siswa">Siswa</option>
              <option value="guru">Guru</option>
              <option value="admin">Admin / Staff</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm text-gray-600">Kelas</label>
            <select
              value={kelasFilter}
              onChange={(e) => setKelasFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-blue-500"
            >
              <option value="semua">Semua Kelas</option>
              {kelasOptions.map((kelas) => (
                <option key={kelas} value={kelas}>
                  {kelas}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm text-gray-600">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-blue-500"
            >
              <option value="semua">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </div>

          <div className="flex items-end gap-2 lg:col-span-3">
            <button
              type="button"
              className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Terapkan
            </button>

            <button
              type="button"
              onClick={resetFilter}
              className="rounded-lg bg-gray-500 px-4 py-3 text-white hover:bg-gray-600"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        {loading ? (
          <div className="p-6 text-gray-500">Memuat data user...</div>
        ) : error ? (
          <div className="p-6 text-red-500">{error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-700">
                    <th className="px-4 py-3">
                      <input type="checkbox" />
                    </th>
                    <th className="px-4 py-3 text-center">No</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Info Sekolah</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user, index) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <input type="checkbox" />
                        </td>

                        <td className="px-4 py-4 text-center">{index + 1}</td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                              {(user.nama || user.email || '?').charAt(0).toUpperCase()}
                            </div>

                            <div>
                              <p className="font-bold text-gray-800">{user.nama || '-'}</p>
                              <p className="text-sm text-gray-500">{user.email || '-'}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${getRoleBadge(
                              user.role,
                            )}`}
                          >
                            {getRoleLabel(user.role)}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-700">
                          {user.role === 'siswa' ? (
                            <>
                              <p>Kelas: {user.kelas || '-'}</p>
                              <p>NISN: {user.nisn || '-'}</p>
                            </>
                          ) : user.role === 'guru' ? (
                            <>
                              <p>NIP:</p>
                              <p>{user.nip || '-'}</p>
                              {user.wali_kelas && (
                                <p className="text-gray-500">
                                  Wali: {user.wali_kelas}
                                </p>
                              )}
                            </>
                          ) : (
                            <p>{user.posisi_staff || '-'}</p>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          {user.is_active === false ? (
                            <span className="rounded-full border border-red-500 px-3 py-1 text-sm font-semibold text-red-600">
                              Nonaktif
                            </span>
                          ) : (
                            <span className="rounded-full border border-green-500 px-3 py-1 text-sm font-semibold text-green-600">
                              Aktif
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              className="rounded bg-gray-50 p-2 text-blue-600 hover:bg-blue-50"
                              title="Lihat"
                            >
                              <Eye size={15} />
                            </button>

                            <button
                              type="button"
                              className="rounded bg-gray-50 p-2 text-yellow-500 hover:bg-yellow-50"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </button>

                            <button
                              type="button"
                              className="rounded bg-gray-50 p-2 text-gray-700 hover:bg-gray-100"
                              title="Reset Password"
                            >
                              <KeyRound size={15} />
                            </button>

                            {user.role !== 'admin' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(user.id)}
                                className="rounded bg-gray-50 p-2 text-red-500 hover:bg-red-50"
                                title="Hapus"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        Tidak ada data user.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t px-5 py-4 text-sm text-gray-600">
              Menampilkan <b>{filteredUsers.length}</b> dari total{' '}
              <b>{users.length}</b> data
            </div>
          </>
        )}
      </div>

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-bold text-gray-800">Import User CSV</h2>

              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleImportCsv}>
              <div className="space-y-4 p-5">
                <div className="rounded-lg bg-cyan-100 p-4 text-sm text-cyan-900">
                  <p className="font-bold">Format CSV:</p>
                  <p>nama, email, password, role, nisn, nip, kelas</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Role Default
                  </label>
                  <select
                    value={defaultRole}
                    onChange={(e) => setDefaultRole(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-3"
                  >
                    <option value="siswa">Siswa</option>
                    <option value="guru">Guru</option>
                    <option value="admin">Admin / Staff</option>
                  </select>
                </div>

                <div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files[0])}
                    className="w-full rounded-lg border border-gray-300 px-3 py-3"
                  />

                  {csvFile && (
                    <p className="mt-2 text-sm text-gray-500">
                      File dipilih: {csvFile.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t px-5 py-4">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="rounded-lg bg-gray-500 px-4 py-2 font-semibold text-white hover:bg-gray-600"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={importing}
                  className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {importing ? 'Mengimport...' : 'Upload & Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminUsers