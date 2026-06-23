import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, PlusCircle, Trash2, Upload, CheckCircle } from 'lucide-react'
import GuruLayout from '../../components/guru/GuruLayout'
import { supabase } from '../../lib/supabase'

const API_URL = 'http://localhost:3000'

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

const createEmptyQuestion = (order = 1) => ({
  pertanyaan: '',
  tipe_soal: 'pg',
  opsi_a: '',
  opsi_b: '',
  opsi_c: '',
  opsi_d: '',
  jawaban_benar: '',
  bobot: 10,
  urutan: order,
})

function TambahKuis() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    judul: '',
    deskripsi: '',
    kelas_list: [],
    kkm: 70,
    deadline: '',
    mode_kuis: 'manual',
    is_published: true,
    file: null,
    import_file: null,
  })

  const [questions, setQuestions] = useState([createEmptyQuestion(1)])
  const [importedQuestions, setImportedQuestions] = useState([])
  const [importSuccess, setImportSuccess] = useState('')
  const [loading, setLoading] = useState(false)
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

    if (name === 'mode_kuis') {
      setImportedQuestions([])
      setImportSuccess('')
      setError('')
    }
  }

  const handleKelasToggle = (kelas) => {
    setForm((prev) => {
      const sudahAda = prev.kelas_list.includes(kelas)

      return {
        ...prev,
        kelas_list: sudahAda
          ? prev.kelas_list.filter((item) => item !== kelas)
          : [...prev.kelas_list, kelas],
      }
    })
  }

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions]
    updated[index][field] = value
    setQuestions(updated)
  }

  const addQuestion = () => {
    setQuestions((prev) => [...prev, createEmptyQuestion(prev.length + 1)])
  }

  const removeQuestion = (index) => {
    if (questions.length === 1) return
    const updated = questions.filter((_, i) => i !== index)
    setQuestions(updated.map((q, i) => ({ ...q, urutan: i + 1 })))
  }

  const getCurrentUser = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('User login tidak ditemukan.')
    }

    return user
  }

  const handleImportKuisPerKelas = async (user, kelasItem) => {
    const formData = new FormData()
    formData.append('guru_id', user.id)
    formData.append('file', form.import_file)
    formData.append('judul', form.judul)
    formData.append('kelas', kelasItem)
    formData.append('deskripsi', form.deskripsi || '')
    formData.append('kkm', form.kkm || 70)
    formData.append(
      'deadline',
      form.deadline ? new Date(form.deadline).toISOString() : '',
    )
    formData.append('is_published', form.is_published ? 'true' : 'false')

    const response = await fetch(`${API_URL}/api/kuis/import`, {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(
        result.detail || result.error || `Gagal import kuis untuk ${kelasItem}.`,
      )
    }

    return result
  }

  const uploadFileKuis = async (user) => {
    if (!form.file) return null

    const fileExt = form.file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExt}`
    const filePath = `guru-${user.id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('kuis-files')
      .upload(filePath, form.file)

    if (uploadError) {
      throw new Error(`Gagal upload file kuis: ${uploadError.message}`)
    }

    const { data: publicUrlData } = supabase.storage
      .from('kuis-files')
      .getPublicUrl(filePath)

    return publicUrlData.publicUrl
  }

  const insertKuisPerKelas = async (user, kelasItem, fileUrl = null) => {
    const kuisPayload = {
      guru_id: user.id,
      judul: form.judul,
      deskripsi: form.deskripsi,
      kelas: kelasItem,
      kkm: Number(form.kkm),
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      mode_kuis: form.mode_kuis,
      file_url: fileUrl,
      is_published: form.is_published,
    }

    const { data: kuisData, error: kuisError } = await supabase
      .from('kuis')
      .insert([kuisPayload])
      .select()
      .single()

    if (kuisError) {
      throw new Error(`Gagal menyimpan kuis ${kelasItem}: ${kuisError.message}`)
    }

    if (form.mode_kuis === 'manual') {
      const soalPayload = questions.map((q, index) => ({
        kuis_id: kuisData.id,
        pertanyaan: q.pertanyaan,
        tipe_soal: q.tipe_soal,
        opsi_a: q.tipe_soal === 'pg' ? q.opsi_a : null,
        opsi_b: q.tipe_soal === 'pg' ? q.opsi_b : null,
        opsi_c: q.tipe_soal === 'pg' ? q.opsi_c : null,
        opsi_d: q.tipe_soal === 'pg' ? q.opsi_d : null,
        jawaban_benar: q.jawaban_benar || null,
        bobot: Number(q.bobot),
        urutan: index + 1,
      }))

      const { error: soalError } = await supabase
        .from('kuis_soal')
        .insert(soalPayload)

      if (soalError) {
        throw new Error(
          `Kuis ${kelasItem} tersimpan, tapi soal gagal disimpan: ${soalError.message}`,
        )
      }
    }

    return kuisData
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setImportSuccess('')
    setImportedQuestions([])

    try {
      if (!form.judul || form.kelas_list.length === 0 || !form.kkm) {
        throw new Error('Judul, minimal 1 kelas, dan KKM wajib diisi.')
      }

      const user = await getCurrentUser()

      if (form.mode_kuis === 'import') {
        if (!form.import_file) {
          throw new Error('Silakan pilih file Excel / DOCX / PDF terlebih dahulu.')
        }

        const results = []

        for (const kelasItem of form.kelas_list) {
          const result = await handleImportKuisPerKelas(user, kelasItem)
          results.push(result)
        }

        setImportedQuestions(results[0]?.soal || [])
        setImportSuccess(
          `Kuis berhasil diimport untuk ${form.kelas_list.length} kelas. Total kuis dibuat: ${results.length}`,
        )
        return
      }

      let fileUrl = null

      if (form.mode_kuis === 'file_upload') {
        if (!form.file) {
          throw new Error('Silakan upload file kuis terlebih dahulu.')
        }

        fileUrl = await uploadFileKuis(user)
      }

      for (const kelasItem of form.kelas_list) {
        await insertKuisPerKelas(user, kelasItem, fileUrl)
      }

      alert(`Kuis berhasil disimpan untuk ${form.kelas_list.length} kelas.`)
      navigate('/guru/kelola-materi')
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <GuruLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-4xl font-bold text-gray-800">Buat Kuis</h1>

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
                KKM
              </label>
              <input
                type="number"
                name="kkm"
                value={form.kkm}
                onChange={handleFormChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3"
                min="0"
                max="100"
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
                Pilih Kelas
                </label>
                
                <div className="rounded-2xl border border-gray-300 bg-white p-4">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {form.kelas_list.length > 0 ? (
                      form.kelas_list.map((kelasItem) => (
                      <span
                      key={kelasItem}
                      className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700"
                      >
                        {kelasItem}
                        <button
                        type="button"
                        onClick={() => handleKelasToggle(kelasItem)}
                        className="text-blue-700 hover:text-red-500"
                        >
                          ×
                          </button>
                          </span>
                          ))
                        ) : (
                        <p className="text-sm text-gray-400">
                          Belum ada kelas dipilih.
                          </p>
                        )}
                        </div>
                        
                        <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) handleKelasToggle(e.target.value)
                          }}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3"
                        >
                          <option value="">Tambah kelas...</option>
                          {kelasOptions
                          .filter((kelasItem) => !form.kelas_list.includes(kelasItem))
                          .map((kelasItem) => (
                          <option key={kelasItem} value={kelasItem}>
                            {kelasItem}
                            </option>
                          ))}
                          </select>
                          
                          <p className="mt-2 text-sm text-gray-500">
                            Dipilih: {form.kelas_list.length} kelas
                          </p>
                        </div>
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
                <option value="import">Import Excel / DOCX / PDF</option>
                <option value="file_upload">Upload File Biasa</option>
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

            {form.mode_kuis === 'import' && (
              <div className="md:col-span-3 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Upload File Soal Otomatis
                </label>
                <input
                  type="file"
                  name="import_file"
                  onChange={handleFormChange}
                  accept=".xlsx,.xls,.docx,.pdf"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
                  required
                />
              </div>
            )}

            {form.mode_kuis === 'file_upload' && (
              <div className="md:col-span-3">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Upload File Kuis Biasa
                </label>
                <input
                  type="file"
                  name="file"
                  onChange={handleFormChange}
                  accept=".pdf,.ppt,.pptx,.doc,.docx"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3"
                  required
                />
              </div>
            )}
          </div>
        </div>

        {form.mode_kuis === 'manual' &&
          questions.map((question, index) => (
            <div key={index} className="rounded-2xl bg-white shadow-sm">
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
                      {['a', 'b', 'c', 'd'].map((opsi) => (
                        <input
                          key={opsi}
                          type="text"
                          placeholder={`Jawaban ${opsi.toUpperCase()}`}
                          value={question[`opsi_${opsi}`]}
                          onChange={(e) =>
                            handleQuestionChange(index, `opsi_${opsi}`, e.target.value)
                          }
                          className="w-full rounded-xl border border-gray-300 px-4 py-3"
                          required
                        />
                      ))}

                      <select
                        value={question.jawaban_benar}
                        onChange={(e) =>
                          handleQuestionChange(index, 'jawaban_benar', e.target.value)
                        }
                        className="w-full rounded-xl border border-gray-300 px-4 py-3"
                        required
                      >
                        <option value="">Pilih Jawaban Benar</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <input
                        type="text"
                        placeholder="Kunci jawaban / acuan guru"
                        value={question.jawaban_benar}
                        onChange={(e) =>
                          handleQuestionChange(index, 'jawaban_benar', e.target.value)
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

        {importSuccess && (
          <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-5 text-green-700">
            <CheckCircle size={22} />
            <p className="font-semibold">{importSuccess}</p>
          </div>
        )}

        {importedQuestions.length > 0 && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-2xl font-bold text-gray-800">
              Preview Soal Hasil Import
            </h2>
            
            <div className="space-y-5">
              {importedQuestions.map((soal, index) => (
                <div
                key={index}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-5"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800">Soal {index + 1}</h3>
                    
                    <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      soal.tipe_soal === 'pg'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                    }`}
                    >
                      {soal.tipe_soal === 'pg' ? 'Pilihan Ganda' : 'Essay'}
                      </span>
                      </div>
                      
                      <p className="mb-4 whitespace-pre-line text-gray-800">
                        {soal.pertanyaan}
                      </p>
                      
                      {soal.tipe_soal === 'pg' && (
                        <div className="mb-4 grid gap-2 md:grid-cols-2">
                          <p>A. {soal.opsi_a || '-'}</p>
                          <p>B. {soal.opsi_b || '-'}</p>
                          <p>C. {soal.opsi_c || '-'}</p>
                          <p>D. {soal.opsi_d || '-'}</p>
                        </div>
                      )}
                      
                      <div className="rounded-xl bg-white p-4 text-sm text-gray-700">
                        <p>
                          <span className="font-semibold">
                            Kunci / Jawaban Acuan:
                          </span>{' '}
                          {soal.jawaban_benar || '-'}
                        </p>
                        
                        <p className="mt-1">
                          <span className="font-semibold">Bobot:</span>{' '}
                          {soal.bobot || 10}
                        </p>
                      </div>
                    </div>
                  ))}

    </div>

    <div className="mt-6 flex justify-end">
      <Link
        to="/guru/kelola-materi"
        className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
      >
        Selesai
      </Link>
    </div>
  </div>
)}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || importedQuestions.length > 0}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {form.mode_kuis === 'import' && <Upload size={18} />}
            {loading
              ? form.mode_kuis === 'import'
                ? 'Mengimport...'
                : 'Menyimpan...'
              : form.mode_kuis === 'import'
              ? 'Import Kuis'
              : 'Simpan Kuis'}
          </button>
        </div>
      </form>
    </GuruLayout>
  )
}

export default TambahKuis