import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, UserRound, FileText } from 'lucide-react'
import GuruLayout from '../../components/guru/GuruLayout'
import { supabase } from '../../lib/supabase'

function NilaiKuis() {
  const { id, submissionId } = useParams()
  const navigate = useNavigate()

  const [kuis, setKuis] = useState(null)
  const [submission, setSubmission] = useState(null)
  const [jawabanList, setJawabanList] = useState([])
  const [form, setForm] = useState({
    nilai: '',
    feedback: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
      .eq('id', submissionId)
      .single()

    if (submissionError) {
      setError('Gagal memuat data penilaian siswa.')
      setLoading(false)
      return
    }

    setKuis(kuisData)
    setSubmission(submissionData)
    setForm({
      nilai:
        submissionData.nilai !== null && submissionData.nilai !== undefined
          ? submissionData.nilai
          : '',
      feedback: submissionData.feedback || '',
    })

    if (kuisData.mode_kuis === 'manual') {
      const { data: jawabanData, error: jawabanError } = await supabase
        .from('kuis_jawaban')
        .select(`
          *,
          kuis_soal:soal_id (
            id,
            pertanyaan,
            tipe_soal,
            opsi_a,
            opsi_b,
            opsi_c,
            opsi_d,
            jawaban_benar,
            bobot,
            urutan
          )
        `)
        .eq('submission_id', submissionId)

      if (!jawabanError) {
        const sorted = (jawabanData || []).sort(
          (a, b) =>
            Number(a.kuis_soal?.urutan || 0) - Number(b.kuis_soal?.urutan || 0),
        )
        setJawabanList(sorted)
      }
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [id, submissionId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('kuis_submission')
      .update({
        nilai: form.nilai === '' ? null : Number(form.nilai),
        feedback: form.feedback,
        status: 'dinilai',
        graded_at: new Date().toISOString(),
      })
      .eq('id', submissionId)

    if (updateError) {
      setError('Gagal menyimpan nilai.')
      setSaving(false)
      return
    }

    alert('Nilai berhasil disimpan')
    navigate(`/guru/kuis/${id}/hasil`)
  }

  if (loading) {
    return (
      <GuruLayout>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-gray-500">Memuat data penilaian...</p>
        </div>
      </GuruLayout>
    )
  }

  if (error && !submission) {
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
          <h1 className="text-4xl font-bold text-gray-800">Periksa & Nilai</h1>
          <p className="mt-2 text-gray-500">Penilaian hasil kerja siswa</p>
        </div>

        <Link
          to={`/guru/kuis/${id}/hasil`}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-500 px-4 py-3 font-medium text-white hover:bg-gray-600"
        >
          <ArrowLeft size={18} />
          Kembali
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-semibold text-blue-600">
              Informasi Kuis
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Judul Kuis</p>
                <p className="font-medium text-gray-800">{kuis?.judul}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Kelas</p>
                <p className="font-medium text-gray-800">{kuis?.kelas}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Mode Kuis</p>
                <p className="font-medium text-gray-800">
                  {kuis?.mode_kuis === 'file_upload' ? 'File Upload' : 'Manual'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">KKM</p>
                <p className="font-medium text-gray-800">{kuis?.kkm}</p>
              </div>
            </div>

            {kuis?.deskripsi && (
              <div className="mt-5">
                <p className="text-sm text-gray-500">Deskripsi / Petunjuk</p>
                <p className="mt-1 whitespace-pre-line text-gray-700">
                  {kuis.deskripsi}
                </p>
              </div>
            )}

            {kuis?.file_url && (
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

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-semibold text-cyan-600">
              Jawaban / Submission Siswa
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Tanggal Kirim</p>
                <p className="font-medium text-gray-800">
                  {submission?.submitted_at
                    ? new Date(submission.submitted_at).toLocaleString('id-ID')
                    : '-'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p
                  className={`font-medium ${
                    submission?.status === 'dinilai'
                      ? 'text-green-600'
                      : 'text-yellow-600'
                  }`}
                >
                  {submission?.status === 'dinilai'
                    ? 'Sudah Dinilai'
                    : 'Belum Dinilai'}
                </p>
              </div>
            </div>

            {kuis?.mode_kuis === 'file_upload' ? (
              <div className="mt-5">
                {submission?.file_jawaban_url ? (
                  <a
                    href={submission.file_jawaban_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-white hover:bg-cyan-700"
                  >
                    <FileText size={18} />
                    Buka File Jawaban Siswa
                  </a>
                ) : (
                  <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-700">
                    Siswa belum mengupload file jawaban.
                  </div>
                )}
              </div>
            ) : jawabanList.length > 0 ? (
              <div className="mt-5 space-y-4">
                {jawabanList.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <p className="font-semibold text-gray-800">Soal {index + 1}</p>

                    <p className="mt-2 text-sm text-gray-500">Pertanyaan</p>
                    <p className="text-gray-700">
                      {item.kuis_soal?.pertanyaan || '-'}
                    </p>

                    <p className="mt-3 text-sm text-gray-500">Tipe Soal</p>
                    <p className="text-gray-700">
                      {item.kuis_soal?.tipe_soal === 'pg'
                        ? 'Pilihan Ganda'
                        : 'Essay'}
                    </p>

                    <p className="mt-3 text-sm text-gray-500">Jawaban Siswa</p>
                    <div className="rounded-xl border border-gray-200 bg-white p-3 text-gray-700">
                      {item.jawaban_siswa || '-'}
                    </div>

                    <p className="mt-3 text-sm text-gray-500">
                      {item.kuis_soal?.tipe_soal === 'pg'
                        ? 'Kunci Jawaban'
                        : 'Jawaban Guru'}
                    </p>
                    <div className="rounded-xl border border-gray-200 bg-white p-3 text-gray-700">
                      {item.kuis_soal?.jawaban_benar || '-'}
                    </div>

                    <p className="mt-3 text-sm text-gray-500">Bobot</p>
                    <p className="text-gray-700">
                      {item.kuis_soal?.bobot ?? 0}
                    </p>

                    {item.skor !== null && item.skor !== undefined && (
                      <>
                        <p className="mt-3 text-sm text-gray-500">Skor</p>
                        <p className="text-gray-700">{item.skor}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-500">
                Belum ada jawaban siswa yang tersimpan.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 text-xl font-semibold text-gray-800">
              <UserRound size={20} />
              Data Siswa
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Nama</p>
                <p className="font-medium text-gray-800">
                  {submission?.profiles?.nama || 'Siswa'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-800">
                  {submission?.profiles?.email || '-'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-semibold text-blue-600">
              Form Penilaian
            </h2>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-500">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Nilai
                </label>
                <input
                  type="number"
                  name="nilai"
                  value={form.nilai}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Feedback Guru
                </label>
                <textarea
                  name="feedback"
                  value={form.feedback}
                  onChange={handleChange}
                  rows="6"
                  placeholder="Tulis komentar atau masukan untuk siswa..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? 'Menyimpan...' : 'Simpan Nilai'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </GuruLayout>
  )
}

export default NilaiKuis