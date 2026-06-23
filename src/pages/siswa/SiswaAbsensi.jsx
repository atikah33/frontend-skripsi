import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Upload, CheckCircle2, Clock, XCircle } from 'lucide-react'
import SiswaLayout from '../../components/siswa/SiswaLayout'
import { supabase } from '../../lib/supabase'

function SiswaAbsensi() {
  const [userData, setUserData] = useState({
    nama: 'Siswa',
    kelas: 'Belum ada kelas',
  })

  const [form, setForm] = useState({
    status: 'hadir',
    catatan_siswa: '',
    bukti: null,
  })

  const [userId, setUserId] = useState(null)
  const [absensiList, setAbsensiList] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const today = new Date().toISOString().slice(0, 10)

  const fetchData = async () => {
    setLoading(true)
    setError('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('User tidak ditemukan.')
      setLoading(false)
      return
    }

    setUserId(user.id)

    const { data: profile } = await supabase
      .from('profiles')
      .select('nama, kelas')
      .eq('id', user.id)
      .single()

    setUserData({
      nama: profile?.nama || 'Siswa',
      kelas: profile?.kelas || 'Belum ada kelas',
    })

    const { data: absensiData, error: absensiError } = await supabase
      .from('absensi')
      .select('*')
      .eq('siswa_id', user.id)
      .order('tanggal', { ascending: false })

    if (absensiError) {
      setError(`Gagal memuat absensi: ${absensiError.message}`)
      setLoading(false)
      return
    }

    setAbsensiList(absensiData || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const sudahAbsenHariIni = absensiList.some((item) => item.tanggal === today)

  const handleChange = (e) => {
    const { name, value, files, type } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: type === 'file' ? files[0] : value,
    }))
  }

  const uploadBukti = async () => {
    if (!form.bukti) return null

    const fileExt = form.bukti.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('bukti-absensi')
      .upload(filePath, form.bukti, {
        upsert: true,
      })

    if (uploadError) {
      throw new Error(`Gagal upload bukti: ${uploadError.message}`)
    }

    const { data: publicUrlData } = supabase.storage
      .from('bukti-absensi')
      .getPublicUrl(filePath)

    return publicUrlData.publicUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (!userId) {
        throw new Error('User belum siap. Refresh halaman.')
      }

      if (sudahAbsenHariIni) {
        throw new Error('Kamu sudah melakukan absensi hari ini.')
      }

      if (!form.bukti) {
        throw new Error('Bukti absensi wajib diupload.')
      }

      const buktiUrl = await uploadBukti()

      const { error: insertError } = await supabase.from('absensi').insert([
        {
          siswa_id: userId,
          guru_id: null,
          tanggal: today,
          status: form.status,
          keterangan: form.catatan_siswa || null,
          sumber_absen: 'siswa',
          status_validasi: 'menunggu_validasi',
          bukti_url: buktiUrl,
          catatan_siswa: form.catatan_siswa || null,
        },
      ])

      if (insertError) {
        throw new Error(insertError.message)
      }

      alert('Absensi berhasil dikirim. Menunggu validasi guru.')

      setForm({
        status: 'hadir',
        catatan_siswa: '',
        bukti: null,
      })

      fetchData()
    } catch (err) {
      setError(err.message || 'Gagal mengirim absensi.')
    } finally {
      setSaving(false)
    }
  }

  const getStatusValidasiBadge = (status) => {
    if (status === 'valid') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
          <CheckCircle2 size={14} />
          Valid
        </span>
      )
    }

    if (status === 'ditolak') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
          <XCircle size={14} />
          Ditolak
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">
        <Clock size={14} />
        Menunggu Validasi
      </span>
    )
  }

  if (loading) {
    return (
      <SiswaLayout nama={userData.nama} kelas={userData.kelas}>
        <div className="rounded-2xl bg-white p-6 shadow-sm text-gray-500">
          Memuat absensi...
        </div>
      </SiswaLayout>
    )
  }

  return (
    <SiswaLayout nama={userData.nama} kelas={userData.kelas}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Absensi Mandiri</h1>
          <p className="mt-2 text-gray-500">
            Absensi ini digunakan saat PJJ dan harus menunggu validasi guru.
          </p>
        </div>

        <Link
          to="/siswa/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-gray-500 px-4 py-3 font-medium text-white hover:bg-gray-600"
        >
          <ArrowLeft size={18} />
          Kembali
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold text-blue-600">
              Form Absensi Hari Ini
            </h2>

            {sudahAbsenHariIni ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
                Kamu sudah mengirim absensi hari ini.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={today}
                    disabled
                    className="w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Status Kehadiran
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3"
                  >
                    <option value="hadir">Hadir</option>
                    <option value="izin">Izin</option>
                    <option value="sakit">Sakit</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Catatan Siswa
                  </label>
                  <textarea
                    name="catatan_siswa"
                    value={form.catatan_siswa}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Contoh: Hadir PJJ melalui Google Meet..."
                    className="w-full rounded-xl border border-gray-300 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Upload Bukti
                  </label>
                  <input
                    type="file"
                    name="bukti"
                    onChange={handleChange}
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Bisa screenshot PJJ, foto tugas, atau PDF bukti izin/sakit.
                  </p>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-500">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Upload size={18} />
                  {saving ? 'Mengirim...' : 'Kirim Absensi'}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white shadow-sm">
            <div className="border-b px-5 py-4">
              <h2 className="text-xl font-bold text-gray-800">
                Riwayat Absensi Saya
              </h2>
            </div>

            <div className="overflow-x-auto p-5">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b text-left text-gray-600">
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Sumber</th>
                    <th className="px-4 py-3">Validasi</th>
                    <th className="px-4 py-3">Bukti</th>
                  </tr>
                </thead>

                <tbody>
                  {absensiList.length > 0 ? (
                    absensiList.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="px-4 py-4">
                          {new Date(item.tanggal).toLocaleDateString('id-ID')}
                        </td>

                        <td className="px-4 py-4 capitalize">
                          {item.status}
                        </td>

                        <td className="px-4 py-4 capitalize">
                          {item.sumber_absen === 'siswa'
                            ? 'Mandiri'
                            : 'Guru'}
                        </td>

                        <td className="px-4 py-4">
                          {getStatusValidasiBadge(item.status_validasi)}
                        </td>

                        <td className="px-4 py-4">
                          {item.bukti_url ? (
                            <a
                              href={item.bukti_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 underline"
                            >
                              Lihat Bukti
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        Belum ada riwayat absensi.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </SiswaLayout>
  )
}

export default SiswaAbsensi