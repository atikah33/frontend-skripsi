import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, BookOpen, ClipboardCheck, User, LogOut } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function NavItem({ to, icon, label }) {
  const location = useLocation()
  const active = location.pathname === to

  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2 text-sm font-medium ${
        active ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}

function SiswaNavbar({ nama = 'Siswa', kelas = 'Kelas 1' }) {
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
    <header className="border-b bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">
              🎓
            </div>
            <h1 className="text-2xl font-bold text-blue-600">SMK Taruna Terpadu 2</h1>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            <NavItem
              to="/siswa/dashboard"
              icon={<LayoutDashboard size={16} />}
              label="Dashboard"
            />
            <NavItem
              to="/siswa/materi-kuis"
              icon={<BookOpen size={16} />}
              label="Materi & Kuis"
            />
            <NavItem
              to="/siswa/absensi"
              icon={<ClipboardCheck size={16} />}
              label="Absensi"
            />
          </nav>
        </div>

        <div className="group relative">
          <button className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-gray-50">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
              {nama?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="font-semibold text-gray-800">{nama}</p>
              <p className="text-sm text-gray-500">{kelas}</p>
            </div>
          </button>

          <div className="invisible absolute right-0 top-full z-20 mt-2 w-52 rounded-2xl border bg-white p-2 opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100">
            <Link
              to="/siswa/profil"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-gray-700 hover:bg-gray-50"
            >
              <User size={16} />
              Profil Saya
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-red-500 hover:bg-red-50"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default SiswaNavbar