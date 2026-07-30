import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Loader2, ArrowLeft } from 'lucide-react';
import AdminLayout from './AdminLayout';

function TambahSiswa() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // State untuk menangani input kelas manual (bisa digunakan jika ingin menambahkan siswa per orang)
  const [kelas, setKelas] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi tipe file
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      alert("Harap pilih file dengan format .csv");
      e.target.value = '';
      return;
    }

    setLoading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    // Jika backend Anda membutuhkan data kelas tambahan dari file CSV, 
    // pastikan struktur CSV Anda sudah sesuai.

    try {
      const response = await fetch('http://localhost:3000/api/admin/users/import-csv', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message || "Data siswa berhasil diimpor!");
        navigate('/admin/users');
      } else {
        alert("Gagal: " + (result.error || "Terjadi kesalahan pada server."));
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi ke server.");
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <button 
          onClick={() => navigate(-1)} 
          className="mb-6 text-sm text-gray-500 hover:text-blue-600 flex items-center gap-2 font-medium transition-colors"
        >
          <ArrowLeft size={16} /> Kembali
        </button>

        <h1 className="text-2xl font-bold mb-6 text-gray-800">Import Data Siswa (CSV)</h1>
        
        {/* Input Manual Kelas - Tambahan untuk admin agar fleksibel */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Kelas (Opsional, ketik manual)
          </label>
          <input
            type="text"
            placeholder="Contoh: X IPA 4"
            value={kelas}
            onChange={(e) => setKelas(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="mb-8 p-4 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-100">
          <p className="font-bold mb-1">Panduan Format CSV:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Pastikan file dalam format .csv</li>
            <li>Urutan kolom: <span className="font-mono bg-blue-100 px-1 rounded">NISN, Nama Peserta Didik, Kelas</span></li>
            <li>Input di atas bersifat fleksibel, tidak perlu lagi mengandalkan dropdown kaku.</li>
          </ul>
        </div>

        <div className="border-2 border-dashed border-gray-300 p-10 text-center rounded-lg hover:border-blue-400 transition-colors">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <p className="text-blue-600 font-medium">Sedang memproses database...</p>
            </div>
          ) : (
            <>
              <UploadCloud className="mx-auto mb-4 text-gray-400" size={40} />
              <p className="mb-4 text-gray-600">Klik atau pilih file CSV untuk mengunggah</p>
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileUpload} 
                disabled={loading}
                className="block w-full max-w-[250px] mx-auto text-sm text-gray-500 
                file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 
                file:text-sm file:font-semibold file:bg-blue-600 file:text-white 
                hover:file:bg-blue-700 cursor-pointer"
              />
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default TambahSiswa;