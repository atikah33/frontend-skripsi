import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SiswaLayout from '../../components/siswa/SiswaLayout'
import { supabase } from '../../lib/supabase'

function SiswaMateriKuis() {
  const [userData, setUserData] = useState({
    nama: 'Siswa',
    kelas: 'Belum ada kelas',
  })
  const [tab, setTab] = useState('semua')
  const [materiList, setMateriList] = useState([])
  const [kuisList, setKuisList] = useState([])
  const [loading, setLoading] = useState(true)

  const normalizeKelas = (value) =>
    String(value || '')
      .replace(/^Kelas\s+/i, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()

  const formatDeadline = (deadline) => {
    if (!deadline) return '-'
    return new Date(deadline).toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  const isDeadlinePassed = (deadline) => {
    if (!deadline) return false
    return new Date() > new Date(deadline)
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('nama, kelas')
        .eq('id', user.id)
        .single()

      const kelasProfile = profile?.kelas || ''
      const kelasDenganPrefix = kelasProfile.startsWith('Kelas ')
        ? kelasProfile
        : `Kelas ${kelasProfile}`

      const kelasTanpaPrefix = kelasProfile.replace(/^Kelas\s+/i, '').trim()

      setUserData({
        nama: profile?.nama || 'Siswa',
        kelas: kelasDenganPrefix,
      })

      const kelasFilter = [kelasDenganPrefix, kelasTanpaPrefix]

      const { data: materiData } = await supabase
        .from('materi')
        .select('*')
        .eq('is_published', true)
        .in('kelas', kelasFilter)
        .order('created_at', { ascending: false })

      const { data: kuisData } = await supabase
        .from('kuis')
        .select('*')
        .eq('is_published', true)
        .in('kelas', kelasFilter)
        .order('created_at', { ascending: false })

      setMateriList(materiData || [])
      setKuisList(kuisData || [])
      setLoading(false)
    }

    fetchData()
  }, [])

  const allItems = useMemo(() => {
    const materiMapped = materiList.map((item) => ({
      ...item,
      jenis: 'materi',
    }))

    const kuisMapped = kuisList.map((item) => ({
      ...item,
      jenis: 'kuis',
    }))

    return [...materiMapped, ...kuisMapped].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    )
  }, [materiList, kuisList])

  const displayedItems = useMemo(() => {
    const kelasSiswa = normalizeKelas(userData.kelas)

    let data = allItems.filter(
      (item) => normalizeKelas(item.kelas) === kelasSiswa,
    )

    if (tab === 'materi') {
      data = data.filter((item) => item.jenis === 'materi')
    }

    if (tab === 'kuis') {
      data = data.filter((item) => item.jenis === 'kuis')
    }

    return data
  }, [allItems, tab, userData.kelas])

  return (
    <SiswaLayout nama={userData.nama} kelas={userData.kelas}>
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-800">Materi & Kuis</h1>
        <p className="mt-2 text-gray-500">
          Semua materi dan kuis yang sudah dipublish guru
        </p>
      </div>

      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setTab('semua')}
          className={`rounded-xl px-5 py-3 font-medium ${
            tab === 'semua' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
          }`}
        >
          Semua
        </button>

        <button
          onClick={() => setTab('materi')}
          className={`rounded-xl px-5 py-3 font-medium ${
            tab === 'materi' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
          }`}
        >
          Materi
        </button>

        <button
          onClick={() => setTab('kuis')}
          className={`rounded-xl px-5 py-3 font-medium ${
            tab === 'kuis' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
          }`}
        >
          Kuis
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-6 text-gray-500 shadow-sm">
          Memuat data...
        </div>
      ) : displayedItems.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {displayedItems.map((item) => {
            const isKuis = item.jenis === 'kuis'
            const deadlineLewat = isDeadlinePassed(item.deadline)

            return (
              <div
                key={`${item.jenis}-${item.id}`}
                className="rounded-2xl bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="text-3xl">
                    {item.jenis === 'materi' ? '📘' : '📝'}
                  </div>

                  <span
                    className={`rounded-lg px-3 py-1 text-xs font-bold ${
                      item.jenis === 'materi'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {item.jenis === 'materi' ? 'MATERI' : 'KUIS'}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-gray-900">
                  {item.judul}
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  {item.deskripsi || '-'}
                </p>

                <div className="mt-4 space-y-1 text-sm text-gray-500">
                  <p>Kelas: {item.kelas}</p>

                  {isKuis && (
                    <>
                      <p>
                        Mode:{' '}
                        {item.mode_kuis === 'file_upload'
                          ? 'File Upload'
                          : 'Manual'}
                      </p>

                      {item.deadline && (
                        <p
                          className={
                            deadlineLewat ? 'font-semibold text-red-600' : ''
                          }
                        >
                          Deadline: {formatDeadline(item.deadline)}
                          {deadlineLewat ? ' (Sudah lewat)' : ''}
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="mt-6">
                  <Link
                    to={
                      item.jenis === 'materi'
                        ? `/siswa/materi/${item.id}`
                        : `/siswa/kuis/${item.id}`
                    }
                    className={`block rounded-full px-5 py-3 text-center font-semibold ${
                      item.jenis === 'materi'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-yellow-400 text-black hover:bg-yellow-500'
                    }`}
                  >
                    {item.jenis === 'materi' ? 'Lihat Materi' : 'Buka Kuis'}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-6 text-gray-500 shadow-sm">
          Belum ada data.
        </div>
      )}
    </SiswaLayout>
  )
}

export default SiswaMateriKuis