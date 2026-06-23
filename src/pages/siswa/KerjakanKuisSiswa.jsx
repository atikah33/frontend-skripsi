import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, Upload, CheckCircle2, Clock } from 'lucide-react'
import SiswaLayout from '../../components/siswa/SiswaLayout'
import { supabase } from '../../lib/supabase'

function KerjakanKuisSiswa() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [userData, setUserData] = useState({
    nama: 'Siswa',
    kelas: 'Belum ada kelas',
  })
  const [kuis, setKuis] = useState(null)
  const [soalList, setSoalList] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [jawabanFile, setJawabanFile] = useState(null)
  const [jawabanManual, setJawabanManual] = useState({})
  const [userId, setUserId] = useState(null)
  const [existingSubmission, setExistingSubmission] = useState(null)
  const [submittedJawabanList, setSubmittedJawabanList] = useState([])

  const formatDeadline = (deadline) => {
    if (!deadline) return '-'

    return new Date(deadline).toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  const checkIsLate = () => {
    if (!kuis?.deadline) return false
    return new Date() > new Date(kuis.deadline)
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setError('User tidak ditemukan.')
        setLoading(false)
        return
      }

      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('nama, kelas')
        .eq('id', user.id)
        .single()

      setUserData({
        nama: profile?.nama || 'Siswa',
        kelas: profile?.kelas || 'Belum ada kelas',
      })

      const { data: kuisData, error: kuisError } = await supabase
        .from('kuis')
        .select('*')
        .eq('id', id)
        .eq('is_published', true)
        .single()

      if (kuisError) {
        setError('Kuis tidak ditemukan.')
        setLoading(false)
        return
      }

      setKuis(kuisData)

      const { data: existingSubmissionData, error: submissionError } =
        await supabase
          .from('kuis_submission')
          .select('*')
          .eq('kuis_id', Number(id))
          .eq('siswa_id', user.id)
          .maybeSingle()

      if (submissionError) {
        setError('Gagal memuat data submission.')
        setLoading(false)
        return
      }

      setExistingSubmission(existingSubmissionData || null)

      if (kuisData.mode_kuis === 'manual') {
        const { data: soalData, error: soalError } = await supabase
          .from('kuis_soal')
          .select('*')
          .eq('kuis_id', id)
          .order('urutan', { ascending: true })

        if (soalError) {
          setError('Soal kuis gagal dimuat.')
          setLoading(false)
          return
        }

        setSoalList(soalData || [])

        if (existingSubmissionData) {
          const { data: jawabanData } = await supabase
            .from('kuis_jawaban')
            .select('*')
            .eq('submission_id', existingSubmissionData.id)

          if (jawabanData && jawabanData.length > 0) {
            const jawabanMap = {}

            jawabanData.forEach((item) => {
              jawabanMap[item.soal_id] = item.jawaban_siswa
            })

            setJawabanManual(jawabanMap)

            const mergedAnswers = (soalData || []).map((soal) => {
              const jawabanItem = jawabanData.find(
                (j) => Number(j.soal_id) === Number(soal.id),
              )

              return {
                soal_id: soal.id,
                pertanyaan: soal.pertanyaan,
                tipe_soal: soal.tipe_soal,
                jawaban_benar: soal.jawaban_benar,
                jawaban_siswa: jawabanItem?.jawaban_siswa || '',
                skor: jawabanItem?.skor,
                urutan: soal.urutan,
              }
            })

            setSubmittedJawabanList(
              mergedAnswers.sort(
                (a, b) => Number(a.urutan || 0) - Number(b.urutan || 0),
              ),
            )
          }
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [id])

  const handleChangeJawaban = (soalId, value) => {
    setJawabanManual((prev) => ({
      ...prev,
      [soalId]: value,
    }))
  }

  const upsertSubmission = async (payload) => {
    const { data: existing, error: existingError } = await supabase
      .from('kuis_submission')
      .select('*')
      .eq('kuis_id', Number(id))
      .eq('siswa_id', userId)
      .maybeSingle()

    if (existingError) {
      throw new Error('Gagal mengecek submission lama.')
    }

    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from('kuis_submission')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) {
        throw new Error(updateError.message || 'Gagal update submission.')
      }

      setExistingSubmission(updated)
      return updated
    }

    const { data: inserted, error: insertError } = await supabase
      .from('kuis_submission')
      .insert([
        {
          kuis_id: Number(id),
          siswa_id: userId,
          ...payload,
        },
      ])
      .select()
      .single()

    if (insertError) {
      throw new Error(insertError.message || 'Gagal membuat submission.')
    }

    setExistingSubmission(inserted)
    return inserted
  }

  const handleSubmitFileUpload = async () => {
    if (!jawabanFile) {
      throw new Error('Silakan pilih file jawaban PDF terlebih dahulu.')
    }

    const isPdf =
      jawabanFile.type === 'application/pdf' ||
      jawabanFile.name.toLowerCase().endsWith('.pdf')

    if (!isPdf) {
      throw new Error('File jawaban harus berformat PDF.')
    }

    const filePath = `${id}/${userId}-${Date.now()}.pdf`

    const { error: uploadError } = await supabase.storage
      .from('jawaban-kuis')
      .upload(filePath, jawabanFile, { upsert: true })

    if (uploadError) {
      throw new Error(`Gagal upload jawaban: ${uploadError.message}`)
    }

    const { data: publicUrlData } = supabase.storage
      .from('jawaban-kuis')
      .getPublicUrl(filePath)

    await upsertSubmission({
      status: 'dikumpulkan',
      nilai: null,
      feedback: null,
      submitted_at: new Date().toISOString(),
      graded_at: null,
      file_jawaban_url: publicUrlData.publicUrl,
      is_late: checkIsLate(),
    })
  }

  const handleSubmitManual = async () => {
    if (soalList.length === 0) {
      throw new Error('Soal kuis tidak tersedia.')
    }

    for (const soal of soalList) {
      const jawaban = jawabanManual[soal.id]

      if (!jawaban || String(jawaban).trim() === '') {
        throw new Error(`Soal nomor ${soal.urutan || soal.id} belum dijawab.`)
      }
    }

    const hasEssay = soalList.some((soal) => soal.tipe_soal === 'essay')
    const totalBobot = soalList.reduce(
      (acc, soal) => acc + Number(soal.bobot || 0),
      0,
    )

    let skorDapat = 0

    const jawabanRows = soalList.map((soal) => {
      const jawabanSiswa = jawabanManual[soal.id]
      let skor = null

      if (soal.tipe_soal === 'pg') {
        const benar =
          String(jawabanSiswa).trim().toUpperCase() ===
          String(soal.jawaban_benar || '').trim().toUpperCase()

        skor = benar ? Number(soal.bobot || 0) : 0
        skorDapat += skor
      }

      return {
        soal_id: soal.id,
        jawaban_siswa: String(jawabanSiswa).trim(),
        skor,
      }
    })

    let nilaiFinal = null
    let statusFinal = 'dikumpulkan'
    let gradedAt = null

    if (!hasEssay) {
      nilaiFinal =
        totalBobot > 0 ? Number(((skorDapat / totalBobot) * 100).toFixed(2)) : 0
      statusFinal = 'dinilai'
      gradedAt = new Date().toISOString()
    }

    const submission = await upsertSubmission({
      status: statusFinal,
      nilai: nilaiFinal,
      feedback: null,
      submitted_at: new Date().toISOString(),
      graded_at: gradedAt,
      file_jawaban_url: null,
      is_late: checkIsLate(),
    })

    const { error: deleteOldAnswersError } = await supabase
      .from('kuis_jawaban')
      .delete()
      .eq('submission_id', submission.id)

    if (deleteOldAnswersError) {
      throw new Error('Gagal menghapus jawaban lama.')
    }

    const rowsToInsert = jawabanRows.map((row) => ({
      submission_id: submission.id,
      soal_id: row.soal_id,
      jawaban_siswa: row.jawaban_siswa,
      skor: row.skor,
    }))

    const { error: insertAnswersError } = await supabase
      .from('kuis_jawaban')
      .insert(rowsToInsert)

    if (insertAnswersError) {
      throw new Error(insertAnswersError.message || 'Gagal menyimpan jawaban.')
    }

    const mergedAnswers = soalList.map((soal) => {
      const jawabanItem = jawabanRows.find(
        (j) => Number(j.soal_id) === Number(soal.id),
      )

      return {
        soal_id: soal.id,
        pertanyaan: soal.pertanyaan,
        tipe_soal: soal.tipe_soal,
        jawaban_benar: soal.jawaban_benar,
        jawaban_siswa: jawabanItem?.jawaban_siswa || '',
        skor: jawabanItem?.skor,
        urutan: soal.urutan,
      }
    })

    setSubmittedJawabanList(
      mergedAnswers.sort(
        (a, b) => Number(a.urutan || 0) - Number(b.urutan || 0),
      ),
    )

    const { data: refreshedSubmission } = await supabase
      .from('kuis_submission')
      .select('*')
      .eq('id', submission.id)
      .single()

    if (refreshedSubmission) {
      setExistingSubmission(refreshedSubmission)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (!userId) {
        throw new Error('User belum siap. Coba refresh halaman.')
      }

      if (existingSubmission) {
        throw new Error('Jawaban sudah dikirim dan tidak bisa dikirim ulang.')
      }

      if (kuis.mode_kuis === 'file_upload') {
        await handleSubmitFileUpload()
        alert('Jawaban PDF berhasil dikirim.')
      } else {
        await handleSubmitManual()
        alert('Jawaban berhasil dikirim.')
      }

      navigate(`/siswa/kuis/${id}`)
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat mengirim jawaban.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SiswaLayout nama={userData.nama} kelas={userData.kelas}>
        <div className="rounded-2xl bg-white p-6 text-gray-500 shadow-sm">
          Memuat kuis...
        </div>
      </SiswaLayout>
    )
  }

  if (error && !kuis) {
    return (
      <SiswaLayout nama={userData.nama} kelas={userData.kelas}>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-500 shadow-sm">
          {error}
        </div>
      </SiswaLayout>
    )
  }

  return (
    <SiswaLayout nama={userData.nama} kelas={userData.kelas}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">{kuis.judul}</h1>
        </div>

        <Link
          to="/siswa/materi-kuis"
          className="inline-flex items-center gap-2 rounded-xl bg-gray-500 px-4 py-3 font-medium text-white hover:bg-gray-600"
        >
          <ArrowLeft size={18} />
          Kembali
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-gray-500">Kelas</p>
              <p className="font-medium text-gray-800">{kuis.kelas}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">KKM</p>
              <p className="font-medium text-gray-800">{kuis.kkm}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Mode Kuis</p>
              <p className="font-medium text-gray-800">
                {kuis.mode_kuis === 'file_upload' ? 'File Upload' : 'Manual'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Deadline</p>
              <p
                className={`font-medium ${
                  kuis.deadline && new Date() > new Date(kuis.deadline)
                    ? 'text-red-600'
                    : 'text-gray-800'
                }`}
              >
                {kuis.deadline ? formatDeadline(kuis.deadline) : '-'}
              </p>
            </div>
          </div>
        </div>

        {kuis.deadline && (
          <div
            className={`rounded-2xl border p-4 shadow-sm ${
              new Date() > new Date(kuis.deadline)
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-yellow-200 bg-yellow-50 text-yellow-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock size={18} />
              <p className="font-semibold">
                Deadline kuis: {formatDeadline(kuis.deadline)}
              </p>
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-gray-500">
            Petunjuk / Deskripsi Kuis
          </p>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="whitespace-pre-line text-gray-700">
              {kuis.deskripsi || 'Kerjakan kuis dengan teliti.'}
            </p>
          </div>
        </div>

        {existingSubmission && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-1 text-green-600" size={24} />
              <div className="w-full">
                <p className="text-lg font-bold text-green-700">
                  Jawaban kamu sudah dikirim.
                </p>

                <p className="mt-2 text-sm text-green-700">
                  Status:{' '}
                  {existingSubmission.status === 'dinilai'
                    ? 'Sudah dinilai'
                    : 'Menunggu penilaian guru'}
                </p>

                <p
                  className={`mt-2 text-sm font-semibold ${
                    existingSubmission.is_late ? 'text-red-600' : 'text-green-700'
                  }`}
                >
                  Ketepatan:{' '}
                  {existingSubmission.is_late ? 'Terlambat' : 'Tepat Waktu'}
                </p>

                {existingSubmission.nilai !== null &&
                  existingSubmission.nilai !== undefined && (
                    <p className="mt-3 text-sm font-semibold text-gray-700">
                      Nilai: {existingSubmission.nilai}
                    </p>
                  )}

                {existingSubmission.feedback && (
                  <div className="mt-4 rounded-xl border border-green-200 bg-white p-4">
                    <p className="text-sm font-semibold text-gray-700">
                      Feedback Guru
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {existingSubmission.feedback}
                    </p>
                  </div>
                )}

                {existingSubmission.file_jawaban_url && (
                  <a
                    href={existingSubmission.file_jawaban_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                  >
                    <FileText size={16} />
                    Lihat File Jawaban Saya
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {existingSubmission &&
          kuis.mode_kuis === 'manual' &&
          submittedJawabanList.length > 0 && (
            <div className="space-y-4">
              {submittedJawabanList.map((item, index) => (
                <div
                  key={item.soal_id}
                  className="rounded-2xl bg-white p-6 shadow-sm"
                >
                  <h2 className="mb-4 text-xl font-bold text-gray-800">
                    Soal {index + 1}
                  </h2>

                  <div className="mb-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-gray-700">{item.pertanyaan}</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Tipe Soal</p>
                      <p className="font-medium text-gray-800">
                        {item.tipe_soal === 'pg' ? 'Pilihan Ganda' : 'Essay'}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Jawaban Saya</p>
                      <div className="mt-1 rounded-xl border border-gray-200 bg-white p-3 text-gray-700">
                        {item.jawaban_siswa || '-'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        {!existingSubmission && (
          <>
            {kuis.mode_kuis === 'file_upload' ? (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-2xl font-bold text-gray-800">
                  Soal Kuis
                </h2>

                {kuis.file_url && (
                  <div className="mb-6">
                    <a
                      href={kuis.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
                    >
                      <FileText size={18} />
                      Buka File Soal
                    </a>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Upload Jawaban PDF
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setJawabanFile(e.target.files[0])}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3"
                  />
                  {jawabanFile && (
                    <p className="mt-2 text-sm text-gray-500">
                      File dipilih: {jawabanFile.name}
                    </p>
                  )}
                </div>
              </div>
            ) : soalList.length > 0 ? (
              soalList.map((soal, index) => (
                <div key={soal.id} className="rounded-2xl bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-bold text-gray-800">
                    Soal {index + 1}
                  </h2>

                  <div className="mb-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-gray-700">{soal.pertanyaan}</p>
                  </div>

                  {soal.tipe_soal === 'pg' ? (
                    <div className="space-y-3">
                      {[
                        { label: 'A', value: soal.opsi_a },
                        { label: 'B', value: soal.opsi_b },
                        { label: 'C', value: soal.opsi_c },
                        { label: 'D', value: soal.opsi_d },
                      ].map((opsi) => (
                        <label
                          key={opsi.label}
                          className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 hover:bg-gray-50"
                        >
                          <input
                            type="radio"
                            name={`soal-${soal.id}`}
                            value={opsi.label}
                            checked={jawabanManual[soal.id] === opsi.label}
                            onChange={(e) =>
                              handleChangeJawaban(soal.id, e.target.value)
                            }
                          />
                          <span>
                            {opsi.label}. {opsi.value}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      rows="5"
                      value={jawabanManual[soal.id] || ''}
                      onChange={(e) =>
                        handleChangeJawaban(soal.id, e.target.value)
                      }
                      className="w-full rounded-xl border border-gray-300 px-4 py-3"
                      placeholder="Tulis jawabanmu di sini..."
                    />
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-white p-6 text-gray-500 shadow-sm">
                Belum ada soal untuk kuis ini.
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-6 py-3 font-semibold text-white hover:bg-green-600 disabled:opacity-50"
              >
                <Upload size={18} />
                {saving ? 'Mengirim...' : 'Kirim Jawaban'}
              </button>
            </div>
          </>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-500 shadow-sm">
            {error}
          </div>
        )}
      </form>
    </SiswaLayout>
  )
}

export default KerjakanKuisSiswa