import GuruSidebar from './GuruSidebar'
import GuruTopbar from './GuruTopbar'

function GuruLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        <GuruSidebar />

        <div className="flex min-h-screen flex-1 flex-col">
          <GuruTopbar />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}

export default GuruLayout