function StatCard({ title, value, subtitle, color = 'blue' }) {
  const colors = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    cyan: 'border-cyan-500',
    yellow: 'border-yellow-500',
  }

  return (
    <div className={`rounded-2xl border-l-4 ${colors[color]} bg-white p-5 shadow-sm`}>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <h3 className="mt-2 text-3xl font-bold text-gray-800">{value}</h3>
      <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
    </div>
  )
}

export default StatCard