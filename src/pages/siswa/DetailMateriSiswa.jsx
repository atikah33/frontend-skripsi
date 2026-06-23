import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  Link as LinkIcon,
  Video,
} from 'lucide-react'
import SiswaLayout from '../../components/siswa/SiswaLayout'
import { supabase } from '../../lib/supabase'

function DetailMateriSiswa() {
  const { id } = useParams()

  const [userData, setUserData] = useState({
    nama: 'Siswa',
    kelas: 'Belum ada kelas',
  })
  const [materi, setMateri] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nama, kelas')
          .eq('id', user.id)
          .single()

        setUserData({
          nama: profile?.nama || 'Siswa',
          kelas: profile?.kelas || 'Belum ada kelas',
        })
      }

      const { data, error } = await supabase
        .from('materi')
        .select('*')
        .eq('id', id)
        .eq('is_published', true)
        .single()

      if (error) {
        setError('Materi tidak ditemukan.')
        setLoading(false)
        return
      }

      setMateri(data)
      setLoading(false)
    }

    fetchData()
  }, [id])

  const getYoutubeEmbedUrl = (url) => {
    if (!url) return ''
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)
    return match ? `https://www.youtube.com/embed/${match[1]}` : ''
  }

  if (loading) {
    return (
      <SiswaLayout nama={userData.nama} kelas={userData.kelas}>
        <div className="rounded-2xl bg-white p-6 shadow-sm text-gray-500">
          Memuat materi...
        </div>
      </SiswaLayout>
    )
  }

  if (error) {
    return (
      <SiswaLayout nama={userData.nama} kelas={userData.kelas}>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-500 shadow-sm">
          {error}
        </div>
      </SiswaLayout>
    )
  }

  const youtubeEmbedUrl = getYoutubeEmbedUrl(materi.youtube_link)

  return (
    <SiswaLayout nama={userData.nama} kelas={userData.kelas}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Detail Materi</h1>
          <p className="mt-2 text-gray-500">Pelajari materi dari guru</p>
        </div>

        <Link
          to="/siswa/materi-kuis"
          className="inline-flex items-center gap-2 rounded-xl bg-gray-500 px-4 py-3 font-medium text-white hover:bg-gray-600"
        >
          <ArrowLeft size={18} />
          Kembali
        </Link>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-3xl font-bold text-gray-900">{materi.judul}</h2>
            <p className="mt-2 text-sm text-gray-500">Kelas: {materi.kelas}</p>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-gray-500">Deskripsi</p>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="whitespace-pre-line text-gray-700">
                {materi.deskripsi || '-'}
              </p>
            </div>
          </div>
        </div>

        {materi.file_url && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-800">
              <FileText size={20} />
              File Materi
            </h3>

            <a
              href={materi.file_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
            >
              <FileText size={18} />
              Buka File
            </a>
          </div>
        )}

        {materi.youtube_link && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-800">
              <Video size={20} />
              Video Pembelajaran
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
                href={materi.youtube_link}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                Buka Video YouTube
              </a>
            )}
          </div>
        )}

        {materi.link_tambahan && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-800">
              <LinkIcon size={20} />
              Link Tambahan
            </h3>

            <a
              href={materi.link_tambahan}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              {materi.link_tambahan}
            </a>
          </div>
        )}
      </div>
    </SiswaLayout>
  )
}

export default DetailMateriSiswa