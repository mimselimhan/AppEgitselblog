import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lesson } from '../types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { DollarSign, TrendingUp, CheckCircle2, Clock, CalendarDays } from 'lucide-react';
import { Button } from './ui/Button';

export const Finance: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalReceivables: 0,
    paidCount: 0,
    unpaidCount: 0
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    // Fetch only past lessons
    const now = new Date().toISOString();
    
    const { data } = await supabase
      .from('lessons')
      .select('*, students(name, hourly_rate)')
      .lt('start_time', now) // Only past lessons
      .order('start_time', { ascending: false });

    if (data) {
        setLessons(data);
        calculateStats(data);
    }
    setLoading(false);
  };

  const calculateStats = (data: any[]) => {
    let earned = 0;
    let pending = 0;
    let paid = 0;
    let unpaid = 0;

    data.forEach(l => {
        const start = new Date(l.start_time).getTime();
        const end = new Date(l.end_time).getTime();
        const durationHours = (end - start) / (1000 * 60 * 60);
        const amount = durationHours * (l.students?.hourly_rate || 0);

        if (l.is_paid) {
            earned += amount;
            paid++;
        } else {
            pending += amount;
            unpaid++;
        }
    });

    setStats({
        totalEarnings: earned,
        totalReceivables: pending,
        paidCount: paid,
        unpaidCount: unpaid
    });
  };

  const togglePayment = async (lessonId: string, currentStatus: boolean) => {
    const { error } = await supabase.from('lessons').update({ is_paid: !currentStatus }).eq('id', lessonId);
    if (!error) {
        fetchHistory(); // Refresh
    }
  };

  return (
    <div className="pb-24 space-y-6">
      <h2 className="text-3xl font-bold text-slate-800">Geçmiş & Finans</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-5 rounded-3xl shadow-lg text-white flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <DollarSign size={20} />
            <span className="text-sm font-semibold">Toplam Tahsilat</span>
          </div>
          <span className="text-2xl font-bold">{stats.totalEarnings.toLocaleString()} TL</span>
          <span className="text-xs opacity-75">{stats.paidCount} ders ödendi</span>
        </div>

        <div className="bg-gradient-to-br from-rose-400 to-rose-600 p-5 rounded-3xl shadow-lg text-white flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <TrendingUp size={20} />
            <span className="text-sm font-semibold">Bekleyen</span>
          </div>
          <span className="text-2xl font-bold">{stats.totalReceivables.toLocaleString()} TL</span>
          <span className="text-xs opacity-75">{stats.unpaidCount} ders ödeme bekliyor</span>
        </div>
      </div>

      {/* List */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CalendarDays size={20} className="text-slate-400" />
            Tamamlanan Dersler
        </h3>
        
        <div className="space-y-3">
            {loading ? (
                <div className="text-center py-8 text-slate-400">Yükleniyor...</div>
            ) : lessons.length === 0 ? (
                <div className="text-center py-8 text-slate-400">Henüz tamamlanmış ders yok.</div>
            ) : (
                lessons.map(lesson => {
                    const start = new Date(lesson.start_time);
                    const end = new Date(lesson.end_time);
                    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                    const amount = duration * (lesson.students?.hourly_rate || 0);

                    return (
                        <div key={lesson.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-800">{lesson.students?.name}</span>
                                <span className="text-xs text-slate-500">
                                    {format(start, 'd MMM yyyy, HH:mm', { locale: tr })}
                                </span>
                                <span className="text-xs font-semibold text-indigo-400 mt-1">
                                    {amount.toLocaleString()} TL
                                </span>
                            </div>

                            <button
                                onClick={() => togglePayment(lesson.id, lesson.is_paid)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                                    lesson.is_paid 
                                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                                    : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                }`}
                            >
                                {lesson.is_paid ? (
                                    <>
                                        <CheckCircle2 size={16} />
                                        <span>Ödendi</span>
                                    </>
                                ) : (
                                    <>
                                        <Clock size={16} />
                                        <span>Alacak</span>
                                    </>
                                )}
                            </button>
                        </div>
                    );
                })
            )}
        </div>
      </div>
    </div>
  );
};