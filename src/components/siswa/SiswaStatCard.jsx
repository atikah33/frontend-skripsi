function SiswaStatCard({ icon, title, value, subtitle, bg = 'bg-blue-50' }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className={`flex h-16 w-16 items-center justify-center rounded-full ${bg}`}>
          {icon}
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-gray-700">
            {title}
          </p>
          <h3 className="mt-4 text-4xl font-extrabold text-gray-900">{value}</h3>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}

export default SiswaStatCard