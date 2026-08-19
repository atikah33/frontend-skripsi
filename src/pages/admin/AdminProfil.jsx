import { useEffect, useState } from 'react'
import { User, Save, KeyRound, Eye, EyeOff } from 'lucide-react'
import AdminLayout from './AdminLayout'
import { supabase } from '../../lib/supabase'

function AdminProfil() {
  const [profileForm, setProfileForm] = useState({
    nama: '',
    email: '',
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      setProfileError('User tidak ditemukan.')
      setLoadingProfile(false)
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('nama, email')
      .eq('id', user.id)
      .single()

    if (error) {
      setProfileError('Gagal memuat data profil.')
      setLoadingProfile(false)
      return
    }

    setProfileForm({
      nama: data?.nama || user.user_metadata?.nama || 'Super Admin',
      email: user.email || data?.email || '',
    })

    setLoadingProfile(false)
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileForm((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileError('')
    setProfileMessage('')

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      setProfileError('User tidak ditemukan.')
      setSavingProfile(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({ nama: profileForm.nama })
      .eq('id', user.id)

    if (error) {
      setProfileError('Gagal menyimpan profil.')
      setSavingProfile(false)
      return
    }

    setProfileMessage('Profil berhasil diperbarui.')
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

    const { data: { user }, error: getUserError } = await supabase.auth.getUser()

    if (getUserError || !user) {
      setPasswordError('User tidak ditemukan.')
      setSavingPassword(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
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
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setSavingPassword(false)
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center gap-3">
        <User size={34} className="text-gray-700" />
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Profil Administrator</h1>
          <p className="mt-1 text-gray-500">Kelola informasi akun dan keamanan super admin</p>
        </div>
      </div>

      {loadingProfile ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm text-gray-500">
          Memuat profil...
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form Data Diri */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-semibold text-blue-600">Informasi Akun</h2>

            <form onSubmit={handleSaveProfile}>
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">Nama Lengkap</label>
                <input
                  type="text"
                  name="nama"
                  value={profileForm.nama}
                  onChange={handleProfileChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-gray-500 outline-none"
                />
                <p className="mt-2 text-sm text-gray-400">Email admin tidak dapat diubah.</p>
              </div>

              {profileError && <p className="mb-4 text-sm text-red-500">{profileError}</p>}
              {profileMessage && <p className="mb-4 text-sm text-green-600">{profileMessage}</p>}

              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Save size={18} />
                {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </form>
          </div>

          {/* Form Ganti Password */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-semibold text-red-500">Ganti Password</h2>

            <form onSubmit={handleChangePassword}>
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">Password Saat Ini</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 outline-none focus:border-red-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">Password Baru</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 outline-none focus:border-red-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">Konfirmasi Password Baru</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 outline-none focus:border-red-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {passwordError && <p className="mb-4 text-sm text-red-500">{passwordError}</p>}
              {passwordMessage && <p className="mb-4 text-sm text-green-600">{passwordMessage}</p>}

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
    </AdminLayout>
  )
}

export default AdminProfil