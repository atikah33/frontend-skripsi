import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKelas, setFilterKelas] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('nama', { ascending: true });

    if (error) console.error("Error:", error);
    else setStudents(data || []);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data siswa ini?")) {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) alert('Gagal: ' + error.message);
      else {
        alert('Data berhasil dihapus.');
        fetchStudents(); // Memuat ulang data setelah hapus
      }
    }
  };

  const filteredStudents = students.filter((s) => {
    return s.nama.toLowerCase().includes(searchTerm.toLowerCase()) && 
           (filterKelas === '' || s.kelas === filterKelas);
  });

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Data Siswa</h1>
        <Link to="/admin/students/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + Tambah Siswa
        </Link>
      </div>

      {/* Filter UI */}
      <div className="flex gap-4 mb-6">
        <input type="text" placeholder="Cari..." className="border p-2 rounded-lg w-full max-w-sm" onChange={(e) => setSearchTerm(e.target.value)} />
        <select className="border p-2 rounded-lg" onChange={(e) => setFilterKelas(e.target.value)}>
          <option value="">Semua Kelas</option>
          {[...new Set(students.map(s => s.kelas))].map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Nama</th>
              <th className="px-6 py-4">NISN</th>
              <th className="px-6 py-4">Kelas</th>
              <th className="px-6 py-4">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredStudents.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">{s.nama}</td>
                <td className="px-6 py-4">{s.nisn}</td>
                <td className="px-6 py-4">{s.kelas}</td>
                <td className="px-6 py-4">
                  <Link to={`/admin/students/edit/${s.id}`} className="text-blue-600 hover:underline mr-3">Edit</Link>
                  <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:underline">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

export default AdminStudents;