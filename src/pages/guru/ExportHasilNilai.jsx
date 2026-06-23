import { useEffect, useMemo, useState } from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import GuruLayout from '../../components/guru/GuruLayout'
import { supabase } from '../../lib/supabase'

function ExportHasilNilai() {
  const [kelasList, setKelasList] = useState([])
  const [kelas, setKelas] = useState('')
  const [bulan, setBulan] = useState(new Date().toISOString().slice(0, 7))
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

  const normalizeKelas = (value) =>
    String(value || '')
      .replace(/^Kelas\s+/i, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()

  const formatDate = (date) => {
    if (!date) return '-'

    return new Date(date).toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  const fetchKelas = async () => {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('profiles')
      .select('kelas')
      .eq('role', 'siswa')

    if (error) {
      setError(`Gagal memuat kelas: ${error.message}`)
      setLoading(false)
      return
    }

    const uniqueKelas = [
      ...new Set((data || []).map((item) => item.kelas).filter(Boolean)),
    ].sort()

    setKelasList(uniqueKelas)
    setKelas(uniqueKelas[0] || '')
    setLoading(false)
  }

  useEffect(() => {
    fetchKelas()
  }, [])

  const bulanLabel = useMemo(() => {
    if (!bulan) return '-'

    return new Date(`${bulan}-01`).toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
    })
  }, [bulan])

  const handleExportExcel = async () => {
    setExporting(true)
    setError('')

    try {
      if (!kelas) {
        throw new Error('Pilih kelas terlebih dahulu.')
      }

      if (!bulan) {
        throw new Error('Pilih bulan terlebih dahulu.')
      }

      const startDate = `${bulan}-01T00:00:00.000`
      const endDateObject = new Date(`${bulan}-01T00:00:00`)
      endDateObject.setMonth(endDateObject.getMonth() + 1)
      const endDate = endDateObject.toISOString()

      const kelasDenganPrefix = kelas.startsWith('Kelas ') ? kelas : `Kelas ${kelas}`
      const kelasTanpaPrefix = kelas.replace(/^Kelas\s+/i, '').trim()

      const { data: siswaData, error: siswaError } = await supabase
        .from('profiles')
        .select('id, nama, email, kelas, nis, nisn, role')
        .eq('role', 'siswa')

      if (siswaError) {
        throw new Error(`Gagal mengambil data siswa: ${siswaError.message}`)
      }

      const siswaKelas = (siswaData || [])
        .filter((siswa) => normalizeKelas(siswa.kelas) === normalizeKelas(kelas))
        .sort((a, b) => {
          const nisA = String(a.nis || a.nisn || '')
          const nisB = String(b.nis || b.nisn || '')

          if (nisA && nisB) return nisA.localeCompare(nisB)
          return String(a.nama || '').localeCompare(String(b.nama || ''))
        })

      if (siswaKelas.length === 0) {
        throw new Error('Tidak ada siswa pada kelas ini.')
      }

      const { data: kuisData, error: kuisError } = await supabase
        .from('kuis')
        .select('*')
        .in('kelas', [kelasDenganPrefix, kelasTanpaPrefix])
        .gte('created_at', startDate)
        .lt('created_at', endDate)
        .order('created_at', { ascending: true })

      if (kuisError) {
        throw new Error(`Gagal mengambil data kuis: ${kuisError.message}`)
      }

      if (!kuisData || kuisData.length === 0) {
        throw new Error('Tidak ada kuis pada kelas dan bulan yang dipilih.')
      }

      const kuisIds = kuisData.map((item) => item.id)

      const { data: submissionData, error: submissionError } = await supabase
        .from('kuis_submission')
        .select('*')
        .in('kuis_id', kuisIds)

      if (submissionError) {
        throw new Error(`Gagal mengambil data nilai: ${submissionError.message}`)
      }

      const submissionMap = new Map()

      ;(submissionData || []).forEach((item) => {
        submissionMap.set(`${item.kuis_id}-${item.siswa_id}`, item)
      })

      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Export Nilai')

      worksheet.mergeCells('A1:L1')
      worksheet.getCell('A1').value = 'LAPORAN HASIL NILAI KUIS SISWA'
      worksheet.getCell('A1').font = { bold: true, size: 16 }
      worksheet.getCell('A1').alignment = { horizontal: 'center' }

      worksheet.mergeCells('A2:L2')
      worksheet.getCell('A2').value = `Kelas: ${kelas} | Bulan: ${bulanLabel}`
      worksheet.getCell('A2').alignment = { horizontal: 'center' }

      worksheet.mergeCells('A3:L3')
      worksheet.getCell('A3').value = `Tanggal Export: ${formatDate(new Date())}`
      worksheet.getCell('A3').alignment = { horizontal: 'center' }

      worksheet.addRow([])

      const headerRow = worksheet.addRow([
        'No',
        'NIS/NISN',
        'Nama Siswa',
        'Email',
        'Kelas',
        'Judul Kuis',
        'Tanggal Kuis',
        'Deadline',
        'Tanggal Kirim',
        'Ketepatan',
        'Status',
        'Nilai',
      ])

      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2563EB' },
        }
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle',
          wrapText: true,
        }
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        }
      })

      let no = 1

      kuisData.forEach((kuis) => {
        siswaKelas.forEach((siswa) => {
          const submission = submissionMap.get(`${kuis.id}-${siswa.id}`)

          const statusNilai = submission
            ? submission.status === 'dinilai'
              ? 'Sudah Dinilai'
              : 'Belum Dinilai'
            : 'Belum Mengumpulkan'

          const ketepatan = submission
            ? submission.is_late
              ? 'Terlambat'
              : 'Tepat Waktu'
            : 'Belum Mengumpulkan'

          worksheet.addRow([
            no++,
            siswa.nis || siswa.nisn || '-',
            siswa.nama || '-',
            siswa.email || '-',
            siswa.kelas || kelas,
            kuis.judul || '-',
            formatDate(kuis.created_at),
            formatDate(kuis.deadline),
            submission?.submitted_at ? formatDate(submission.submitted_at) : '-',
            ketepatan,
            statusNilai,
            submission?.nilai ?? '-',
          ])
        })
      })

      worksheet.columns = [
        { width: 6 },
        { width: 18 },
        { width: 28 },
        { width: 30 },
        { width: 18 },
        { width: 35 },
        { width: 22 },
        { width: 22 },
        { width: 22 },
        { width: 20 },
        { width: 20 },
        { width: 12 },
      ]

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber >= 5) {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            }
            cell.alignment = {
              vertical: 'middle',
              wrapText: true,
            }
          })
        }
      })

      worksheet.views = [{ state: 'frozen', ySplit: 5 }]

      const buffer = await workbook.xlsx.writeBuffer()

      saveAs(
        new Blob([buffer]),
        `Export_Nilai_${kelas}_${bulan}.xlsx`,
      )
    } catch (err) {
      setError(err.message || 'Gagal export Excel.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <GuruLayout>
      <div className="mb-6">
        <h1 className="flex items-center gap-3 text-4xl font-bold text-gray-800">
          <FileSpreadsheet size={36} />
          Export Hasil Nilai
        </h1>
        <p className="mt-2 text-gray-500">
          Export nilai kuis siswa per kelas dan per bulan ke file Excel.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-xl font-semibold text-blue-600">
          Filter Export
        </h2>

        {loading ? (
          <p className="text-gray-500">Memuat data kelas...</p>
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Kelas
                </label>
                <select
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3"
                >
                  <option value="">Pilih Kelas</option>
                  {kelasList.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Bulan
                </label>
                <input
                  type="month"
                  value={bulan}
                  onChange={(e) => setBulan(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={exporting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <Download size={18} />
                  {exporting ? 'Mengekspor...' : 'Export Excel'}
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
              Data yang diexport adalah semua nilai kuis pada kelas dan bulan yang
              dipilih. Urutan Excel dibuat berdasarkan judul kuis, lalu daftar
              siswa pada kelas tersebut.
            </div>
          </>
        )}

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-500">
            {error}
          </div>
        )}
      </div>
    </GuruLayout>
  )
}

export default ExportHasilNilai