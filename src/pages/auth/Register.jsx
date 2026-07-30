import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { UserPlus, Mail, Lock, User, Shield, Hash, BookOpen } from 'lucide-react'

function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nama: '',
    email: '',
    password: '',
    nisn: '',      // <-- Tambahan NISN
    kelas: '',     // <-- Tambahan Kelas
    role: 'siswa',  
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Jika yang mendaftar adalah siswa, pastikan NISN dan Kelas diisi
    if (form.role === 'siswa' && (!form.nisn || !form.kelas)) {
      setError('NISN dan Kelas wajib diisi untuk siswa.')
      setLoading(false)
      return
    }

    // 1. Daftarkan user ke Supabase Auth dengan membawa data tambahan di metadata
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          nama: form.nama,
          role: form.role,
          nisn: form.nisn,
          kelas: form.kelas,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    alert('Registrasi berhasil! Silakan login.')
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Buat Akun Baru</h1>
          <p className="mt-2 text-sm text-gray-500">Daftar sebagai Siswa atau Guru</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Daftar Sebagai</label>
            <div className="relative">
              <Shield className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 outline-none focus:border-blue-500 bg-white"
              >
                <option value="siswa">Siswa</option>
                <option value="guru">Guru</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Nama Lengkap</label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                type="text"
                name="nama"
                value={form.nama}
                onChange={handleChange}
                placeholder="Masukkan nama lengkap"
                required
                className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Kolom khusus jika yang mendaftar adalah SISWA */}
          {form.role === 'siswa' && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">NISN</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input
                    type="text"
                    name="nisn"
                    value={form.nisn}
                    onChange={handleChange}
                    placeholder="Masukkan NISN"
                    required
                    className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Kelas</label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input
                    type="text"
                    name="kelas"
                    value={form.kelas}
                    onChange={handleChange}
                    placeholder="Contoh: X OTKP 2"
                    required
                    className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="nama@email.com"
                required
                className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <UserPlus size={18} />
            {loading ? 'Memproses...' : 'Daftar Sekarang'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Sudah punya akun?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:underline">
            Login di sini
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register