import SiswaNavbar from './SiswaNavbar'

function SiswaLayout({ children, nama, kelas }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <SiswaNavbar nama={nama} kelas={kelas} />
      <main className="p-6">{children}</main>
    </div>
  )
}

export default SiswaLayout