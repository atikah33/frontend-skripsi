import { useState } from 'react'
import GuruLayout from '../../components/guru/GuruLayout'

function PrediksiRemedial() {
  const [form, setForm] = useState({
    rataRataKuis: '',
    totalKuis: '',
    persentaseKehadiran: '',
    jumlahTidakHadir: '',
  })

  const [hasil, setHasil] = useState({
    status: 'BELUM ADA ANALISIS',
    confidence: '0.00%',
  })

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleAnalisis = (e) => {
    e.preventDefault()

    // nanti diganti request ke backend / model ML
    setHasil({
      status: 'BERISIKO REMEDIAL',
      confidence: '76.00%',
    })
  }

  return (
    <GuruLayout>
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-800">Prediksi Risiko Remedial (AI)</h1>
      </div>

      <div className="rounded-2xl bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-blue-700">Input Data Siswa</h2>
        </div>

        <div className="p-6">
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
            <h3 className="text-3xl font-bold text-red-900">Hasil Analisis AI</h3>
            <div className="my-5 border-t border-red-200"></div>
            <p className="text-5xl font-extrabold tracking-wide text-red-900">
              {hasil.status}
            </p>
            <p className="mt-5 text-xl text-red-800">
              Tingkat Keyakinan Model: <span className="font-bold">{hasil.confidence}</span>
            </p>
          </div>

          <form onSubmit={handleAnalisis} className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Rata-rata Nilai Kuis (0-100)
              </label>
              <input
                type="number"
                name="rataRataKuis"
                value={form.rataRataKuis}
                onChange={handleChange}
                placeholder="Contoh: 75.5"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Total Kuis Dikerjakan
              </label>
              <input
                type="number"
                name="totalKuis"
                value={form.totalKuis}
                onChange={handleChange}
                placeholder="Contoh: 10"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Persentase Kehadiran (%)
              </label>
              <input
                type="number"
                name="persentaseKehadiran"
                value={form.persentaseKehadiran}
                onChange={handleChange}
                placeholder="Contoh: 90"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Jumlah Tidak Hadir (Hari)
              </label>
              <input
                type="number"
                name="jumlahTidakHadir"
                value={form.jumlahTidakHadir}
                onChange={handleChange}
                placeholder="Contoh: 2"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 px-5 py-4 text-lg font-semibold text-white hover:bg-blue-700"
              >
                Analisis Sekarang
              </button>
            </div>
          </form>
        </div>
      </div>
    </GuruLayout>
  )
}

export default PrediksiRemedial