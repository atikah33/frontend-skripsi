import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, FileText, Video, Link as LinkIcon } from 'lucide-react'
import GuruLayout from '../../components/guru/GuruLayout'
import { supabase } from '../../lib/supabase'

function DetailMateri() {
  const { id } = useParams()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('materi')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        setError('Gagal mengambil data materi')
        setLoading(false)
        return
      }

      setData(data)
      setLoading(false)
    }

    fetchData()
  }, [id])

  const jenisMateri = useMemo(() => {
    if (!data) return []

    const jenis = []

    if (data.file_url) jenis.push('File Materi')
    if (data.youtube_link) jenis.push('Video YouTube')
    if (data.link_tambahan) jenis.push('Link Tambahan')

    if (jenis.length === 0) {
      jenis.push('Teks / Deskripsi')
    }

    return jenis
  }, [data])

  const getYoutubeEmbedUrl = (url) => {
    if (!url) return ''
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/,
    )
    return match ? `https://www.youtube.com/embed/${match[1]}` : ''
  }

  if (loading) {
    return (
      <GuruLayout>
        <p className="p-6 text-gray-500">Loading...</p>
      </GuruLayout>
    )
  }

  if (error) {
    return (
      <GuruLayout>
        <p className="p-6 text-red-500">{error}</p>
      </GuruLayout>
    )
  }

  const youtubeEmbedUrl = getYoutubeEmbedUrl(data.youtube_link)

  return (
    <GuruLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-800">
          <BookOpen size={28} />
          Detail Materi
        </h1>

        <Link
          to="/guru/kelola-materi"
          className="inline-flex items-center gap-2 rounded-xl bg-gray-500 px-4 py-3 text-white hover:bg-gray-600"
        >
          <ArrowLeft size={18} />
          Kembali
        </Link>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <p className="text-sm text-gray-500">Judul</p>
            <h2 className="text-2xl font-bold text-gray-800">{data.judul}</h2>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-500">Deskripsi</p>
            <p className="whitespace-pre-line text-gray-700">{data.deskripsi}</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Kelas</p>
              <p className="text-gray-800">{data.kelas}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Tanggal Tayang</p>
              <p className="text-gray-800">{data.tanggal_tayang || '-'}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className={data.is_published ? 'font-semibold text-green-600' : 'font-semibold text-yellow-600'}>
                {data.is_published ? 'Published' : 'Draft'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Jenis Materi</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {jenisMateri.map((item, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {data.file_url && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-800">
              <FileText size={20} />
              File Materi
            </h3>

            <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
              <div>
                <p className="font-medium text-gray-800">File berhasil diupload</p>
                <p className="text-sm text-gray-500">Klik tombol untuk membuka file</p>
              </div>

              <a
                href={data.file_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Buka File
              </a>
            </div>
          </div>
        )}

        {data.youtube_link && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-800">
              <Video size={20} />
              Video YouTube
            </h3>

            {youtubeEmbedUrl ? (
              <div className="overflow-hidden rounded-2xl">
                <iframe
                  width="100%"
                  height="420"
                  src={youtubeEmbedUrl}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-2xl"
                ></iframe>
              </div>
            ) : (
              <a
                href={data.youtube_link}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                Buka Video YouTube
              </a>
            )}
          </div>
        )}

        {data.link_tambahan && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-800">
              <LinkIcon size={20} />
              Link Tambahan
            </h3>

            <a
              href={data.link_tambahan}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              {data.link_tambahan}
            </a>
          </div>
        )}
      </div>
    </GuruLayout>
  )
}

export default DetailMateri