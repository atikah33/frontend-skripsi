import { useEffect, useMemo, useState } from 'react'
import GuruLayout from '../../components/guru/GuruLayout'
import StatCard from '../../components/guru/StatCard'
import { supabase } from '../../lib/supabase'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'

function GuruDashboard() {
  const [materiList, setMateriList] = useState([])
  const [kuisList, setKuisList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboardData = async () => {
    setLoading(true)
    setError('')

    const { data: materiData, error: materiError } = await supabase
      .from('materi')
      .select('*')
      .order('created_at', { ascending: false })

    if (materiError) {
      setError('Gagal memuat data dashboard.')
      setLoading(false)
      return
    }

    const { data: kuisData, error: kuisError } = await supabase
      .from('kuis')
      .select('*')
      .order('created_at', { ascending: false })

    if (kuisError) {
      setError('Gagal memuat data kuis.')
      setLoading(false)
      return
    }

    setMateriList(materiData || [])
    setKuisList(kuisData || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const totalMateri = materiList.length
  const publishedMateri = materiList.filter((item) => item.is_published).length
  const draftMateri = materiList.filter((item) => !item.is_published).length

  const totalKuis = kuisList.length
  const draftKuis = kuisList.filter((item) => !item.is_published).length

  const materiPerKelas = useMemo(() => {
    const grouped = {}

    materiList.forEach((item) => {
      const kelas = item.kelas || 'Tidak diketahui'
      grouped[kelas] = (grouped[kelas] || 0) + 1
    })

    return Object.keys(grouped).map((kelas) => ({
      kelas,
      total: grouped[kelas],
    }))
  }, [materiList])

  const materiPerBulan = useMemo(() => {
    const bulanMap = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ]

    const grouped = {}

    materiList.forEach((item) => {
      const dateValue = item.created_at || item.tanggal_tayang
      if (!dateValue) return

      const date = new Date(dateValue)
      const key = `${date.getFullYear()}-${date.getMonth()}`
      const label = `${bulanMap[date.getMonth()]} ${date.getFullYear()}`

      if (!grouped[key]) {
        grouped[key] = {
          label,
          total: 0,
          year: date.getFullYear(),
          month: date.getMonth(),
        }
      }

      grouped[key].total += 1
    })

    return Object.values(grouped)
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year
        return a.month - b.month
      })
      .map((item) => ({
        bulan: item.label,
        total: item.total,
      }))
  }, [materiList])

  return (
    <GuruLayout>
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-800">Dashboard</h1>
        <p className="mt-2 text-gray-500">Ringkasan aktivitas guru</p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-500">
          {error}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Materi"
          value={loading ? '...' : totalMateri}
          subtitle={
            loading
              ? 'Memuat data...'
              : `${publishedMateri} Published | ${draftMateri} Draft`
          }
          color="blue"
        />

        <StatCard
          title="Total Kuis"
          value={loading ? '...' : totalKuis}
          subtitle={
            loading
              ? 'Memuat data...'
              : `${draftKuis} Belum Publish`
          }
          color="green"
        />

        <StatCard
          title="Kehadiran"
          value="0/0"
          subtitle="Data absensi siswa"
          color="cyan"
        />

        <StatCard
          title="Rata-rata Nilai"
          value="0.0"
          subtitle="Dari 0 jawaban"
          color="yellow"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">
            Materi per Kelas
          </h2>

          <div className="h-72">
            {loading ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-400">
                Memuat chart...
              </div>
            ) : materiPerKelas.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-400">
                Belum ada data materi
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={materiPerKelas}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="kelas" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar
                    dataKey="total"
                    fill="#3B82F6" 
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">
            Materi per Bulan
          </h2>

          <div className="h-72">
            {loading ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-400">
                Memuat chart...
              </div>
            ) : materiPerBulan.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-400">
                Belum ada data materi
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={materiPerBulan}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bulan" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="total"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">
            Status Absensi Bulan Ini
          </h2>

          <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-400">
            Chart absensi nanti
          </div>
        </div>
      </div>
    </GuruLayout>
  )
}

export default GuruDashboard