import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, ArrowLeft } from 'lucide-react'
import GuruLayout from '../../components/guru/GuruLayout'
import { supabase } from '../../lib/supabase'

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

function TambahMateri() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    judul: '',
    deskripsi: '',
    kelas_list: [],
    tanggalTayang: '',
    youtubeLink: '',
    linkTambahan: '',
    published: true,
    file: null,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!form.judul || !form.deskripsi || form.kelas_list.length === 0) {
        throw new Error('Judul, isi materi, dan minimal 1 kelas wajib diisi.')
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User login tidak ditemukan.')
      }

      let fileUrl = null

      if (form.file) {
        const fileExt = form.file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${fileExt}`
        const filePath = `guru-${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('materi-files')
          .upload(filePath, form.file)

        if (uploadError) {
          throw new Error(`Gagal upload file: ${uploadError.message}`)
        }

        const { data: publicUrlData } = supabase.storage
          .from('materi-files')
          .getPublicUrl(filePath)

        fileUrl = publicUrlData.publicUrl
      }

      const payload = form.kelas_list.map((kelasItem) => ({
        guru_id: user.id,
        judul: form.judul,
        deskripsi: form.deskripsi,
        kelas: kelasItem,
        tanggal_tayang: form.tanggalTayang || null,
        file_url: fileUrl,
        youtube_link: form.youtubeLink || null,
        link_tambahan: form.linkTambahan || null,
        is_published: form.published,
      }))

      const { error: insertError } = await supabase.from('materi').insert(payload)

      if (insertError) {
        throw new Error(insertError.message || 'Gagal menyimpan materi.')
      }

      alert(`Materi berhasil disimpan untuk ${form.kelas_list.length} kelas.`)
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
        <div>
          <h1 className="flex items-center gap-3 text-4xl font-bold text-gray-800">
            <BookOpen size={34} />
            Buat Materi Pembelajaran
          </h1>
        </div>

        <Link
          to="/guru/kelola-materi"
          className="inline-flex items-center gap-2 rounded-xl bg-gray-500 px-4 py-3 font-medium text-white hover:bg-gray-600"
        >
          <ArrowLeft size={18} />
          Kembali
        </Link>
      </div>

      <div className="rounded-2xl bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="text-lg font-semibold text-blue-600">Form Materi</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Judul Materi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="judul"
              value={form.judul}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Isi Materi / Keterangan <span className="text-red-500">*</span>
            </label>
            <textarea
              name="deskripsi"
              value={form.deskripsi}
              onChange={handleChange}
              rows="7"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="mb-5 grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Kelas <span className="text-red-500">*</span>
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
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
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

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tanggal Tayang
              </label>
              <input
                type="date"
                name="tanggalTayang"
                value={form.tanggalTayang}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              File Materi (PDF/Word/PPT)
            </label>
            <input
              type="file"
              name="file"
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-3"
              accept=".pdf,.doc,.docx,.ppt,.pptx"
            />
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Link Youtube (Opsional)
            </label>
            <input
              type="text"
              name="youtubeLink"
              value={form.youtubeLink}
              onChange={handleChange}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Link Tambahan (Opsional)
            </label>
            <input
              type="text"
              name="linkTambahan"
              value={form.linkTambahan}
              onChange={handleChange}
              placeholder="https://contoh.com"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-6 flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              name="published"
              checked={form.published}
              onChange={handleChange}
              className="h-4 w-4"
            />
            <label htmlFor="published" className="text-sm text-gray-700">
              Langsung Publish?
            </label>
          </div>

          {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </form>
      </div>
    </GuruLayout>
  )
}

export default TambahMateri