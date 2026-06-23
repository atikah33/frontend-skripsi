import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import { supabase } from '../../lib/supabase'

function AdminDashboard() {
  const [profiles, setProfiles] = useState([])
  const [materiList, setMateriList] = useState([])
  const [kuisList, setKuisList] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: materiData } = await supabase
      .from('materi')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: kuisData } = await supabase
      .from('kuis')
      .select('*')
      .order('created_at', { ascending: false })

    setProfiles(profileData || [])
    setMateriList(materiData || [])
    setKuisList(kuisData || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const totalUsers = profiles.length
  const totalGuru = profiles.filter((item) => item.role === 'guru').length
  const totalSiswa = profiles.filter((item) => item.role === 'siswa').length
  const totalAktif = profiles.filter((item) => item.is_active !== false).length
  const totalNonAktif = profiles.filter((item) => item.is_active === false).length
  const totalKonten = materiList.length + kuisList.length

  const kelasChart = useMemo(() => {
    const siswa = profiles.filter((item) => item.role === 'siswa')
    const kelas = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6']

    return kelas.map((namaKelas) => ({
      kelas: namaKelas,
      total: siswa.filter((item) => item.kelas === namaKelas).length,
    }))
  }, [profiles])

  const kontenTerbaru = useMemo(() => {
    const materiMapped = materiList.map((item) => ({
      ...item,
      tipe: 'Materi',
    }))

    const kuisMapped = kuisList.map((item) => ({
      ...item,
      tipe: 'Kuis',
    }))

    return [...materiMapped, ...kuisMapped]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
  }, [materiList, kuisList])

  const getNamaGuru = (guruId) => {
    const guru = profiles.find((item) => item.id === guruId)
    return guru?.nama || 'Guru'
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="rounded-xl bg-white p-6 shadow-sm text-gray-500">
          Memuat dashboard admin...
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <h1 className="mb-6 text-3xl font-bold text-gray-800">
        Dashboard Super Admin
      </h1>

      <div className="mb-6 grid gap-5 md:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-blue-600">TOTAL USERS</p>
          <h2 className="mt-3 text-3xl font-bold">{totalUsers}</h2>
          <p className="mt-1 text-sm">
            <span className="text-green-600">{totalAktif} Aktif</span>{' '}
            <span className="text-red-500">{totalNonAktif} Nonaktif</span>
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-green-600">GURU</p>
          <h2 className="mt-3 text-3xl font-bold">{totalGuru}</h2>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-cyan-600">SISWA</p>
          <h2 className="mt-3 text-3xl font-bold">{totalSiswa}</h2>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-yellow-600">KONTEN</p>
          <h2 className="mt-3 text-3xl font-bold">{totalKonten}</h2>
          <p className="mt-1 text-sm text-gray-500">{kuisList.length} Kuis</p>
        </div>
      </div>

      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl bg-white shadow-sm">
          <div className="border-b px-5 py-3">
            <h2 className="font-semibold text-blue-600">
              Distribusi Siswa per Kelas
            </h2>
          </div>

          <div className="flex h-56 items-end gap-8 px-8 py-6">
            {kelasChart.map((item) => (
              <div key={item.kelas} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t bg-blue-500"
                  style={{
                    height: `${Math.max(item.total * 45, item.total ? 20 : 4)}px`,
                  }}
                />
                <p className="text-xs text-gray-500">{item.kelas}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white shadow-sm">
          <div className="border-b px-5 py-3">
            <h2 className="font-semibold text-blue-600">
              Statistik Absensi Global
            </h2>
          </div>

          <div className="flex h-56 items-center justify-center">
            <div
              className="h-40 w-40 rounded-full"
              style={{
                background:
                  'conic-gradient(#22c55e 0% 40%, #ef4444 40% 70%, #facc15 70% 85%, #06b6d4 85% 100%)',
              }}
            >
              <div className="m-auto mt-8 h-24 w-24 rounded-full bg-white" />
            </div>

            <div className="ml-8 space-y-2 text-sm">
              <p><span className="text-green-600">■</span> Hadir</p>
              <p><span className="text-red-500">■</span> Tidak Hadir</p>
              <p><span className="text-yellow-500">■</span> Sakit</p>
              <p><span className="text-cyan-500">■</span> Izin</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <h2 className="font-semibold text-blue-600">User Terbaru</h2>
            <Link
              to="/admin/users"
              className="rounded bg-blue-600 px-3 py-1 text-sm text-white"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="p-4">
            <table className="w-full border text-sm">
              <thead>
                <tr className="text-left">
                  <th className="border px-3 py-2">Nama</th>
                  <th className="border px-3 py-2">Role</th>
                  <th className="border px-3 py-2">Status</th>
                </tr>
              </thead>

              <tbody>
                {profiles.slice(0, 5).map((item) => (
                  <tr key={item.id}>
                    <td className="border px-3 py-2">
                      <p className="font-semibold">{item.nama}</p>
                      <p className="text-gray-500">{item.email}</p>
                    </td>
                    <td className="border px-3 py-2 capitalize">
                      {item.role || '-'}
                    </td>
                    <td className="border px-3 py-2">
                      {item.is_active === false ? (
                        <span className="text-red-500">Nonaktif</span>
                      ) : (
                        <span className="text-green-600">Aktif</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <h2 className="font-semibold text-blue-600">Materi Terbaru</h2>
            <Link
              to="/admin/materi"
              className="rounded bg-blue-600 px-3 py-1 text-sm text-white"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="p-4">
            <table className="w-full border text-sm">
              <thead>
                <tr className="text-left">
                  <th className="border px-3 py-2">Judul</th>
                  <th className="border px-3 py-2">Guru</th>
                  <th className="border px-3 py-2">Tipe</th>
                </tr>
              </thead>

              <tbody>
                {kontenTerbaru.map((item) => (
                  <tr key={`${item.tipe}-${item.id}`}>
                    <td className="border px-3 py-2 font-semibold">
                      {item.judul}
                    </td>
                    <td className="border px-3 py-2">
                      {getNamaGuru(item.guru_id)}
                    </td>
                    <td className="border px-3 py-2">
                      <span
                        className={`rounded px-2 py-1 text-xs font-semibold ${
                          item.tipe === 'Kuis'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-cyan-100 text-cyan-700'
                        }`}
                      >
                        {item.tipe}
                      </span>
                    </td>
                  </tr>
                ))}

                {kontenTerbaru.length === 0 && (
                  <tr>
                    <td colSpan="3" className="border px-3 py-5 text-center text-gray-500">
                      Belum ada konten.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard