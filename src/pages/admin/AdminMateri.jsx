import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Filter,
  Eye,
  Trash2,
  BookOpen,
  FileQuestion,
  RefreshCw,
} from 'lucide-react'
import AdminLayout from './AdminLayout'
import { supabase } from '../../lib/supabase'

function AdminMateri() {
  const [profiles, setProfiles] = useState([])
  const [materiList, setMateriList] = useState([])
  const [kuisList, setKuisList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [tipeFilter, setTipeFilter] = useState('semua')
  const [kelasFilter, setKelasFilter] = useState('semua')
  const [statusFilter, setStatusFilter] = useState('semua')

  const fetchData = async () => {
    setLoading(true)
    setError('')

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')

    const { data: materiData, error: materiError } = await supabase
      .from('materi')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: kuisData, error: kuisError } = await supabase
      .from('kuis')
      .select('*')
      .order('created_at', { ascending: false })

    if (materiError || kuisError) {
      setError('Gagal memuat data materi atau kuis.')
      setLoading(false)
      return
    }

    setProfiles(profileData || [])
    setMateriList(materiData || [])
    setKuisList(kuisData || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getGuruName = (guruId) => {
    const guru = profiles.find((item) => item.id === guruId)
    return guru?.nama || 'Guru'
  }

  const allContent = useMemo(() => {
    const materiMapped = materiList.map((item) => ({
      ...item,
      tipe: 'materi',
    }))

    const kuisMapped = kuisList.map((item) => ({
      ...item,
      tipe: 'kuis',
    }))

    return [...materiMapped, ...kuisMapped].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    )
  }, [materiList, kuisList])

  const kelasOptions = useMemo(() => {
    const kelas = allContent.map((item) => item.kelas).filter(Boolean)
    return [...new Set(kelas)]
  }, [allContent])

  const filteredContent = useMemo(() => {
    return allContent.filter((item) => {
      const keyword = search.toLowerCase()

      const cocokSearch =
        item.judul?.toLowerCase().includes(keyword) ||
        item.deskripsi?.toLowerCase().includes(keyword) ||
        getGuruName(item.guru_id).toLowerCase().includes(keyword)

      const cocokTipe = tipeFilter === 'semua' || item.tipe === tipeFilter
      const cocokKelas = kelasFilter === 'semua' || item.kelas === kelasFilter

      const cocokStatus =
        statusFilter === 'semua' ||
        (statusFilter === 'published' && item.is_published) ||
        (statusFilter === 'draft' && !item.is_published)

      return cocokSearch && cocokTipe && cocokKelas && cocokStatus
    })
  }, [allContent, search, tipeFilter, kelasFilter, statusFilter, profiles])

  const totalMateri = materiList.length
  const totalKuis = kuisList.length
  const totalPublished = allContent.filter((item) => item.is_published).length
  const totalDraft = allContent.filter((item) => !item.is_published).length

  const resetFilter = () => {
    setSearch('')
    setTipeFilter('semua')
    setKelasFilter('semua')
    setStatusFilter('semua')
  }

  const handleDelete = async (item) => {
    const confirmDelete = window.confirm(
      `Yakin ingin menghapus ${item.tipe === 'kuis' ? 'kuis' : 'materi'} ini?`,
    )

    if (!confirmDelete) return

    if (item.tipe === 'materi') {
      const { error } = await supabase.from('materi').delete().eq('id', item.id)

      if (error) {
        alert(`Gagal menghapus materi: ${error.message}`)
        return
      }

      fetchData()
      return
    }

    const { data: submissions, error: fetchSubmissionError } = await supabase
      .from('kuis_submission')
      .select('id')
      .eq('kuis_id', item.id)

    if (fetchSubmissionError) {
      alert(`Gagal mengambil submission kuis: ${fetchSubmissionError.message}`)
      return
    }

    const submissionIds = (submissions || []).map((submission) => submission.id)

    if (submissionIds.length > 0) {
      const { error: deleteJawabanError } = await supabase
        .from('kuis_jawaban')
        .delete()
        .in('submission_id', submissionIds)

      if (deleteJawabanError) {
        alert(`Gagal menghapus jawaban kuis: ${deleteJawabanError.message}`)
        return
      }
    }

    const { error: deleteSubmissionError } = await supabase
      .from('kuis_submission')
      .delete()
      .eq('kuis_id', item.id)

    if (deleteSubmissionError) {
      alert(`Gagal menghapus submission kuis: ${deleteSubmissionError.message}`)
      return
    }

    const { error: deleteSoalError } = await supabase
      .from('kuis_soal')
      .delete()
      .eq('kuis_id', item.id)

    if (deleteSoalError) {
      alert(`Gagal menghapus soal kuis: ${deleteSoalError.message}`)
      return
    }

    const { error: deleteKuisError } = await supabase
      .from('kuis')
      .delete()
      .eq('id', item.id)

    if (deleteKuisError) {
      alert(`Gagal menghapus kuis: ${deleteKuisError.message}`)
      return
    }

    fetchData()
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Monitoring Materi & Kuis
        </h1>
        <p className="mt-1 text-gray-500">
          Pantau semua materi dan kuis yang dibuat oleh guru.
        </p>
      </div>

      <div className="mb-6 grid gap-5 md:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-blue-600">TOTAL MATERI</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-800">{totalMateri}</h2>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-yellow-600">TOTAL KUIS</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-800">{totalKuis}</h2>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-green-600">PUBLISHED</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-800">
            {totalPublished}
          </h2>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-red-600">DRAFT</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-800">{totalDraft}</h2>
        </div>
      </div>

      <div className="mb-5 rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="flex items-center gap-2 font-bold text-blue-600">
            <Filter size={18} />
            Filter Konten
          </h2>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <label className="mb-2 block text-sm text-gray-600">Pencarian</label>
            <div className="flex">
              <div className="flex items-center rounded-l-lg border border-r-0 border-gray-300 px-3">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cari judul, deskripsi, atau guru..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-r-lg border border-gray-300 px-3 py-3 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm text-gray-600">Tipe</label>
            <select
              value={tipeFilter}
              onChange={(e) => setTipeFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-3"
            >
              <option value="semua">Semua</option>
              <option value="materi">Materi</option>
              <option value="kuis">Kuis</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm text-gray-600">Kelas</label>
            <select
              value={kelasFilter}
              onChange={(e) => setKelasFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-3"
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
              className="w-full rounded-lg border border-gray-300 px-3 py-3"
            >
              <option value="semua">Semua Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div className="flex items-end gap-2 lg:col-span-2">
            <button
              type="button"
              onClick={resetFilter}
              className="w-full rounded-lg bg-gray-500 px-4 py-3 font-semibold text-white hover:bg-gray-600"
            >
              <RefreshCw size={18} className="mx-auto" />
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-bold text-blue-600">Daftar Konten</h2>
        </div>

        {loading ? (
          <div className="p-6 text-gray-500">Memuat data konten...</div>
        ) : error ? (
          <div className="p-6 text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto p-5">
            <table className="min-w-full">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-gray-700">
                  <th className="px-4 py-3 text-center">No</th>
                  <th className="px-4 py-3">Konten</th>
                  <th className="px-4 py-3">Guru</th>
                  <th className="px-4 py-3">Kelas</th>
                  <th className="px-4 py-3">Tipe</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredContent.length > 0 ? (
                  filteredContent.map((item, index) => (
                    <tr key={`${item.tipe}-${item.id}`} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-4 text-center">{index + 1}</td>

                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`rounded-lg p-2 ${
                              item.tipe === 'kuis'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {item.tipe === 'kuis' ? (
                              <FileQuestion size={20} />
                            ) : (
                              <BookOpen size={20} />
                            )}
                          </div>

                          <div>
                            <p className="font-bold text-gray-800">{item.judul}</p>
                            <p className="text-sm text-gray-500">
                              {item.deskripsi || '-'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-gray-700">
                        {getGuruName(item.guru_id)}
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-cyan-100 px-3 py-1 text-sm font-medium text-cyan-700">
                          {item.kelas || '-'}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            item.tipe === 'kuis'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {item.tipe === 'kuis' ? 'Kuis' : 'Materi'}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {item.is_published ? (
                          <span className="rounded-full border border-green-500 px-3 py-1 text-sm font-semibold text-green-600">
                            Published
                          </span>
                        ) : (
                          <span className="rounded-full border border-yellow-500 px-3 py-1 text-sm font-semibold text-yellow-600">
                            Draft
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-600">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString('id-ID')
                          : '-'}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-center gap-2">
                          {item.tipe === 'materi' ? (
                            <Link
                              to={`/guru/materi/${item.id}`}
                              className="rounded bg-gray-50 p-2 text-blue-600 hover:bg-blue-50"
                              title="Lihat"
                            >
                              <Eye size={16} />
                            </Link>
                          ) : (
                            <Link
                              to={`/guru/kuis/${item.id}/hasil`}
                              className="rounded bg-gray-50 p-2 text-blue-600 hover:bg-blue-50"
                              title="Lihat Hasil"
                            >
                              <Eye size={16} />
                            </Link>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="rounded bg-gray-50 p-2 text-red-500 hover:bg-red-50"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Tidak ada data konten.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminMateri