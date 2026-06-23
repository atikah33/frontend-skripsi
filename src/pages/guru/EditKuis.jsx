import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, PlusCircle, Trash2, FileText } from 'lucide-react'
import GuruLayout from '../../components/guru/GuruLayout'
import { supabase } from '../../lib/supabase'

const createEmptyQuestion = (order = 1) => ({
  id: null,
  pertanyaan: '',
  tipe_soal: 'pg',
  opsi_a: '',
  opsi_b: '',
  opsi_c: '',
  opsi_d: '',
  jawaban_benar: '',
  bobot: 10,
  urutan: order,
  isNew: true,
})

const toDatetimeLocal = (dateString) => {
  if (!dateString) return ''

  const date = new Date(dateString)
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60000)

  return localDate.toISOString().slice(0, 16)
}

function EditKuis() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    judul: '',
    deskripsi: '',
    kelas: '',
    kkm: 70,
    mode_kuis: 'manual',
    is_published: true,
    file: null,
    file_url: '',
    deadline: '',
  })

  const [questions, setQuestions] = useState([createEmptyQuestion(1)])
  const [deletedQuestionIds, setDeletedQuestionIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleFormChange = (e) => {
    const { name, value, type, checked, files } = e.target

    setForm((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : type === 'file'
          ? files[0]
          : value,
    }))
  }

  const handleQuestionChange = (index, field, value) => {
    setQuestions((prev) => {
      const updated = [...prev]

      updated[index] = {
        ...updated[index],
        [field]: value,
      }

      if (field === 'tipe_soal' && value === 'essay') {
        updated[index].opsi_a = ''
        updated[index].opsi_b = ''
        updated[index].opsi_c = ''
        updated[index].opsi_d = ''
      }

      return updated
    })
  }

  const addQuestion = () => {
    setQuestions((prev) => [...prev, createEmptyQuestion(prev.length + 1)])
  }

  const removeQuestion = (index) => {
    if (questions.length === 1) return

    const item = questions[index]

    if (item.id) {
      setDeletedQuestionIds((prev) => [...prev, item.id])
    }

    const updated = questions.filter((_, i) => i !== index)
    setQuestions(updated.map((q, i) => ({ ...q, urutan: i + 1 })))
  }

  const fetchKuis = async () => {
    setLoading(true)
    setError('')

    const { data: kuisData, error: kuisError } = await supabase
      .from('kuis')
      .select('*')
      .eq('id', id)
      .single()

    if (kuisError) {
      setError(`Gagal mengambil data kuis: ${kuisError.message}`)
      setLoading(false)
      return
    }

    setForm({
      judul: kuisData.judul || '',
      deskripsi: kuisData.deskripsi || '',
      kelas: kuisData.kelas || '',
      kkm: kuisData.kkm || 70,
      mode_kuis: kuisData.mode_kuis || 'manual',
      is_published: kuisData.is_published ?? false,
      file: null,
      file_url: kuisData.file_url || '',
      deadline: toDatetimeLocal(kuisData.deadline),
    })

    if (kuisData.mode_kuis === 'manual') {
      const { data: soalData, error: soalError } = await supabase
        .from('kuis_soal')
        .select('*')
        .eq('kuis_id', id)
        .order('urutan', { ascending: true })

      if (soalError) {
        setError(`Data kuis dimuat, tapi soal gagal dimuat: ${soalError.message}`)
        setQuestions([createEmptyQuestion(1)])
        setLoading(false)
        return
      }

      if (soalData && soalData.length > 0) {
        setQuestions(
          soalData.map((soal, index) => ({
            id: soal.id,
            pertanyaan: soal.pertanyaan || '',
            tipe_soal: soal.tipe_soal || 'pg',
            opsi_a: soal.opsi_a || '',
            opsi_b: soal.opsi_b || '',
            opsi_c: soal.opsi_c || '',
            opsi_d: soal.opsi_d || '',
            jawaban_benar: soal.jawaban_benar || '',
            bobot: soal.bobot || 10,
            urutan: soal.urutan || index + 1,
            isNew: false,
          })),
        )
      } else {
        setQuestions([createEmptyQuestion(1)])
      }
    } else {
      setQuestions([createEmptyQuestion(1)])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchKuis()
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('User login tidak ditemukan.')
      setSaving(false)
      return
    }

    let fileUrl = form.file_url || null

    if (form.mode_kuis === 'file_upload' && form.file) {
      const fileExt = form.file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`
      const filePath = `guru-${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('kuis-files')
        .upload(filePath, form.file)

      if (uploadError) {
        setError(`Gagal upload file kuis: ${uploadError.message}`)
        setSaving(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('kuis-files')
        .getPublicUrl(filePath)

      fileUrl = publicUrlData.publicUrl
    }

    const kuisPayload = {
      judul: form.judul,
      deskripsi: form.deskripsi,
      kelas: form.kelas,
      kkm: Number(form.kkm),
      mode_kuis: form.mode_kuis,
      file_url: form.mode_kuis === 'file_upload' ? fileUrl : null,
      is_published: form.is_published,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      updated_at: new Date().toISOString(),
    }

    const { error: kuisError } = await supabase
      .from('kuis')
      .update(kuisPayload)
      .eq('id', id)

    if (kuisError) {
      setError(`Gagal mengupdate kuis: ${kuisError.message}`)
      setSaving(false)
      return
    }

    if (form.mode_kuis === 'manual') {
      if (deletedQuestionIds.length > 0) {
        const { error: deleteSoalError } = await supabase
          .from('kuis_soal')
          .delete()
          .in('id', deletedQuestionIds)

        if (deleteSoalError) {
          setError(`Kuis diupdate, tapi hapus soal gagal: ${deleteSoalError.message}`)
          setSaving(false)
          return
        }
      }

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]

        const soalPayload = {
          kuis_id: Number(id),
          pertanyaan: q.pertanyaan,
          tipe_soal: q.tipe_soal,
          opsi_a: q.tipe_soal === 'pg' ? q.opsi_a || null : null,
          opsi_b: q.tipe_soal === 'pg' ? q.opsi_b || null : null,
          opsi_c: q.tipe_soal === 'pg' ? q.opsi_c || null : null,
          opsi_d: q.tipe_soal === 'pg' ? q.opsi_d || null : null,
          jawaban_benar: q.jawaban_benar || null,
          bobot: Number(q.bobot),
          urutan: i + 1,
        }

        if (q.id) {
          const { error: updateSoalError } = await supabase
            .from('kuis_soal')
            .update(soalPayload)
            .eq('id', q.id)

          if (updateSoalError) {
            setError(`Kuis diupdate, tapi update soal gagal: ${updateSoalError.message}`)
            setSaving(false)
            return
          }
        } else {
          const { error: insertSoalError } = await supabase
            .from('kuis_soal')
            .insert([soalPayload])

          if (insertSoalError) {
            setError(`Kuis diupdate, tapi tambah soal gagal: ${insertSoalError.message}`)
            setSaving(false)
            return
          }
        }
      }
    } else {
      const { error: deleteAllSoalError } = await supabase
        .from('kuis_soal')
        .delete()
        .eq('kuis_id', id)

      if (deleteAllSoalError) {
        setError(`Kuis file berhasil diupdate, tapi hapus soal lama gagal: ${deleteAllSoalError.message}`)
        setSaving(false)
        return
      }
    }

    alert('Kuis berhasil diupdate')
    navigate('/guru/kelola-materi')
  }

  if (loading) {
    return (
      <GuruLayout>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-gray-500">Memuat data kuis...</p>
        </div>
      </GuruLayout>
    )
  }

  return (
    <GuruLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center gap-3 text-4xl font-bold text-gray-800">
          <Pencil size={34} />
          Edit Kuis
        </h1>

        <Link
          to="/guru/kelola-materi"
          className="inline-flex items-center gap-2 rounded-xl bg-gray-500 px-4 py-3 font-medium text-white hover:bg-gray-600"
        >
          <ArrowLeft size={18} />
          Kembali
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl bg-white shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="text-lg font-semibold text-blue-600">Informasi Kuis</h2>
          </div>

          <div className="grid gap-5 p-5 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Judul Kuis
              </label>
              <input
                type="text"
                name="judul"
                value={form.judul}
                onChange={handleFormChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Kelas
              </label>
              <select
                name="kelas"
                value={form.kelas}
                onChange={handleFormChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3"
                required
              >
                <option value="">Pilih Kelas</option>
                <option value="Kelas X IPA 1">Kelas X IPA 1</option>
                <option value="Kelas X IPA 2">Kelas X IPA 2</option>
                <option value="Kelas X IPA 3">Kelas X IPA 3</option>
                <option value="Kelas X IPS 1">Kelas X IPS 1</option>
                <option value="Kelas X IPS 2">Kelas X IPS 2</option>
                <option value="Kelas X IPS 3">Kelas X IPS 3</option>
                <option value="Kelas XI IPA 1">Kelas XI IPA 1</option>
                <option value="Kelas XI IPA 2">Kelas XI IPA 2</option>
                <option value="Kelas XI IPA 3">Kelas XI IPA 3</option>
                <option value="Kelas XI IPS 1">Kelas XI IPS 1</option>
                <option value="Kelas XI IPS 2">Kelas XI IPS 2</option>
                <option value="Kelas XI IPS 3">Kelas XI IPS 3</option>
                <option value="Kelas XII IPA 1">Kelas XII IPA 1</option>
                <option value="Kelas XII IPA 2">Kelas XII IPA 2</option>
                <option value="Kelas XII IPA 3">Kelas XII IPA 3</option>
                <option value="Kelas XII IPS 1">Kelas XII IPS 1</option>
                <option value="Kelas XII IPS 2">Kelas XII IPS 2</option>
                <option value="Kelas XII IPS 3">Kelas XII IPS 3</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                KKM
              </label>
              <input
                type="number"
                name="kkm"
                value={form.kkm}
                onChange={handleFormChange}
                min="0"
                max="100"
                className="w-full rounded-xl border border-gray-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Deadline Kuis
              </label>
              <input
                type="datetime-local"
                name="deadline"
                value={form.deadline}
                onChange={handleFormChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3"
              />
            </div>

            <div className="md:col-span-3">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Deskripsi / Petunjuk
              </label>
              <textarea
                name="deskripsi"
                value={form.deskripsi}
                onChange={handleFormChange}
                rows="3"
                className="w-full rounded-xl border border-gray-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Mode Kuis
              </label>
              <select
                name="mode_kuis"
                value={form.mode_kuis}
                onChange={handleFormChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3"
              >
                <option value="manual">Manual (PG / Essay)</option>
                <option value="file_upload">Upload File</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="is_published"
                  checked={form.is_published}
                  onChange={handleFormChange}
                />
                Publish sekarang
              </label>
            </div>

            {form.mode_kuis === 'file_upload' && (
              <div className="md:col-span-3 space-y-4">
                {form.file_url && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <a
                      href={form.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-blue-700 underline"
                    >
                      <FileText size={18} />
                      Lihat file kuis saat ini
                    </a>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Ganti File Kuis
                  </label>
                  <input
                    type="file"
                    name="file"
                    onChange={handleFormChange}
                    accept=".pdf,.ppt,.pptx,.doc,.docx"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {form.mode_kuis === 'manual' &&
          questions.map((question, index) => (
            <div
              key={question.id ?? `new-${index}`}
              className="rounded-2xl bg-white shadow-sm"
            >
              <div className="flex items-center justify-between border-b px-5 py-4">
                <h2 className="text-lg font-semibold text-cyan-600">
                  Soal No. {index + 1}
                </h2>

                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(index)}
                    className="rounded-full bg-red-500 p-2 text-white hover:bg-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="grid gap-5 p-5 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Pertanyaan
                  </label>
                  <textarea
                    value={question.pertanyaan}
                    onChange={(e) =>
                      handleQuestionChange(index, 'pertanyaan', e.target.value)
                    }
                    rows="4"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Tipe Soal
                  </label>
                  <select
                    value={question.tipe_soal}
                    onChange={(e) =>
                      handleQuestionChange(index, 'tipe_soal', e.target.value)
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3"
                  >
                    <option value="pg">Pilihan Ganda (PG)</option>
                    <option value="essay">Essay / Isian Singkat</option>
                  </select>

                  {question.tipe_soal === 'pg' ? (
                    <div className="mt-4 space-y-3">
                      <input
                        type="text"
                        placeholder="Jawaban A"
                        value={question.opsi_a}
                        onChange={(e) =>
                          handleQuestionChange(index, 'opsi_a', e.target.value)
                        }
                        className="w-full rounded-xl border border-gray-300 px-4 py-3"
                      />
                      <input
                        type="text"
                        placeholder="Jawaban B"
                        value={question.opsi_b}
                        onChange={(e) =>
                          handleQuestionChange(index, 'opsi_b', e.target.value)
                        }
                        className="w-full rounded-xl border border-gray-300 px-4 py-3"
                      />
                      <input
                        type="text"
                        placeholder="Jawaban C"
                        value={question.opsi_c}
                        onChange={(e) =>
                          handleQuestionChange(index, 'opsi_c', e.target.value)
                        }
                        className="w-full rounded-xl border border-gray-300 px-4 py-3"
                      />
                      <input
                        type="text"
                        placeholder="Jawaban D"
                        value={question.opsi_d}
                        onChange={(e) =>
                          handleQuestionChange(index, 'opsi_d', e.target.value)
                        }
                        className="w-full rounded-xl border border-gray-300 px-4 py-3"
                      />

                      <select
                        value={question.jawaban_benar}
                        onChange={(e) =>
                          handleQuestionChange(
                            index,
                            'jawaban_benar',
                            e.target.value,
                          )
                        }
                        className="w-full rounded-xl border border-gray-300 px-4 py-3"
                      >
                        <option value="">Pilih Jawaban Benar</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <input
                        type="text"
                        placeholder="Kunci jawaban / acuan guru"
                        value={question.jawaban_benar}
                        onChange={(e) =>
                          handleQuestionChange(
                            index,
                            'jawaban_benar',
                            e.target.value,
                          )
                        }
                        className="w-full rounded-xl border border-gray-300 px-4 py-3"
                      />
                    </div>
                  )}

                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Bobot Nilai
                    </label>
                    <input
                      type="number"
                      value={question.bobot}
                      onChange={(e) =>
                        handleQuestionChange(index, 'bobot', e.target.value)
                      }
                      className="w-full rounded-xl border border-gray-300 px-4 py-3"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

        {form.mode_kuis === 'manual' && (
          <button
            type="button"
            onClick={addQuestion}
            className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-5 py-3 font-semibold text-white hover:bg-green-600"
          >
            <PlusCircle size={18} />
            Tambah Soal Baru
          </button>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-500">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Update Kuis'}
          </button>
        </div>
      </form>
    </GuruLayout>
  )
}

export default EditKuis