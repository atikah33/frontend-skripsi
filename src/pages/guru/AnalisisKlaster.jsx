import { useState } from 'react'
import GuruLayout from '../../components/guru/GuruLayout'
import { Upload, FileSpreadsheet, Download, CheckCircle, BarChart2 } from 'lucide-react'

const API_URL = 'https://web-production-8118f.up.railway.app'

function AnalisisKlaster() {
  const [file, setFile] = useState(null)
  const [semesterPilihan, setSemesterPilihan] = useState('Semester Ganjil')
  const [loading, setLoading] = useState(false)
  const [hasilAnalisis, setHasilAnalisis] = useState(null)
  const [error, setError] = useState('')

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
    setError('')
  }

  const handleAnalisis = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Silakan upload file Excel data nilai terlebih dahulu.')
      return
    }

    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('semester', semesterPilihan)

    try {
      const response = await fetch(`${API_URL}/api/analisis-perbandingan`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.detail || 'Gagal memproses analisis data.')
      }

      setHasilAnalisis(result)
    } catch (err) {
      console.error(err)
      setError('Gagal terhubung ke server ML Python. Pastikan server python main.py sudah berjalan.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!hasilAnalisis || !hasilAnalisis.siswaClustering) return
    const kelasName = hasilAnalisis.ringkasanKelas?.namaKelas || 'kelas'
    
    try {
      const response = await fetch(`${API_URL}/api/download-laporan-excel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kelas: kelasName,
          siswaClustering: hasilAnalisis.siswaClustering,
        }),
      })

      if (!response.ok) throw new Error('Gagal mengunduh laporan Excel')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `laporan_analisis_${kelasName.replace(/\s+/g, '_')}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (err) {
      console.error(err)
      alert('Gagal mendownload laporan Excel.')
    }
  }

  return (
    <GuruLayout>
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-800">Analisis Klasterisasi & Performa (AI)</h1>
        <p className="mt-2 text-gray-500">
          Upload data nilai siswa per semester & mata pelajaran untuk pengelompokan otomatis.
        </p>
      </div>

      {/* Form Upload */}
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-blue-600">Upload Data Nilai (Excel / XML)</h2>
        
        <form onSubmit={handleAnalisis} className="space-y-4">
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 p-6 text-center hover:border-blue-500">
            <FileSpreadsheet size={48} className="mb-2 text-green-600" />
            <p className="text-sm font-medium text-gray-700">
              {file ? file.name : 'Seret file Excel ke sini atau klik untuk memilih file'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Format yang didukung: .xlsx, .xls</p>
            
            <input
              type="file"
              onChange={handleFileChange}
              accept=".xlsx,.xls"
              className="mt-4 cursor-pointer rounded-xl border border-gray-300 px-4 py-2 text-sm bg-gray-50"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Pilih Semester <span className="text-red-500">*</span>
            </label>
            <select
              value={semesterPilihan}
              onChange={(e) => setSemesterPilihan(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 bg-white text-sm"
            >
              <option value="Semester Ganjil">Semester Ganjil</option>
              <option value="Semester Genap">Semester Genap</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Upload size={18} />
            {loading ? 'Sedang Menganalisis Klaster...' : 'Mulai Analisis AI'}
          </button>
        </form>
      </div>

      {/* Hasil Analisis */}
      {hasilAnalisis && (
        <div className="space-y-6">
          {/* Ringkasan Kelas */}
          <div className="rounded-2xl bg-blue-50 border border-blue-200 p-6 shadow-sm">
            <h2 className="mb-3 text-xl font-bold text-blue-800 flex items-center gap-2">
              <CheckCircle size={22} /> Ringkasan Performa Kelas & Evaluasi Model
            </h2>
            <div className="grid gap-4 md:grid-cols-3 mb-4 text-sm text-gray-700">
              <p><strong>Kelas:</strong> {hasilAnalisis.ringkasanKelas.namaKelas}</p>
              <p><strong>Mata Pelajaran:</strong> {hasilAnalisis.ringkasanKelas.mata_pelajaran}</p>
              <p><strong>Semester:</strong> {hasilAnalisis.ringkasanKelas.semester}</p>
            </div>
            
            <div className="rounded-xl bg-white p-4 shadow-inner mb-4">
              <p className="text-sm font-semibold text-gray-600">Persentase Tingkat Keberhasilan Kelas:</p>
              <p className="text-3xl font-bold text-blue-600 my-1">{hasilAnalisis.ringkasanKelas.persentasePerforma}</p>
              <p className="text-sm text-gray-600 mt-2"><strong>Keterangan AI:</strong> {hasilAnalisis.ringkasanKelas.keterangan}</p>
            </div>

            {/* Tabel Perbandingan Algoritma */}
            <div className="rounded-xl bg-white p-4 shadow-inner">
              <h3 className="text-md font-bold text-gray-800 mb-2">Hasil Perbandingan Algoritma (Silhouette Score)</h3>
              <div className="grid gap-2 md:grid-cols-3">
                {hasilAnalisis.perbandinganModel.map((item, idx) => (
                  <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                    <p className="font-semibold text-sm text-blue-700">{item.algoritma}</p>
                    <p className="text-xs text-gray-500 mt-1">Score: <strong>{item.silhouetteScore}</strong></p>
                    <span className="inline-block mt-2 px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bagian Visualisasi Grafik */}
          {hasilAnalisis.chartImages && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-sm flex flex-col items-center">
                <h3 className="text-md font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <BarChart2 size={18} className="text-blue-600" /> Distribusi Performa Kelas
                </h3>
                <img 
                  src={hasilAnalisis.chartImages.distribusi} 
                  alt="Distribusi Chart" 
                  className="rounded-lg border max-w-full h-auto" 
                />
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm flex flex-col items-center">
                <h3 className="text-md font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <BarChart2 size={18} className="text-blue-600" /> Perbandingan Harian vs Ujian
                </h3>
                <img 
                  src={hasilAnalisis.chartImages.scatterPlot} 
                  alt="Scatter Plot Chart" 
                  className="rounded-lg border max-w-full h-auto" 
                />
              </div>
            </div>
          )}

          {/* Tabel Klasterisasi Seluruh Siswa */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Label Klaster Seluruh Siswa ({hasilAnalisis.siswaClustering.length} Siswa)
              </h2>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 text-sm"
              >
                <Download size={16} /> Download Laporan (Excel)
              </button>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="min-w-full overflow-hidden rounded-xl border border-gray-200 text-sm">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">No</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Nama Siswa</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Composite Score</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Klaster Utama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {hasilAnalisis.siswaClustering.map((siswa, index) => (
                    <tr key={siswa.id || index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{siswa.nama}</td>
                      <td className="px-4 py-3 text-center font-semibold text-blue-600">{siswa.nilaiRataRata}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                          siswa.cluster === 'Perlu Perhatian' 
                            ? 'bg-red-100 text-red-700' 
                            : siswa.cluster === 'Sangat Baik'
                            ? 'bg-green-100 text-green-700'
                            : siswa.cluster === 'Baik'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {siswa.cluster}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </GuruLayout>
  )
}

export default AnalisisKlaster