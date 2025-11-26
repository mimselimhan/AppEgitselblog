import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Student, Lesson } from '../types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { LogOut, Calendar, CheckCircle2, Clock, Wallet } from 'lucide-react';

interface StudentDashboardProps {
  student: Student;
  onLogout: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ student, onLogout }) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [stats, setStats] = useState({
    debt: 0,
    upcomingCount: 0
  });

  useEffect(() => {
    fetchData();
  }, [student.id]);

  const fetchData = async () => {
    // Fetch lessons for this student
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('student_id', student.id)
      .order('start_time', { ascending: false }); // Newest first

    if (data) {
        setLessons(data);
        calculateStats(data);
    }
  };

  const calculateStats = (data: Lesson[]) => {
    const now = new Date();
    let debt = 0;
    let upcoming = 0;

    data.forEach(l => {
        const start = new Date(l.start_time);
        
        if (start > now) {
            upcoming++;
        } else {
            // Past lesson
            if (!l.is_paid) {
                const end = new Date(l.end_time);
                const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                debt += hours * student.hourly_rate;
            }
        }
    });

    setStats({ debt, upcomingCount: upcoming });
  };

  const upcomingLessons = lessons.filter(l => new Date(l.start_time) > new Date()).reverse(); // Closest future first
  const pastLessons = lessons.filter(l => new Date(l.start_time) <= new Date());

  return (
    <div className="min-h-screen bg-orange-50 max-w-md mx-auto relative shadow-2xl p-6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Merhaba, {student.name.split(' ')[0]}</h1>
                <p className="text-slate-500 text-sm">Öğrenci Paneli</p>
            </div>
            <button 
                onClick={onLogout}
                className="p-2 bg-rose-50 text-rose-500 rounded-full hover:bg-rose-100"
            >
                <LogOut size={20} />
            </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-indigo-600 text-white p-5 rounded-3xl shadow-lg shadow-indigo-200">
                <div className="flex items-center gap-2 mb-2 opacity-80">
                    <Calendar size={18} />
                    <span className="text-xs font-bold uppercase">Gelecek Ders</span>
                </div>
                <span className="text-3xl font-bold">{stats.upcomingCount}</span>
            </div>
            <div className="bg-white text-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-2 text-rose-500">
                    <Wallet size={18} />
                    <span className="text-xs font-bold uppercase">Borç Durumu</span>
                </div>
                <span className="text-2xl font-bold">{stats.debt > 0 ? `${stats.debt} TL` : '0 TL'}</span>
            </div>
        </div>

        {/* Upcoming Lessons */}
        <h3 className="font-bold text-slate-800 mb-3 ml-1">Planlanan Dersler</h3>
        <div className="space-y-3 mb-8">
            {upcomingLessons.length === 0 ? (
                <p className="text-slate-400 text-sm italic ml-1">Planlanmış dersin yok.</p>
            ) : (
                upcomingLessons.map(l => (
                    <div key={l.id} className="bg-white p-4 rounded-2xl border-l-4 border-indigo-400 shadow-sm flex justify-between items-center">
                        <div>
                            <p className="font-bold text-slate-700">{format(new Date(l.start_time), 'EEEE', { locale: tr })}</p>
                            <p className="text-sm text-slate-500">{format(new Date(l.start_time), 'd MMMM yyyy, HH:mm', { locale: tr })}</p>
                        </div>
                        {l.topic_notes && (
                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-md max-w-[100px] truncate">
                                {l.topic_notes}
                            </span>
                        )}
                    </div>
                ))
            )}
        </div>

        {/* Past Lessons */}
        <h3 className="font-bold text-slate-800 mb-3 ml-1">Ders Geçmişi</h3>
        <div className="space-y-3 flex-1 overflow-y-auto pb-4">
             {pastLessons.length === 0 ? (
                <p className="text-slate-400 text-sm italic ml-1">Geçmiş ders bulunamadı.</p>
            ) : (
                pastLessons.map(l => (
                    <div key={l.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 flex justify-between items-center opacity-80 hover:opacity-100 transition-opacity">
                        <div>
                            <p className="font-semibold text-slate-700">{format(new Date(l.start_time), 'd MMM yyyy', { locale: tr })}</p>
                            <p className="text-xs text-slate-400">{format(new Date(l.start_time), 'HH:mm', { locale: tr })}</p>
                        </div>
                        <div className="flex items-center gap-2">
                             {l.is_paid ? (
                                <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                    <CheckCircle2 size={14} />
                                    Ödendi
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-rose-500 text-xs font-bold bg-rose-50 px-2 py-1 rounded-lg">
                                    <Clock size={14} />
                                    Ödenmedi
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
  );
};