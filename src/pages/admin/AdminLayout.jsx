import { useState } from 'react'
import { Outlet, useNavigate, Link } from 'react-router-dom'
import { User, LogOut, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function AdminLayout({ children }) {
  const navigate = useNavigate()
  const [openMenu, setOpenMenu] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
        <h1 className="text-2xl font-bold text-blue-600">
           SMK Taruna Terpadu 2
        </h1>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu((prev) => !prev)}
            className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-gray-50"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <User size={18} />
            </div>

            <div className="text-left">
              <p className="text-sm font-bold text-gray-800">Super Admin</p>
            </div>

            <ChevronDown size={16} />
          </button>

          {openMenu && (
            <div className="absolute right-0 top-14 z-50 w-48 rounded-xl border bg-white py-2 shadow-xl">
              <Link
                to="/admin/profil"
                onClick={() => setOpenMenu(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                <User size={16} />
                Profil Saya
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="p-6">
        {children || <Outlet />}
      </main>
    </div>
  )
}

export default AdminLayout