import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Trophy, Star, Puzzle, Clock3 } from 'lucide-react'
import SiswaLayout from '../../components/siswa/SiswaLayout'
import SiswaStatCard from '../../components/siswa/SiswaStatCard'
import { supabase } from '../../lib/supabase'

function normalizeKelas(text) {
  return String(text || '')
    .toLowerCase()
    .replace('kelas', '')
    .replace(/\s+/g, ' ')
    .trim()
}

function SiswaDashboard() {
  const [userData, setUserData] = useState({
    nama: 'Siswa',
    kelas: 'Belum ada kelas',
  })

  const [materiList, setMateriList] = useState([])
  const [kuisList, setKuisList] = useState([])
  const [submissionList, setSubmissionList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true)
      setError('')

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setError('Gagal memuat user siswa.')
        setLoading(false)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('nama, kelas')
        .eq('id', user.id)
        .single()

      if (profileError) {
        setError('Gagal memuat profil siswa.')
        setLoading(false)
        return
      }

      const kelasSiswa = profile?.kelas || 'Belum ada kelas'
      const kelasSiswaNormalized = normalizeKelas(kelasSiswa)

      setUserData({
        nama: profile?.nama || 'Siswa',
        kelas: kelasSiswa,
      })

      const { data: materiData, error: materiError } = await supabase
        .from('materi')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (materiError) {
        setError('Gagal memuat data materi.')
        setLoading(false)
        return
      }

      const { data: kuisData, error: kuisError } = await supabase
        .from('kuis')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (kuisError) {
        setError('Gagal memuat data kuis.')
        setLoading(false)
        return
      }

      const { data: submissionData, error: submissionError } = await supabase
        .from('kuis_submission')
        .select(`
          *,
          kuis:kuis_id (
            id,
            judul,
            kelas
          )
        `)
        .eq('siswa_id', user.id)
        .order('submitted_at', { ascending: false })

      if (submissionError) {
        setError('Gagal memuat data submission siswa.')
        setLoading(false)
        return
      }

      const filteredMateri = (materiData || []).filter(
        (item) => normalizeKelas(item.kelas) === kelasSiswaNormalized,
      )

      const filteredKuis = (kuisData || []).filter(
        (item) => normalizeKelas(item.kelas) === kelasSiswaNormalized,
      )

      setMateriList(filteredMateri)
      setKuisList(filteredKuis)
      setSubmissionList(submissionData || [])
      setLoading(false)
    }

    fetchDashboard()
  }, [])

  const tugasSelesai = submissionList.length

  const submissionDinilai = submissionList.filter(
    (item) => item.nilai !== null && item.nilai !== undefined,
  )

  const rataRataNilai =
    submissionDinilai.length > 0
      ? (
          submissionDinilai.reduce(
            (total, item) => total + Number(item.nilai || 0),
            0,
          ) / submissionDinilai.length
        ).toFixed(1)
      : '0.0'

  const materiTerbaru = useMemo(() => {
    const materiMapped = materiList.map((item) => ({
      ...item,
      jenis: 'materi',
    }))

    const kuisMapped = kuisList.map((item) => ({
      ...item,
      jenis: 'kuis',
    }))

    return [...materiMapped, ...kuisMapped]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 3)
  }, [materiList, kuisList])

  const aktivitasTerakhir = useMemo(() => {
    return submissionList.slice(0, 5).map((item) => {
      const sudahDinilai = item.status === 'dinilai'
      return {
        id: item.id,
        jenis: sudahDinilai ? 'nilai_keluar' : 'kuis_dikirim',
        judulKuis: item.kuis?.judul || 'Kuis',
        nilai: item.nilai,
        waktu: item.graded_at || item.submitted_at,
      }
    })
  }, [submissionList])

  const formatWaktuRelatif = (dateString) => {
    if (!dateString) return '-'

    const now = new Date()
    const target = new Date(dateString)
    const diffMs = now - target

    const menit = Math.floor(diffMs / (1000 * 60))
    const jam = Math.floor(diffMs / (1000 * 60 * 60))
    const hari = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const bulan = Math.floor(hari / 30)

    if (menit < 1) return 'baru saja'
    if (menit < 60) return `${menit} menit lalu`
    if (jam < 24) return `${jam} jam lalu`
    if (hari < 30) return `${hari} hari lalu`
    return `${bulan} bulan lalu`
  }

  return (
    <SiswaLayout nama={userData.nama} kelas={userData.kelas}>
      <div className="mb-6 overflow-hidden rounded-[2rem] bg-blue-600 px-8 py-10 text-white shadow-sm">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-extrabold">
            Halo, {userData.nama}! 👋
          </h1>
          <p className="mt-4 text-2xl text-blue-100">
            Kamu berada di {userData.kelas}. Ayo selesaikan misimu hari ini!
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-500 shadow-sm">
          {error}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SiswaStatCard
          icon={<BookOpen className="text-blue-600" size={30} />}
          title="Materi"
          value={loading ? '...' : materiList.length}
          subtitle={
            loading
              ? 'Memuat...'
              : `${materiList.length} tersedia untuk kelasmu`
          }
          bg="bg-blue-100"
        />

        <SiswaStatCard
          icon={<Trophy className="text-green-600" size={30} />}
          title="Tugas Selesai"
          value={loading ? '...' : tugasSelesai}
          subtitle={loading ? 'Memuat...' : `${tugasSelesai} kuis sudah dikirim`}
          bg="bg-green-100"
        />

        <SiswaStatCard
          icon={<Star className="text-yellow-500" size={30} />}
          title="Rata-rata"
          value={loading ? '...' : rataRataNilai}
          subtitle={
            loading
              ? 'Memuat...'
              : `${submissionDinilai.length} kuis sudah dinilai`
          }
          bg="bg-yellow-100"
        />

        <SiswaStatCard
          icon={<Puzzle className="text-pink-500" size={30} />}
          title="Total Kuis"
          value={loading ? '...' : kuisList.length}
          subtitle={loading ? 'Memuat...' : 'Tersedia untuk kelasmu'}
          bg="bg-pink-100"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-4xl font-bold text-gray-800">Materi Terbaru</h2>
            <Link
              to="/siswa/materi-kuis"
              className="rounded-full border border-blue-500 px-4 py-2 text-blue-600 hover:bg-blue-50"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {materiTerbaru.length > 0 ? (
              materiTerbaru.map((item) => {
                const isKuis = item.jenis === 'kuis'

                return (
                  <div
                    key={`${item.jenis}-${item.id}`}
                    className="rounded-2xl bg-white p-5 shadow-sm"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="text-3xl">{isKuis ? '📝' : '📘'}</div>

                      {isKuis ? (
                        <span className="rounded-lg bg-yellow-400 px-3 py-1 text-xs font-bold text-black">
                          KUIS
                        </span>
                      ) : (
                        <span className="rounded-lg bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                          MATERI
                        </span>
                      )}
                    </div>

                    <h3 className="text-3xl font-bold text-gray-900">
                      {item.judul}
                    </h3>
                    <p className="mt-2 text-gray-500">Oleh: Guru</p>

                    <Link
                      to={isKuis ? `/siswa/kuis/${item.id}` : `/siswa/materi/${item.id}`}
                      className={`mt-8 block rounded-full px-5 py-3 text-center font-semibold ${
                        isKuis
                          ? 'bg-yellow-400 text-black hover:bg-yellow-500'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isKuis ? 'Buka Kuis' : 'Lihat Materi'}
                    </Link>
                  </div>
                )
              })
            ) : (
              <div className="rounded-2xl bg-white p-6 shadow-sm text-gray-500">
                Belum ada materi atau kuis untuk kelasmu.
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 text-3xl font-bold text-gray-800">
              <Clock3 size={22} />
              Aktivitas Terakhir
            </h2>

            <div className="space-y-5">
              {aktivitasTerakhir.length > 0 ? (
                aktivitasTerakhir.map((item, index) => (
                  <div
                    key={item.id}
                    className={index !== aktivitasTerakhir.length - 1 ? 'border-b pb-4' : ''}
                  >
                    {item.jenis === 'nilai_keluar' ? (
                      <>
                        <p className="text-2xl font-bold text-blue-600">Nilai Keluar!</p>
                        <p className="text-lg text-gray-700">Kuis: {item.judulKuis}</p>
                        <span className="mt-2 inline-block rounded-lg bg-red-500 px-3 py-1 text-sm font-semibold text-white">
                          Skor: {item.nilai}
                        </span>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-gray-800">Kuis Dikirim</p>
                        <p className="text-lg text-gray-700">{item.judulKuis}</p>
                      </>
                    )}

                    <p className="mt-2 text-sm text-gray-400">
                      {formatWaktuRelatif(item.waktu)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-gray-500">
                  Belum ada aktivitas terbaru.
                </div>
              )}

              <button
                type="button"
                className="block w-full text-center font-semibold text-blue-600 hover:underline"
              >
                Lihat Semua Riwayat
              </button>
            </div>
          </div>
        </div>
      </div>
    </SiswaLayout>
  )
}

export default SiswaDashboard