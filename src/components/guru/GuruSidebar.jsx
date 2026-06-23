import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Brain,
  BookOpen,
  ClipboardCheck,
  FileSpreadsheet,
  LogOut,
  User,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

function MenuItem({ to, icon, label, matchPaths = [] }) {
  const location = useLocation()

  const active =
    location.pathname === to ||
    matchPaths.some((path) => location.pathname.startsWith(path))

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
        active
          ? 'bg-white/20 text-white'
          : 'text-blue-100 hover:bg-white/10 hover:text-white'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}

function GuruSidebar() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      alert('Gagal logout')
      return
    }

    navigate('/login')
  }

  return (
    <aside className="flex min-h-screen w-72 flex-col bg-gradient-to-b from-blue-600 to-blue-700 text-white">
      <div className="border-b border-white/20 px-6 py-6">
        <h1 className="text-2xl font-bold">GURU PANEL</h1>
      </div>

      <div className="px-4 py-5">
        <p className="mb-3 text-xs uppercase tracking-wider text-blue-200">
          Menu
        </p>

        <div className="space-y-2">
          <MenuItem
            to="/guru/dashboard"
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
          />

          <MenuItem
            to="/guru/prediksi-remedial"
            icon={<Brain size={18} />}
            label="Prediksi Remedial"
          />

          <MenuItem
            to="/guru/absensi"
            icon={<ClipboardCheck size={18} />}
            label="Absensi Siswa"
          />

          <MenuItem
            to="/guru/kelola-materi"
            icon={<BookOpen size={18} />}
            label="Kelola Materi"
            matchPaths={[
              '/guru/kelola-materi',
              '/guru/materi',
              '/guru/kuis',
            ]}
          />

          <MenuItem
            to="/guru/export-nilai"
            icon={<FileSpreadsheet size={18} />}
            label="Export Hasil Nilai"
            matchPaths={['/guru/export-nilai']}
          />
        </div>
      </div>

      <div className="mt-auto border-t border-white/20 px-4 py-5">
        <div className="space-y-2">
          <Link
            to="/guru/profil"
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-blue-100 hover:bg-white/10 hover:text-white"
          >
            <User size={18} />
            Profil Saya
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-blue-100 hover:bg-white/10 hover:text-white"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  )
}

export default GuruSidebar