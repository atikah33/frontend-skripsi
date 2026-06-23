import { useEffect, useState } from 'react'
import { KeyRound, Save, Settings, UserCog } from 'lucide-react'
import GuruLayout from '../../components/guru/GuruLayout'
import { supabase } from '../../lib/supabase'

function ProfilGuru() {
  const [profileForm, setProfileForm] = useState({
    nama: '',
    nip: '',
    email: '',
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const fetchProfile = async () => {
    setLoadingProfile(true)
    setProfileError('')
    setProfileMessage('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setProfileError('User tidak ditemukan.')
      setLoadingProfile(false)
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('nama, nip, email')
      .eq('id', user.id)
      .single()

    if (error) {
      setProfileError('Gagal memuat data profil.')
      setLoadingProfile(false)
      return
    }

    setProfileForm({
      nama: data?.nama || '',
      nip: data?.nip || '',
      email: user.email || data?.email || '',
    })

    setLoadingProfile(false)
  }

  useEffect(() => {
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
    setProfileError('')
    setProfileMessage('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setProfileError('User tidak ditemukan.')
      setSavingProfile(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        nama: profileForm.nama,
        nip: profileForm.nip,
      })
      .eq('id', user.id)

    if (error) {
      setProfileError('Gagal menyimpan profil.')
      setSavingProfile(false)
      return
    }

    setProfileMessage('Profil berhasil disimpan.')
    setSavingProfile(false)
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setSavingPassword(true)
    setPasswordError('')
    setPasswordMessage('')

    const { currentPassword, newPassword, confirmPassword } = passwordForm

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Semua field password wajib diisi.')
      setSavingPassword(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi password baru tidak cocok.')
      setSavingPassword(false)
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('Password baru minimal 6 karakter.')
      setSavingPassword(false)
      return
    }

    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser()

    if (getUserError || !user) {
      setPasswordError('User tidak ditemukan.')
      setSavingPassword(false)
      return
    }

    const email = user.email

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    })

    if (signInError) {
      setPasswordError('Password saat ini salah.')
      setSavingPassword(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      setPasswordError('Gagal mengganti password.')
      setSavingPassword(false)
      return
    }

    setPasswordMessage('Password berhasil diganti.')
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setSavingPassword(false)
  }

  return (
    <GuruLayout>
      <div className="mb-6">
        <h1 className="flex items-center gap-3 text-4xl font-bold text-gray-800">
          <Settings size={34} />
          Pengaturan Profil
        </h1>
      </div>

      {loadingProfile ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-gray-500">Memuat profil...</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white shadow-sm">
            <div className="border-l-4 border-blue-500 border-b px-5 py-4">
              <h2 className="text-xl font-semibold text-blue-600">Data Diri</h2>
            </div>

            <form onSubmit={handleSaveProfile} className="p-5">
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
                  NIP (Nomor Induk Pegawai)
                </label>
                <input
                  type="text"
                  name="nip"
                  value={profileForm.nip}
                  readOnly
                  className="w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-gray-500 outline-none"
                />
                <p className="mt-2 text-sm text-gray-400">
                   Data terkunci. Hanya Admin yang dapat mengubah.
                </p>
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileForm.email}
                  disabled
                  className="w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-gray-500 outline-none"
                />
                <p className="mt-2 text-sm text-gray-400">
                  Email tidak dapat diubah dari halaman ini.
                </p>
              </div>

              {profileError && (
                <p className="mb-4 text-sm text-red-500">{profileError}</p>
              )}

              {profileMessage && (
                <p className="mb-4 text-sm text-green-600">{profileMessage}</p>
              )}

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

          <div className="rounded-2xl bg-white shadow-sm">
            <div className="border-l-4 border-red-500 border-b px-5 py-4">
              <h2 className="text-xl font-semibold text-red-500">Ganti Password</h2>
            </div>

            <form onSubmit={handleChangePassword} className="p-5">
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Password Saat Ini
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-red-400"
                  required
                />
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Password Baru
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-red-400"
                  required
                />
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-red-400"
                  required
                />
              </div>

              {passwordError && (
                <p className="mb-4 text-sm text-red-500">{passwordError}</p>
              )}

              {passwordMessage && (
                <p className="mb-4 text-sm text-green-600">{passwordMessage}</p>
              )}

              <button
                type="submit"
                disabled={savingPassword}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-3 font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                <KeyRound size={18} />
                {savingPassword ? 'Memproses...' : 'Ganti Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </GuruLayout>
  )
}

export default ProfilGuru