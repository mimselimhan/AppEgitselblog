import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lesson, Student } from '../types';
import { 
    startOfWeek, addDays, format, isSameDay, getDay, parseISO, 
    startOfMonth, endOfMonth, endOfWeek, eachDayOfInterval, isSameMonth, addMonths 
} from 'date-fns';
import { tr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, Plus, LayoutGrid, Calendar } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export const Schedule: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week'); // New View Mode State
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  
  // New Lesson Form
  const [formData, setFormData] = useState({
    student_id: '',
    date: '',
    start_time: '10:00',
    duration: '60', // minutes
    notes: ''
  });

  // Calendar Calculation Helpers
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  useEffect(() => {
    fetchLessons();
    fetchStudents();
  }, [currentDate, viewMode]);

  const fetchLessons = async () => {
    let start, end;
    
    if (viewMode === 'week') {
        start = weekStart.toISOString();
        end = addDays(weekStart, 7).toISOString();
    } else {
        start = calendarStart.toISOString();
        end = calendarEnd.toISOString();
    }
    
    const { data } = await supabase
      .from('lessons')
      .select('*, students(name)')
      .gte('start_time', start)
      .lt('start_time', end);
      
    if (data) setLessons(data);
  };

  const fetchStudents = async () => {
    const { data } = await supabase.from('students').select('*').order('name');
    if (data) setStudents(data);
  };

  const handlePrev = () => {
    if (viewMode === 'week') setCurrentDate(addDays(currentDate, -7));
    else setCurrentDate(addMonths(currentDate, -1));
  };

  const handleNext = () => {
    if (viewMode === 'week') setCurrentDate(addDays(currentDate, 7));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const handleSlotClick = (day: Date) => {
    setFormData({
      student_id: students[0]?.id || '',
      date: format(day, 'yyyy-MM-dd'),
      start_time: '12:00',
      duration: '60',
      notes: ''
    });
    setSelectedLesson(null);
    setIsModalOpen(true);
  };

  const handleLessonClick = (lesson: Lesson, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLesson(lesson);
    
    const start = new Date(lesson.start_time);
    const end = new Date(lesson.end_time);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60);

    setFormData({
      student_id: lesson.student_id,
      date: format(start, 'yyyy-MM-dd'),
      start_time: format(start, 'HH:mm'),
      duration: duration.toString(),
      notes: lesson.topic_notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const startDateTime = new Date(`${formData.date}T${formData.start_time}`);
    const endDateTime = new Date(startDateTime.getTime() + Number(formData.duration) * 60000);

    const payload = {
      student_id: formData.student_id,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      topic_notes: formData.notes
    };

    if (selectedLesson) {
      await supabase.from('lessons').update(payload).eq('id', selectedLesson.id);
    } else {
      await supabase.from('lessons').insert([payload]);
    }
    
    setIsModalOpen(false);
    fetchLessons();
  };

  const togglePaidStatus = async () => {
    if (!selectedLesson) return;
    const newStatus = !selectedLesson.is_paid;
    await supabase.from('lessons').update({ is_paid: newStatus }).eq('id', selectedLesson.id);
    setSelectedLesson({ ...selectedLesson, is_paid: newStatus });
    fetchLessons(); 
  };

  const deleteLesson = async () => {
    if (!selectedLesson) return;
    if (confirm("Bu dersi silmek istediğinize emin misiniz?")) {
        await supabase.from('lessons').delete().eq('id', selectedLesson.id);
        setIsModalOpen(false);
        fetchLessons();
    }
  }

  // Render Helpers
  const renderLessonCard = (lesson: Lesson) => (
    <div 
        key={lesson.id}
        onClick={(e) => handleLessonClick(lesson, e)}
        className={`p-3 rounded-xl cursor-pointer transition-all active:scale-95 border-l-4 mb-2 shadow-sm ${lesson.is_paid ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50 border-rose-300'}`}
    >
        <div className="flex justify-between items-start">
            <div>
                <h4 className="font-bold text-slate-800 text-sm">{lesson.students?.name}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-medium">
                    <span>{format(new Date(lesson.start_time), 'HH:mm')}</span>
                    <span>-</span>
                    <span>{format(new Date(lesson.end_time), 'HH:mm')}</span>
                </div>
            </div>
            {lesson.is_paid ? (
                <CheckCircle2 size={16} className="text-emerald-500" />
            ) : (
                <Clock size={16} className="text-rose-400" />
            )}
        </div>
    </div>
  );

  return (
    <div className="pb-24 flex flex-col h-full">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Ders Programı</h2>
            
            {/* View Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                    onClick={() => setViewMode('week')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'week' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                >
                    <LayoutGrid size={20} />
                </button>
                <button 
                    onClick={() => setViewMode('month')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'month' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                >
                    <Calendar size={20} />
                </button>
            </div>
          </div>

          <div className="flex items-center justify-between bg-white rounded-2xl p-2 shadow-sm border border-slate-100">
            <button onClick={handlePrev} className="p-2 hover:bg-slate-50 rounded-xl text-slate-600">
                <ChevronLeft size={24} />
            </button>
            <span className="text-base font-bold text-slate-700 capitalize">
                {viewMode === 'week' 
                    ? `${format(weekStart, 'MMM d')} - ${format(addDays(weekStart, 6), 'MMM d', { locale: tr })}`
                    : format(currentDate, 'MMMM yyyy', { locale: tr })
                }
            </span>
            <button onClick={handleNext} className="p-2 hover:bg-slate-50 rounded-xl text-slate-600">
                <ChevronRight size={24} />
            </button>
        </div>
      </div>

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="flex-1 overflow-y-auto space-y-4">
            {weekDays.map(day => {
            const dayLessons = lessons.filter(l => isSameDay(new Date(l.start_time), day))
                                        .sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
            const isTodayDate = isSameDay(day, new Date());

            return (
                <div key={day.toString()} className={`rounded-3xl p-4 ${isTodayDate ? 'bg-indigo-50/50 ring-2 ring-indigo-100' : 'bg-white'} border border-slate-50 shadow-sm`}>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full ${isTodayDate ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {format(day, 'd')}
                        </span>
                        <span className="font-semibold text-slate-700 capitalize">{format(day, 'EEEE', { locale: tr })}</span>
                    </div>
                    <button 
                        onClick={() => handleSlotClick(day)}
                        className="p-1.5 rounded-full bg-indigo-50 text-indigo-500 hover:bg-indigo-100"
                    >
                        <Plus size={18} />
                    </button>
                </div>

                <div className="space-y-1">
                    {dayLessons.length === 0 ? (
                        <div className="text-center py-4 text-slate-300 text-sm font-medium border-2 border-dashed border-slate-100 rounded-xl">
                            Ders Yok
                        </div>
                    ) : (
                        dayLessons.map(renderLessonCard)
                    )}
                </div>
                </div>
            );
            })}
        </div>
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="flex flex-col h-full">
            {/* Calendar Grid */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-50 mb-4">
                <div className="grid grid-cols-7 mb-2 text-center">
                    {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                        <span key={day} className="text-xs font-bold text-slate-400 py-2">{day}</span>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-y-2">
                    {monthDays.map(day => {
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const isTodayDate = isSameDay(day, new Date());
                        const dayLessons = lessons.filter(l => isSameDay(new Date(l.start_time), day));
                        const hasLessons = dayLessons.length > 0;
                        const isSelected = isSameDay(day, currentDate); // Reuse currentDate as selected date for month view interaction

                        return (
                            <div 
                                key={day.toISOString()} 
                                onClick={() => setCurrentDate(day)}
                                className="flex flex-col items-center gap-1 cursor-pointer p-1"
                            >
                                <div className={`
                                    h-8 w-8 flex items-center justify-center rounded-full text-sm font-medium transition-all
                                    ${isSelected ? 'bg-indigo-600 text-white shadow-md scale-110' : ''}
                                    ${!isSelected && isTodayDate ? 'bg-indigo-100 text-indigo-700' : ''}
                                    ${!isSelected && !isTodayDate && !isCurrentMonth ? 'text-slate-300' : ''}
                                    ${!isSelected && !isTodayDate && isCurrentMonth ? 'text-slate-700 hover:bg-slate-50' : ''}
                                `}>
                                    {format(day, 'd')}
                                </div>
                                {/* Dots indicator */}
                                <div className="flex gap-0.5 h-1.5">
                                    {hasLessons && (
                                        <div className={`h-1.5 w-1.5 rounded-full ${dayLessons.some(l => !l.is_paid) ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                                    )}
                                    {dayLessons.length > 1 && (
                                        <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Selected Day Agenda */}
            <div className="flex-1 bg-white rounded-t-3xl p-5 shadow-inner border-t border-slate-50 overflow-y-auto">
                <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 py-2">
                    <h3 className="font-bold text-slate-800 capitalize">
                        {format(currentDate, 'd MMMM EEEE', { locale: tr })}
                    </h3>
                    <button 
                        onClick={() => handleSlotClick(currentDate)}
                        className="flex items-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full"
                    >
                        <Plus size={16} />
                        Ders Ekle
                    </button>
                </div>
                
                {lessons.filter(l => isSameDay(new Date(l.start_time), currentDate)).length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                        <Calendar className="mx-auto mb-2 opacity-20" size={48} />
                        <p>Bugün için planlanmış ders yok.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {lessons
                            .filter(l => isSameDay(new Date(l.start_time), currentDate))
                            .sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                            .map(renderLessonCard)
                        }
                    </div>
                )}
            </div>
        </div>
      )}

      {/* Modal is shared between views */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedLesson ? "Dersi Düzenle" : "Yeni Ders"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 w-full">
                <label className="text-sm font-semibold text-slate-600 ml-1">Öğrenci</label>
                <select
                    className="w-full rounded-xl border-2 border-slate-100 bg-white px-4 py-3 text-slate-800 focus:border-indigo-200 focus:outline-none focus:ring-4 focus:ring-indigo-50/50"
                    value={formData.student_id}
                    onChange={e => setFormData({...formData, student_id: e.target.value})}
                    required
                >
                    <option value="" disabled>Bir öğrenci seçin</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input 
                    type="date"
                    label="Tarih"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    required
                />
                <Input 
                    type="time"
                    label="Başlangıç"
                    value={formData.start_time}
                    onChange={e => setFormData({...formData, start_time: e.target.value})}
                    required
                />
            </div>
            
            <Input 
                type="number"
                label="Süre (dakika)"
                value={formData.duration}
                onChange={e => setFormData({...formData, duration: e.target.value})}
                required
            />

            <div className="flex flex-col gap-1 w-full">
                <label className="text-sm font-semibold text-slate-600 ml-1">Konu / Notlar</label>
                <textarea 
                    className="w-full rounded-xl border-2 border-slate-100 bg-white px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-indigo-200 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 resize-none"
                    rows={3}
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                />
            </div>

            <div className="pt-2 flex flex-col gap-3">
                <Button type="submit" fullWidth>{selectedLesson ? "Dersi Güncelle" : "Dersi Planla"}</Button>
                
                {selectedLesson && (
                    <div className="grid grid-cols-2 gap-3">
                         <Button 
                            type="button" 
                            variant={selectedLesson.is_paid ? 'danger' : 'secondary'}
                            onClick={togglePaidStatus}
                        >
                            {selectedLesson.is_paid ? 'Ödenmedi Yap' : 'Ödendi Yap'}
                        </Button>
                        <Button type="button" variant="ghost" onClick={deleteLesson}>
                            Sil
                        </Button>
                    </div>
                )}
            </div>
        </form>
      </Modal>
    </div>
  );
};