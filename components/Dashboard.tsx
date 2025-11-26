import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lesson } from '../types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { DollarSign, BookOpen, UserPlus, Calendar as CalendarIcon } from 'lucide-react';

interface DashboardProps {
  onNavigate: (view: 'dashboard' | 'schedule' | 'students' | 'profile' | 'finance') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    todayLessons: 0,
    unpaidAmount: 0,
    nextLesson: null as Lesson | null
  });
  const [profile, setProfile] = useState({ name: 'Öğretmen', image: '' });

  useEffect(() => {
    fetchStats();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data } = await supabase.from('settings').select('tutor_name, profile_image_url').single();
    if (data) {
      setProfile({
        name: data.tutor_name || 'Öğretmen',
        image: data.profile_image_url || ''
      });
    }
  };

  const fetchStats = async () => {
    // 1. Bugünün Dersleri
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const todayEnd = new Date();
    todayEnd.setHours(23,59,59,999);

    const { data: todaysLessons } = await supabase
      .from('lessons')
      .select('*, students(name)')
      .gte('start_time', todayStart.toISOString())
      .lte('start_time', todayEnd.toISOString());

    // 2. Ödenmemiş Bakiye
    const { data: unpaidLessons } = await supabase
      .from('lessons')
      .select('*, students(hourly_rate)')
      .eq('is_paid', false);

    let totalUnpaid = 0;
    if (unpaidLessons) {
      unpaidLessons.forEach((l: any) => {
        const start = new Date(l.start_time).getTime();
        const end = new Date(l.end_time).getTime();
        const hours = (end - start) / (1000 * 60 * 60);
        totalUnpaid += hours * (l.students?.hourly_rate || 0);
      });
    }

    // 3. Sıradaki Ders
    const now = new Date().toISOString();
    const { data: nextLessonData } = await supabase
        .from('lessons')
        .select('*, students(name)')
        .gte('start_time', now)
        .order('start_time', { ascending: true })
        .limit(1)
        .single();

    setStats({
      todayLessons: todaysLessons?.length || 0,
      unpaidAmount: totalUnpaid,
      nextLesson: nextLessonData
    });
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Merhaba, {profile.name}</h2>
          <p className="text-slate-500">İşte bugünkü durumun</p>
        </div>
        <div 
          onClick={() => onNavigate('profile')}
          className="h-14 w-14 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl cursor-pointer bg-indigo-100 hover:ring-4 hover:ring-indigo-50 transition-all overflow-hidden"
        >
            {profile.image ? (
                <img src={profile.image} alt="Profile" className="h-full w-full object-cover" />
            ) : (
                profile.name.charAt(0).toUpperCase()
            )}
        </div>
      </header>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-50 flex flex-col gap-2">
          <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500">
            <BookOpen size={20} />
          </div>
          <span className="text-slate-400 text-sm font-medium">Bugünkü Dersler</span>
          <span className="text-3xl font-bold text-slate-800">{stats.todayLessons}</span>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-50 flex flex-col gap-2">
          <div className="h-10 w-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
            <DollarSign size={20} />
          </div>
          <span className="text-slate-400 text-sm font-medium">Alacaklar</span>
          <span className="text-3xl font-bold text-slate-800">{stats.unpaidAmount.toLocaleString()} TL</span>
        </div>
      </div>

      {/* Next Lesson Card */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">Sıradaki Ders</span>
            <h3 className="text-2xl font-bold mt-2">{stats.nextLesson?.students?.name || "Planlanmış ders yok"}</h3>
          </div>
          <CalendarIcon className="opacity-80" />
        </div>
        {stats.nextLesson && (
             <div className="flex gap-4 text-indigo-100 text-sm font-medium">
                <span className="capitalize">{format(new Date(stats.nextLesson.start_time), 'EEEE, HH:mm', { locale: tr })}</span>
                <span>•</span>
                <span>{format(new Date(stats.nextLesson.start_time), 'd MMM', { locale: tr })}</span>
            </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Hızlı İşlemler</h3>
        <div className="grid grid-cols-2 gap-4">
            <button 
                onClick={() => onNavigate('schedule')}
                className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-indigo-50 transition-colors text-left"
            >
                <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                    <CalendarIcon size={20} />
                </div>
                <span className="font-semibold text-slate-700">Ders Ekle</span>
            </button>
            <button 
                onClick={() => onNavigate('students')}
                className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-indigo-50 transition-colors text-left"
            >
                <div className="h-10 w-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                    <UserPlus size={20} />
                </div>
                <span className="font-semibold text-slate-700">Öğrenci Ekle</span>
            </button>
        </div>
      </div>
    </div>
  );
};