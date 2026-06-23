import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Pencil,
  Trash2,
  Plus,
  Search,
  Eye,
  BarChart3,
} from 'lucide-react'
import GuruLayout from '../../components/guru/GuruLayout'
import { supabase } from '../../lib/supabase'

function KelolaMateri() {
  const [tab, setTab] = useState('materi')
  const [search, setSearch] = useState('')
  const [kelasFilter, setKelasFilter] = useState('Semua Kelas')

  const [materiList, setMateriList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [kuisList, setKuisList] = useState([])
  const [loadingKuis, setLoadingKuis] = useState(true)
  const [errorKuis, setErrorKuis] = useState('')

  const kelasOptions = [
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

  const fetchMateri = async () => {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('materi')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError('Gagal memuat data materi.')
      setLoading(false)
      return
    }

    setMateriList(data || [])
    setLoading(false)
  }

  const fetchKuis = async () => {
    setLoadingKuis(true)
    setErrorKuis('')

    const { data, error } = await supabase
      .from('kuis')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setErrorKuis('Gagal memuat data kuis.')
      setLoadingKuis(false)
      return
    }

    setKuisList(data || [])
    setLoadingKuis(false)
  }

  useEffect(() => {
    fetchMateri()
    fetchKuis()
  }, [])

  const filteredMateri = useMemo(() => {
    return materiList.filter((item) => {
      const cocokJudul = item.judul?.toLowerCase().includes(search.toLowerCase())
      const cocokKelas =
        kelasFilter === 'Semua Kelas' || item.kelas === kelasFilter

      return cocokJudul && cocokKelas
    })
  }, [materiList, search, kelasFilter])

  const filteredKuis = useMemo(() => {
    return kuisList.filter((item) => {
      const cocokJudul = item.judul?.toLowerCase().includes(search.toLowerCase())
      const cocokKelas =
        kelasFilter === 'Semua Kelas' || item.kelas === kelasFilter

      return cocokJudul && cocokKelas
    })
  }, [kuisList, search, kelasFilter])

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Yakin ingin menghapus materi ini?')
    if (!confirmDelete) return

    const { error } = await supabase.from('materi').delete().eq('id', id)

    if (error) {
      alert(`Gagal menghapus materi: ${error.message}`)
      return
    }

    alert('Materi berhasil dihapus')
    fetchMateri()
  }

  const handleDeleteKuis = async (id) => {
    const confirmDelete = window.confirm(
      'Yakin ingin menghapus kuis ini? Semua soal, jawaban, dan hasil siswa juga akan terhapus.',
    )

    if (!confirmDelete) return

    const { data: submissions, error: fetchSubmissionError } = await supabase
      .from('kuis_submission')
      .select('id')
      .eq('kuis_id', id)

    if (fetchSubmissionError) {
      alert(`Gagal mengambil data submission: ${fetchSubmissionError.message}`)
      return
    }

    const submissionIds = (submissions || []).map((item) => item.id)

    if (submissionIds.length > 0) {
      const { error: deleteJawabanError } = await supabase
        .from('kuis_jawaban')
        .delete()
        .in('submission_id', submissionIds)

      if (deleteJawabanError) {
        alert(`Gagal menghapus jawaban siswa: ${deleteJawabanError.message}`)
        return
      }
    }

    const { error: deleteSubmissionError } = await supabase
      .from('kuis_submission')
      .delete()
      .eq('kuis_id', id)

    if (deleteSubmissionError) {
      alert(`Gagal menghapus submission kuis: ${deleteSubmissionError.message}`)
      return
    }

    const { error: deleteSoalError } = await supabase
      .from('kuis_soal')
      .delete()
      .eq('kuis_id', id)

    if (deleteSoalError) {
      alert(`Gagal menghapus soal kuis: ${deleteSoalError.message}`)
      return
    }

    const { error: deleteKuisError } = await supabase
      .from('kuis')
      .delete()
      .eq('id', id)

    if (deleteKuisError) {
      alert(`Gagal menghapus kuis: ${deleteKuisError.message}`)
      return
    }

    alert('Kuis berhasil dihapus')
    fetchKuis()
  }

  return (
    <GuruLayout>
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-800">
          Manajemen Pembelajaran
        </h1>
      </div>

      <div className="rounded-2xl bg-white shadow-sm">
        <div className="border-b px-4 pt-4">
          <div className="flex gap-2">
            <button
              onClick={() => setTab('materi')}
              className={`rounded-t-xl px-4 py-3 text-sm font-semibold ${
                tab === 'materi'
                  ? 'border border-b-0 border-gray-200 bg-white text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              <span className="flex items-center gap-2">
                <BookOpen size={16} />
                Materi Pembelajaran
              </span>
            </button>

            <button
              onClick={() => setTab('kuis')}
              className={`rounded-t-xl px-4 py-3 text-sm font-semibold ${
                tab === 'kuis'
                  ? 'border border-b-0 border-gray-200 bg-white text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              Kelola Kuis
            </button>
          </div>
        </div>

        <div className="p-5">
          {tab === 'materi' && (
            <>
              <div className="mb-6 flex flex-col gap-3 lg:flex-row">
                <div className="flex flex-1">
                  <input
                    type="text"
                    placeholder="Cari judul..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-l-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    className="rounded-r-xl bg-blue-600 px-4 text-white"
                  >
                    <Search size={20} />
                  </button>
                </div>

                <select
                  value={kelasFilter}
                  onChange={(e) => setKelasFilter(e.target.value)}
                  className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option>Semua Kelas</option>
                  {kelasOptions.map((kelas) => (
                    <option key={kelas}>{kelas}</option>
                  ))}
                </select>

                <Link
                  to="/guru/materi/tambah"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                >
                  <Plus size={18} />
                  Upload Materi Baru
                </Link>
              </div>

              {loading ? (
                <div className="rounded-xl border border-gray-200 p-6 text-gray-500">
                  Memuat data materi...
                </div>
              ) : error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-500">
                  {error}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b text-left text-gray-600">
                        <th className="px-4 py-3 font-semibold">Judul</th>
                        <th className="px-4 py-3 font-semibold">Kelas</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">
                          Tanggal Tayang
                        </th>
                        <th className="px-4 py-3 text-center font-semibold">
                          Aksi
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredMateri.length > 0 ? (
                        filteredMateri.map((item) => (
                          <tr key={item.id} className="border-b">
                            <td className="px-4 py-4">
                              <p className="font-medium text-gray-800">
                                {item.judul}
                              </p>
                              <p className="text-sm text-gray-500">
                                {item.deskripsi}
                              </p>
                            </td>

                            <td className="px-4 py-4">
                              <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-700">
                                {item.kelas}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`text-sm font-medium ${
                                  item.is_published
                                    ? 'text-green-600'
                                    : 'text-yellow-600'
                                }`}
                              >
                                {item.is_published ? 'Published' : 'Draft'}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-gray-600">
                              {item.tanggal_tayang || '-'}
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <Link
                                  to={`/guru/materi/${item.id}`}
                                  className="rounded-md bg-blue-500 p-2 text-white hover:bg-blue-600"
                                  title="Lihat Materi"
                                >
                                  <Eye size={16} />
                                </Link>

                                <Link
                                  to={`/guru/materi/${item.id}/edit`}
                                  className="rounded-md bg-yellow-400 p-2 text-white hover:bg-yellow-500"
                                  title="Edit Materi"
                                >
                                  <Pencil size={16} />
                                </Link>

                                <button
                                  type="button"
                                  onClick={() => handleDelete(item.id)}
                                  className="rounded-md bg-red-500 p-2 text-white hover:bg-red-600"
                                  title="Hapus Materi"
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
                            colSpan="5"
                            className="px-4 py-8 text-center text-gray-500"
                          >
                            Belum ada materi.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {tab === 'kuis' && (
            <>
              <div className="mb-6 flex flex-col gap-3 lg:flex-row">
                <div className="flex flex-1">
                  <input
                    type="text"
                    placeholder="Cari judul kuis..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-l-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    className="rounded-r-xl bg-blue-600 px-4 text-white"
                  >
                    <Search size={20} />
                  </button>
                </div>

                <select
                  value={kelasFilter}
                  onChange={(e) => setKelasFilter(e.target.value)}
                  className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option>Semua Kelas</option>
                  {kelasOptions.map((kelas) => (
                    <option key={kelas}>{kelas}</option>
                  ))}
                </select>

                <Link
                  to="/guru/kuis/tambah"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                >
                  <Plus size={18} />
                  Buat Kuis Baru
                </Link>
              </div>

              {loadingKuis ? (
                <div className="rounded-xl border border-gray-200 p-6 text-gray-500">
                  Memuat data kuis...
                </div>
              ) : errorKuis ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-500">
                  {errorKuis}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b text-left text-gray-600">
                        <th className="px-4 py-3 font-semibold">Judul</th>
                        <th className="px-4 py-3 font-semibold">Kelas</th>
                        <th className="px-4 py-3 font-semibold">Mode</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Tanggal</th>
                        <th className="px-4 py-3 text-center font-semibold">
                          Aksi
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredKuis.length > 0 ? (
                        filteredKuis.map((item) => (
                          <tr key={item.id} className="border-b">
                            <td className="px-4 py-4">
                              <p className="font-medium text-gray-800">
                                {item.judul}
                              </p>
                              <p className="text-sm text-gray-500">
                                {item.deskripsi}
                              </p>
                            </td>

                            <td className="px-4 py-4">
                              <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-700">
                                {item.kelas}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <span className="text-sm text-gray-700">
                                {item.mode_kuis === 'file_upload'
                                  ? 'File Upload'
                                  : 'Manual'}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`text-sm font-medium ${
                                  item.is_published
                                    ? 'text-green-600'
                                    : 'text-yellow-600'
                                }`}
                              >
                                {item.is_published ? 'Published' : 'Draft'}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-gray-600">
                              {item.created_at?.slice(0, 10)}
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <Link
                                  to={`/guru/kuis/${item.id}/hasil`}
                                  className="rounded-md bg-cyan-500 p-2 text-white hover:bg-cyan-600"
                                  title="Lihat Hasil Kuis"
                                >
                                  <BarChart3 size={16} />
                                </Link>

                                <Link
                                  to={`/guru/kuis/${item.id}/edit`}
                                  className="rounded-md bg-yellow-400 p-2 text-white hover:bg-yellow-500"
                                  title="Edit Kuis"
                                >
                                  <Pencil size={16} />
                                </Link>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteKuis(item.id)}
                                  className="rounded-md bg-red-500 p-2 text-white hover:bg-red-600"
                                  title="Hapus Kuis"
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
                            colSpan="6"
                            className="px-4 py-8 text-center text-gray-500"
                          >
                            Belum ada kuis.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </GuruLayout>
  )
}

export default KelolaMateri