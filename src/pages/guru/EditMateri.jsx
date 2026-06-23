import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Pencil, ArrowLeft } from 'lucide-react'
import GuruLayout from '../../components/guru/GuruLayout'
import { supabase } from '../../lib/supabase'

const initialForm = {
  judul: '',
  deskripsi: '',
  kelas: '',
  youtubeLink: '',
  linkTambahan: '',
  published: false,
  file: null,
}

function EditMateri() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchMateri = async () => {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('materi')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        setError('Data materi gagal dimuat.')
        setLoading(false)
        return
      }

      setForm({
        judul: data.judul || '',
        deskripsi: data.deskripsi || '',
        kelas: data.kelas || '',
        youtubeLink: data.youtube_link || '',
        linkTambahan: data.link_tambahan || '',
        published: data.is_published || false,
        file: null,
      })

      setLoading(false)
    }

    if (id) {
      fetchMateri()
    }
  }, [id])

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      judul: form.judul,
      deskripsi: form.deskripsi,
      kelas: form.kelas,
      youtube_link: form.youtubeLink,
      link_tambahan: form.linkTambahan,
      is_published: form.published,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('materi')
      .update(payload)
      .eq('id', id)

    if (error) {
      setError('Gagal mengupdate materi.')
      setSaving(false)
      return
    }

    alert('Materi berhasil diupdate')
    navigate('/guru/kelola-materi')
  }

  if (loading) {
    return (
      <GuruLayout>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-gray-500">Memuat data materi...</p>
        </div>
      </GuruLayout>
    )
  }

  return (
    <GuruLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center gap-3 text-4xl font-bold text-gray-800">
          <Pencil size={34} />
          Edit Materi
        </h1>

        <Link
          to="/guru/kelola-materi"
          className="inline-flex items-center gap-2 rounded-xl bg-gray-500 px-4 py-3 font-medium text-white hover:bg-gray-600"
        >
          <ArrowLeft size={18} />
          Kembali
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white shadow-sm">
            <div className="border-b px-5 py-4">
              <h2 className="text-lg font-semibold text-blue-600">
                Edit Informasi Materi
              </h2>
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

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Kelas <span className="text-red-500">*</span>
                </label>
                <select
                  name="kelas"
                  value={form.kelas}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
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

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Upload File Baru (Opsional)
                </label>
                <input
                  type="file"
                  name="file"
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3"
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
                  Publish materi
                </label>
              </div>

              {error && (
                <p className="mb-4 text-sm text-red-500">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Update Materi'}
                </button>

                <Link
                  to="/guru/kelola-materi"
                  className="rounded-xl bg-gray-500 px-5 py-3 font-semibold text-white hover:bg-gray-600"
                >
                  Batal
                </Link>
              </div>
            </form>
          </div>
        </div>

        <div>
          <div className="rounded-2xl bg-white shadow-sm">
            <div className="border-b px-5 py-4">
              <h2 className="text-lg font-semibold text-yellow-500">Peringatan</h2>
            </div>

            <div className="p-5 text-sm leading-7 text-gray-500">
              <ul className="list-disc pl-5">
                <li>Mengubah kelas dapat memengaruhi data yang terkait.</li>
                <li>Upload file baru akan mengganti file lama.</li>
                <li>Unpublish materi akan menyembunyikan materi dari siswa.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </GuruLayout>
  )
}

export default EditMateri