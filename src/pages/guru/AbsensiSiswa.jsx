import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, XCircle, Eye } from 'lucide-react'
import GuruLayout from '../../components/guru/GuruLayout'
import { supabase } from '../../lib/supabase'

const statusOptions = [
  { value: 'hadir', label: 'Hadir' },
  { value: 'izin', label: 'Izin' },
  { value: 'sakit', label: 'Sakit' },
  { value: 'alpha', label: 'Alpha' },
]

const kelasDefault = [
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

function AbsensiSiswa() {
  const today = new Date().toISOString().slice(0, 10)

  const [tab, setTab] = useState('manual')
  const [tanggal, setTanggal] = useState(today)
  const [kelas, setKelas] = useState('Kelas X IPA 1')

  const [siswaList, setSiswaList] = useState([])
  const [absensiManual, setAbsensiManual] = useState({})
  const [validasiList, setValidasiList] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const kelasOptions = useMemo(() => {
    const kelasDariSiswa = siswaList.map((item) => item.kelas).filter(Boolean)
    return [...new Set([...kelasDefault, ...kelasDariSiswa])]
  }, [siswaList])

  const fetchSiswa = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'siswa')
      .order('nama', { ascending: true })

    if (error) {
      setError(`Gagal memuat siswa: ${error.message}`)
      return
    }

    setSiswaList(data || [])
  }

  const fetchAbsensiManual = async () => {
    if (!tanggal || !kelas) return

    const siswaKelas = siswaList.filter((siswa) => siswa.kelas === kelas)

    if (siswaKelas.length === 0) {
      setAbsensiManual({})
      return
    }

    const siswaIds = siswaKelas.map((siswa) => siswa.id)

    const { data, error } = await supabase
      .from('absensi')
      .select('*')
      .eq('tanggal', tanggal)
      .in('siswa_id', siswaIds)

    if (error) {
      setError(`Gagal memuat absensi: ${error.message}`)
      return
    }

    const map = {}

    siswaKelas.forEach((siswa) => {
      const existing = data?.find((item) => item.siswa_id === siswa.id)
      map[siswa.id] = existing?.status || 'hadir'
    })

    setAbsensiManual(map)
  }

  const fetchValidasiMandiri = async () => {
    const { data, error } = await supabase
      .from('absensi')
      .select(`
        *,
        profiles:siswa_id (
          id,
          nama,
          email,
          kelas,
          nis,
          nisn
        )
      `)
      .eq('sumber_absen', 'siswa')
      .eq('status_validasi', 'menunggu_validasi')
      .order('created_at', { ascending: false })

    if (error) {
      setError(`Gagal memuat validasi absensi: ${error.message}`)
      return
    }

    setValidasiList(data || [])
  }

  const fetchAll = async () => {
    setLoading(true)
    setError('')
    await fetchSiswa()
    await fetchValidasiMandiri()
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
  }, [])

  useEffect(() => {
    if (siswaList.length > 0) {
      fetchAbsensiManual()
    }
  }, [siswaList, tanggal, kelas])

  const siswaByKelas = siswaList.filter((siswa) => siswa.kelas === kelas)

  const handleStatusChange = (siswaId, value) => {
    setAbsensiManual((prev) => ({
      ...prev,
      [siswaId]: value,
    }))
  }

  const handleSubmitManual = async () => {
    setSaving(true)
    setError('')

    try {
      if (!tanggal) {
        throw new Error('Tanggal wajib dipilih.')
      }

      if (siswaByKelas.length === 0) {
        throw new Error('Tidak ada siswa pada kelas ini.')
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      for (const siswa of siswaByKelas) {
        const status = absensiManual[siswa.id] || 'hadir'

        const { data: existing } = await supabase
          .from('absensi')
          .select('id')
          .eq('siswa_id', siswa.id)
          .eq('tanggal', tanggal)
          .maybeSingle()

        const payload = {
          siswa_id: siswa.id,
          guru_id: user?.id || null,
          tanggal,
          status,
          keterangan: null,
          sumber_absen: 'guru',
          status_validasi: 'valid',
          bukti_url: null,
          catatan_siswa: null,
          catatan_guru: null,
          divalidasi_oleh: user?.id || null,
          divalidasi_at: new Date().toISOString(),
        }

        if (existing) {
          const { error } = await supabase
            .from('absensi')
            .update(payload)
            .eq('id', existing.id)

          if (error) throw error
        } else {
          const { error } = await supabase.from('absensi').insert([payload])
          if (error) throw error
        }
      }

      alert('Absensi berhasil disimpan.')
      fetchAbsensiManual()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan absensi.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateStatusValidasi = async (id, field, value) => {
    setValidasiList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    )
  }

  const handleValidasi = async (item, statusValidasi) => {
    setSaving(true)
    setError('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('absensi')
        .update({
          status: item.status,
          status_validasi: statusValidasi,
          catatan_guru: item.catatan_guru || null,
          divalidasi_oleh: user?.id || null,
          divalidasi_at: new Date().toISOString(),
        })
        .eq('id', item.id)

      if (error) throw error

      alert(
        statusValidasi === 'valid'
          ? 'Absensi berhasil divalidasi.'
          : 'Absensi berhasil ditolak.',
      )

      fetchValidasiMandiri()
    } catch (err) {
      setError(err.message || 'Gagal memvalidasi absensi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <GuruLayout>
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-800">Absensi Siswa</h1>
        <p className="mt-2 text-gray-500">
          Kelola absensi manual dan validasi absensi mandiri siswa.
        </p>
      </div>

      <div className="mb-5 flex gap-3">
        <button
          type="button"
          onClick={() => setTab('manual')}
          className={`rounded-xl px-5 py-3 font-semibold ${
            tab === 'manual'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700'
          }`}
        >
          Absensi Manual Guru
        </button>

        <button
          type="button"
          onClick={() => setTab('validasi')}
          className={`rounded-xl px-5 py-3 font-semibold ${
            tab === 'validasi'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700'
          }`}
        >
          Validasi Absensi Mandiri
          {validasiList.length > 0 && (
            <span className="ml-2 rounded-full bg-red-500 px-2 py-1 text-xs text-white">
              {validasiList.length}
            </span>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-500">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm text-gray-500">
          Memuat data absensi...
        </div>
      ) : tab === 'manual' ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tanggal
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Kelas
              </label>
              <select
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3"
              >
                {kelasOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full overflow-hidden rounded-xl border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    No
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    NIS/NISN
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Nama
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {siswaByKelas.length > 0 ? (
                  siswaByKelas.map((siswa, index) => (
                    <tr key={siswa.id} className="border-t">
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3">
                        {siswa.nis || siswa.nisn || '-'}
                      </td>
                      <td className="px-4 py-3">{siswa.nama}</td>
                      <td className="px-4 py-3">
                        <select
                          value={absensiManual[siswa.id] || 'hadir'}
                          onChange={(e) =>
                            handleStatusChange(siswa.id, e.target.value)
                          }
                          className="rounded-lg border border-gray-300 px-3 py-2"
                        >
                          {statusOptions.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Belum ada siswa di kelas ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={handleSubmitManual}
            disabled={saving}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Absensi'}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-blue-600">
            Validasi Absensi Mandiri Siswa
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full overflow-hidden rounded-xl border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Siswa
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Catatan Siswa
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Bukti
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Catatan Guru
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody>
                {validasiList.length > 0 ? (
                  validasiList.map((item) => (
                    <tr key={item.id} className="border-t align-top">
                      <td className="px-4 py-3">
                        <p className="font-semibold">
                          {item.profiles?.nama || 'Siswa'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.profiles?.kelas || '-'}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        {new Date(item.tanggal).toLocaleDateString('id-ID')}
                      </td>

                      <td className="px-4 py-3">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleUpdateStatusValidasi(
                              item.id,
                              'status',
                              e.target.value,
                            )
                          }
                          className="rounded-lg border border-gray-300 px-3 py-2"
                        >
                          {statusOptions.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.catatan_siswa || '-'}
                      </td>

                      <td className="px-4 py-3">
                        {item.bukti_url ? (
                          <a
                            href={item.bukti_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                          >
                            <Eye size={15} />
                            Lihat
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <textarea
                          value={item.catatan_guru || ''}
                          onChange={(e) =>
                            handleUpdateStatusValidasi(
                              item.id,
                              'catatan_guru',
                              e.target.value,
                            )
                          }
                          rows="2"
                          placeholder="Catatan validasi..."
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => handleValidasi(item, 'valid')}
                            className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            <CheckCircle2 size={15} />
                            Valid
                          </button>

                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => handleValidasi(item, 'ditolak')}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            <XCircle size={15} />
                            Tolak
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Tidak ada absensi mandiri yang perlu divalidasi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </GuruLayout>
  )
}

export default AbsensiSiswa