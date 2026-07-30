import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { supabase } from '../../lib/supabase';

function EditSiswa() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ nama: '', nisn: '', kelas: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const fetchStudent = async () => {
    const { data, error } = await supabase.from('students').select('*').eq('id', id).single();
    if (error) alert(error.message);
    else setFormData(data);
    setLoading(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('students').update(formData).eq('id', id);
    if (error) alert(error.message);
    else {
      alert('Data berhasil diupdate!');
      navigate('/admin/students');
    }
  };

  if (loading) return <AdminLayout>Memuat data...</AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl border">
        {/* Tombol Kembali */}
        <button 
          onClick={() => navigate(-1)} 
          className="mb-6 text-sm text-gray-500 hover:text-blue-600 flex items-center font-medium"
        >
          &larr; Kembali
        </button>

        <h1 className="text-2xl font-bold mb-6">Edit Siswa</h1>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input className="w-full border p-2 rounded" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NISN</label>
            <input className="w-full border p-2 rounded" value={formData.nisn} onChange={e => setFormData({...formData, nisn: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
            <input className="w-full border p-2 rounded" value={formData.kelas} onChange={e => setFormData({...formData, kelas: e.target.value})} />
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">Simpan Perubahan</button>
        </form>
      </div>
    </AdminLayout>
  );
}
export default EditSiswa;