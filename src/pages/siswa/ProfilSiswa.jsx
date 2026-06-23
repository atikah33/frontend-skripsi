import { useEffect, useState } from 'react'
import { UserCog, Save, KeyRound } from 'lucide-react'
import SiswaLayout from '../../components/siswa/SiswaLayout'
import { supabase } from '../../lib/supabase'

function ProfilSiswa() {
  const [userData, setUserData] = useState({
    nama: 'Siswa',
    kelas: 'Belum ada kelas',
  })

  const [profileForm, setProfileForm] = useState({
    nama: '',
    kelas: '',
    email: '',
  })

  const [passwordForm, setPasswordForm] = useState({
    passwordLama: '',
    passwordBaru: '',
    konfirmasiPasswordBaru: '',
  })

  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      setError('')
      setSuccess('')

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setError('Gagal memuat data user.')
        setLoading(false)
        return
      }

      setUserId(user.id)

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('nama, kelas, email')
        .eq('id', user.id)
        .single()

      if (profileError) {
        setError('Gagal memuat profil siswa.')
        setLoading(false)
        return
      }

      const nama = profile?.nama || 'Siswa'
      const kelas = profile?.kelas || 'Belum ada kelas'
      const email = profile?.email || user.email || ''

      setUserData({
        nama,
        kelas,
      })

      setProfileForm({
        nama,
        kelas,
        email,
      })

      setLoading(false)
    }

    fetchProfile()
  }, [])

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    setError('')
    setSuccess('')

    if (!userId) {
      setError('User tidak ditemukan.')
      setSavingProfile(false)
      return
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        nama: profileForm.nama,
        kelas: profileForm.kelas,
      })
      .eq('id', userId)

    if (updateError) {
      setError('Gagal menyimpan profil.')
      setSavingProfile(false)
      return
    }

    setUserData({
      nama: profileForm.nama,
      kelas: profileForm.kelas,
    })

    setSuccess('Profil berhasil diperbarui.')
    setSavingProfile(false)
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setSavingPassword(true)
    setError('')
    setSuccess('')

    if (!passwordForm.passwordBaru || !passwordForm.konfirmasiPasswordBaru) {
      setError('Password baru dan konfirmasi password wajib diisi.')
      setSavingPassword(false)
      return
    }

    if (passwordForm.passwordBaru.length < 6) {
      setError('Password baru minimal 6 karakter.')
      setSavingPassword(false)
      return
    }

    if (passwordForm.passwordBaru !== passwordForm.konfirmasiPasswordBaru) {
      setError('Konfirmasi password baru tidak cocok.')
      setSavingPassword(false)
      return
    }

    const { error: passwordError } = await supabase.auth.updateUser({
      password: passwordForm.passwordBaru,
    })

    if (passwordError) {
      setError(passwordError.message || 'Gagal mengubah password.')
      setSavingPassword(false)
      return
    }

    setPasswordForm({
      passwordLama: '',
      passwordBaru: '',
      konfirmasiPasswordBaru: '',
    })

    setSuccess('Password berhasil diubah.')
    setSavingPassword(false)
  }

  if (loading) {
    return (
      <SiswaLayout nama={userData.nama} kelas={userData.kelas}>
        <div className="rounded-2xl bg-white p-6 shadow-sm text-gray-500">
          Memuat profil siswa...
        </div>
      </SiswaLayout>
    )
  }

  return (
    <SiswaLayout nama={userData.nama} kelas={userData.kelas}>
      <div className="mb-6 flex items-center gap-3">
        <UserCog size={34} className="text-gray-700" />
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Pengaturan Profil</h1>
          <p className="mt-2 text-gray-500">Kelola data diri dan password akun siswa</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-500 shadow-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-700 shadow-sm">
          {success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-semibold text-blue-600">Data Diri</h2>

          <form onSubmit={handleSaveProfile}>
            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Nama Lengkap
              </label>
              <input
                type="text"
                name="nama"
                value={profileForm.nama}
                onChange={handleProfileChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Kelas
              </label>
              <input
                type="text"
                name="kelas"
                value={profileForm.kelas}
                onChange={handleProfileChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />
              <p className="mt-2 text-sm text-gray-500">
                Bisa dikunci nanti kalau kamu mau kelas hanya diubah admin.
              </p>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={profileForm.email}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-gray-500 outline-none"
              />
              <p className="mt-2 text-sm text-gray-500">
                Email tidak bisa diubah dari halaman ini.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={18} />
              {savingProfile ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </form>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-semibold text-red-500">Ganti Password</h2>

          <form onSubmit={handleChangePassword}>
            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Password Saat Ini
              </label>
              <input
                type="password"
                name="passwordLama"
                value={passwordForm.passwordLama}
                onChange={handlePasswordChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                placeholder="Opsional untuk sekarang"
              />
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Password Baru
              </label>
              <input
                type="password"
                name="passwordBaru"
                value={passwordForm.passwordBaru}
                onChange={handlePasswordChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Konfirmasi Password Baru
              </label>
              <input
                type="password"
                name="konfirmasiPasswordBaru"
                value={passwordForm.konfirmasiPasswordBaru}
                onChange={handlePasswordChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-3 font-semibold text-white hover:bg-red-600 disabled:opacity-50"
            >
              <KeyRound size={18} />
              {savingPassword ? 'Menyimpan...' : 'Ganti Password'}
            </button>
          </form>
        </div>
      </div>
    </SiswaLayout>
  )
}

export default ProfilSiswa