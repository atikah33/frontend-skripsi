import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ClipboardCheck, FileText } from 'lucide-react'
import GuruLayout from '../../components/guru/GuruLayout'
import { supabase } from '../../lib/supabase'

function HasilKuis() {
  const { id } = useParams()

  const [kuis, setKuis] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const formatDate = (date) => {
    if (!date) return '-'

    return new Date(date).toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  const fetchData = async () => {
    setLoading(true)
    setError('')

    const { data: kuisData, error: kuisError } = await supabase
      .from('kuis')
      .select('*')
      .eq('id', id)
      .single()

    if (kuisError) {
      setError('Gagal memuat detail kuis.')
      setLoading(false)
      return
    }

    const { data: submissionData, error: submissionError } = await supabase
      .from('kuis_submission')
      .select(`
        *,
        profiles:siswa_id (
          id,
          nama,
          email,
          role
        )
      `)
      .eq('kuis_id', id)
      .order('submitted_at', { ascending: false })

    if (submissionError) {
      setError('Gagal memuat data pengumpulan kuis.')
      setLoading(false)
      return
    }

    setKuis(kuisData)
    setSubmissions(submissionData || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const totalPengumpulan = submissions.length

  const rataRataNilai = useMemo(() => {
    const sudahDinilai = submissions.filter(
      (item) => item.nilai !== null && item.nilai !== undefined,
    )

    if (sudahDinilai.length === 0) return '0.00'

    const total = sudahDinilai.reduce(
      (acc, item) => acc + Number(item.nilai || 0),
      0,
    )

    return (total / sudahDinilai.length).toFixed(2)
  }, [submissions])

  const totalSudahDinilai = useMemo(() => {
    return submissions.filter((item) => item.status === 'dinilai').length
  }, [submissions])

  const totalTerlambat = useMemo(() => {
    return submissions.filter((item) => item.is_late).length
  }, [submissions])

  if (loading) {
    return (
      <GuruLayout>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-gray-500">Memuat hasil kuis...</p>
        </div>
      </GuruLayout>
    )
  }

  if (error) {
    return (
      <GuruLayout>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-red-500">{error}</p>
        </div>
      </GuruLayout>
    )
  }

  return (
    <GuruLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Hasil Kuis</h1>
          <p className="mt-2 text-gray-500">Ringkasan hasil pengerjaan siswa</p>
        </div>

        <Link
          to="/guru/kelola-materi"
          className="inline-flex items-center gap-2 rounded-xl bg-gray-500 px-4 py-3 font-medium text-white hover:bg-gray-600"
        >
          <ArrowLeft size={18} />
          Kembali
        </Link>
      </div>

      {kuis && (
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <p className="text-sm text-gray-500">Judul Kuis</p>
              <h2 className="text-2xl font-bold text-gray-800">{kuis.judul}</h2>
              <p className="mt-2 text-gray-600">{kuis.deskripsi || '-'}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Kelas</p>
              <p className="font-medium text-gray-800">{kuis.kelas}</p>

              <p className="mt-4 text-sm text-gray-500">Mode Kuis</p>
              <p className="font-medium text-gray-800">
                {kuis.mode_kuis === 'file_upload' ? 'File Upload' : 'Manual'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">KKM</p>
              <p className="font-medium text-gray-800">{kuis.kkm}</p>

              <p className="mt-4 text-sm text-gray-500">Deadline</p>
              <p className="font-medium text-gray-800">
                {formatDate(kuis.deadline)}
              </p>

              <p className="mt-4 text-sm text-gray-500">Status</p>
              <p
                className={`font-medium ${
                  kuis.is_published ? 'text-green-600' : 'text-yellow-600'
                }`}
              >
                {kuis.is_published ? 'Published' : 'Draft'}
              </p>
            </div>
          </div>

          {kuis.file_url && (
            <div className="mt-5">
              <a
                href={kuis.file_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-white hover:bg-blue-700"
              >
                <FileText size={18} />
                Buka File Kuis
              </a>
            </div>
          )}
        </div>
      )}

      <div className="mb-6 grid gap-5 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Pengumpulan</p>
          <h3 className="mt-2 text-3xl font-bold text-gray-800">
            {totalPengumpulan}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Sudah Dinilai</p>
          <h3 className="mt-2 text-3xl font-bold text-gray-800">
            {totalSudahDinilai}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Terlambat</p>
          <h3 className="mt-2 text-3xl font-bold text-red-600">
            {totalTerlambat}
          </h3>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Rata-rata Nilai</p>
          <h3 className="mt-2 text-3xl font-bold text-gray-800">
            {rataRataNilai}
          </h3>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="text-lg font-semibold text-blue-600">
            Daftar Hasil Pengerjaan Siswa
          </h2>
        </div>

        <div className="overflow-x-auto p-5">
          <table className="min-w-full">
            <thead>
              <tr className="border-b text-left text-gray-600">
                <th className="px-4 py-3 font-semibold">Nama Siswa</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Tanggal Kirim</th>
                <th className="px-4 py-3 font-semibold">Ketepatan</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Nilai</th>
                <th className="px-4 py-3 text-center font-semibold">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {submissions.length > 0 ? (
                submissions.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="px-4 py-4 font-medium text-gray-800">
                      {item.profiles?.nama || 'Siswa'}
                    </td>

                    <td className="px-4 py-4 text-gray-600">
                      {item.profiles?.email || '-'}
                    </td>

                    <td className="px-4 py-4 text-gray-600">
                      {formatDate(item.submitted_at)}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                          item.is_late
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {item.is_late ? 'Terlambat' : 'Tepat Waktu'}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                          item.status === 'dinilai'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {item.status === 'dinilai' ? 'Sudah Dinilai' : 'Belum Dinilai'}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-gray-700">
                      {item.nilai !== null && item.nilai !== undefined
                        ? item.nilai
                        : '-'}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        <Link
                          to={`/guru/kuis/${id}/nilai/${item.id}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-600"
                        >
                          <ClipboardCheck size={16} />
                          Periksa & Nilai
                        </Link>
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
                    Belum ada siswa yang mengumpulkan kuis.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </GuruLayout>
  )
}

export default HasilKuis