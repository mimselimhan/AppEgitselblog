import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Student } from '../types';
import { Plus, Phone, Search, Edit2, ChevronRight, BarChart3, Lock, User } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

export const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentStats, setStudentStats] = useState({
    completed: 0,
    planned: 0,
    totalPaid: 0,
    totalDebt: 0
  });

  // Form State
  const [formData, setFormData] = useState<Partial<Student>>({
    name: '', phone: '', hourly_rate: 0, notes: '', username: '', password: ''
  });

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const { data } = await supabase.from('students').select('*').order('name');
    if (data) setStudents(data);
  };

  const calculateStudentStats = async (student: Student) => {
    const { data: lessons } = await supabase
        .from('lessons')
        .select('*')
        .eq('student_id', student.id);

    if (!lessons) return;

    const now = new Date().getTime();
    let completed = 0;
    let planned = 0;
    let totalPaid = 0;
    let totalDebt = 0;

    lessons.forEach(l => {
        const start = new Date(l.start_time).getTime();
        const end = new Date(l.end_time).getTime();
        const durationHours = (end - start) / (1000 * 60 * 60);
        const amount = durationHours * student.hourly_rate; // Approximate using current rate

        if (start < now) {
            completed++;
            if (l.is_paid) {
                totalPaid += amount;
            } else {
                totalDebt += amount;
            }
        } else {
            planned++;
        }
    });

    setStudentStats({ completed, planned, totalPaid, totalDebt });
  };

  const handleStudentClick = async (student: Student) => {
    setSelectedStudent(student);
    await calculateStudentStats(student);
    setIsStatsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate unique username if changed
    if (formData.username) {
        // Basic check, ideally handle DB error constraint
    }

    if (selectedStudent && isFormModalOpen) {
      // Editing
      await supabase.from('students').update(formData).eq('id', selectedStudent.id);
    } else {
      // Adding
      await supabase.from('students').insert([formData]);
    }
    setIsFormModalOpen(false);
    setSelectedStudent(null);
    setFormData({ name: '', phone: '', hourly_rate: 0, notes: '', username: '', password: '' });
    fetchStudents();
  };

  const openEdit = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation(); // Don't open stats
    setSelectedStudent(student);
    setFormData(student);
    setIsFormModalOpen(true);
  };

  const openAdd = () => {
    setSelectedStudent(null);
    setFormData({ name: '', phone: '', hourly_rate: 0, notes: '', username: '', password: '' });
    setIsFormModalOpen(true);
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pb-24 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-slate-800">Öğrenciler</h2>
        <button 
          onClick={openAdd}
          className="bg-slate-800 text-white p-3 rounded-full shadow-lg hover:bg-slate-700 active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
            type="text" 
            placeholder="Öğrenci ara..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-indigo-100 outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="grid gap-4">
        {filteredStudents.map(student => (
          <div 
            key={student.id} 
            onClick={() => handleStudentClick(student)}
            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-50 flex items-center justify-between group cursor-pointer hover:bg-indigo-50/30 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                {student.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{student.name}</h3>
                <p className="text-sm text-slate-500">{student.hourly_rate} TL/saat</p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
                <button 
                    onClick={(e) => openEdit(e, student)}
                    className="p-2 rounded-full bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 transition-colors"
                >
                    <Edit2 size={18} />
                </button>
                <ChevronRight size={20} className="text-slate-300" />
            </div>
          </div>
        ))}
        
        {filteredStudents.length === 0 && (
            <div className="text-center py-10 text-slate-400">
                <p>Öğrenci bulunamadı.</p>
            </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal 
        isOpen={isFormModalOpen} 
        onClose={() => setIsFormModalOpen(false)}
        title={selectedStudent ? "Öğrenci Düzenle" : "Yeni Öğrenci Ekle"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input 
            label="Ad Soyad" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})}
            required
          />
          <Input 
            label="Saatlik Ücret (TL)" 
            type="number" 
            value={formData.hourly_rate} 
            onChange={e => setFormData({...formData, hourly_rate: Number(e.target.value)})}
            required
          />
          <Input 
            label="Telefon Numarası" 
            type="tel"
            value={formData.phone} 
            onChange={e => setFormData({...formData, phone: e.target.value})}
          />
          
          <div className="p-4 bg-indigo-50 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Giriş Bilgileri</h4>
            <Input 
                label="Kullanıcı Adı" 
                value={formData.username || ''} 
                onChange={e => setFormData({...formData, username: e.target.value})}
                placeholder="Örn: ahmet123"
            />
             <Input 
                label="Şifre" 
                value={formData.password || ''} 
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder="Örn: 123456"
            />
          </div>

          <div className="flex flex-col gap-1 w-full">
            <label className="text-sm font-semibold text-slate-600 ml-1">Notlar</label>
            <textarea 
                className="w-full rounded-xl border-2 border-slate-100 bg-white px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-indigo-200 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 transition-all resize-none"
                rows={3}
                value={formData.notes || ''} 
                onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>
          <div className="pt-2">
            <Button type="submit" fullWidth>{selectedStudent ? "Değişiklikleri Kaydet" : "Öğrenciyi Oluştur"}</Button>
          </div>
        </form>
      </Modal>

      {/* Stats Modal */}
      <Modal 
        isOpen={isStatsModalOpen} 
        onClose={() => setIsStatsModalOpen(false)}
        title={selectedStudent?.name || "Öğrenci Detayı"}
      >
        <div className="space-y-6">
            <div className="flex justify-center">
                 <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-bold text-3xl">
                    {selectedStudent?.name.charAt(0)}
                </div>
            </div>

            {selectedStudent?.username && (
                <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-center gap-2 text-sm text-slate-500">
                    <User size={14} />
                    <span>Kullanıcı Adı: <strong>{selectedStudent.username}</strong></span>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50 p-4 rounded-2xl flex flex-col items-center">
                    <span className="text-3xl font-bold text-indigo-600">{studentStats.completed}</span>
                    <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wide">Yapılan Ders</span>
                </div>
                <div className="bg-amber-50 p-4 rounded-2xl flex flex-col items-center">
                    <span className="text-3xl font-bold text-amber-600">{studentStats.planned}</span>
                    <span className="text-xs text-amber-400 font-semibold uppercase tracking-wide">Planlanan</span>
                </div>
            </div>

            <div className="space-y-3">
                <h4 className="font-bold text-slate-700 flex items-center gap-2">
                    <BarChart3 size={18} />
                    Finansal Durum
                </h4>
                <div className="bg-emerald-50 p-4 rounded-xl flex justify-between items-center">
                    <span className="text-emerald-700 font-medium">Toplam Tahsilat</span>
                    <span className="text-emerald-700 font-bold text-lg">{studentStats.totalPaid.toLocaleString()} TL</span>
                </div>
                <div className="bg-rose-50 p-4 rounded-xl flex justify-between items-center">
                    <span className="text-rose-700 font-medium">Bekleyen Alacak</span>
                    <span className="text-rose-700 font-bold text-lg">{studentStats.totalDebt.toLocaleString()} TL</span>
                </div>
            </div>

            <div className="flex gap-2">
                {selectedStudent?.phone && (
                     <a href={`tel:${selectedStudent.phone}`} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200">
                        <Phone size={18} />
                        Ara
                    </a>
                )}
                 <button onClick={() => setIsStatsModalOpen(false)} className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-700">
                    Kapat
                </button>
            </div>
        </div>
      </Modal>
    </div>
  );
};