import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Delete, User, GraduationCap, Globe, Instagram, Loader2 } from 'lucide-react';
import { Student } from '../types';

interface LoginProps {
  onSuccess: (role: 'tutor' | 'student', studentData?: Student) => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'tutor' | 'student'>('tutor');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  // Tutor State
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Student State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [studentError, setStudentError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingPin, setCheckingPin] = useState(false);

  // Fetch Profile Image
  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase.from('settings').select('profile_image_url').single();
      if (data?.profile_image_url) {
        setProfileImage(data.profile_image_url);
      }
    };
    fetchProfile();
  }, []);

  // --- Tutor Logic ---
  const handlePinPress = (num: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
      setPinError(false);
    }
  };

  const handlePinDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    const checkPin = async () => {
      if (activeTab === 'tutor' && pin.length >= 4) { 
        setCheckingPin(true);
        const { data } = await supabase.from('settings').select('password_pin').single();
        setCheckingPin(false);

        const dbPin = data?.password_pin || '1234';
        
        if (pin === dbPin) {
          onSuccess('tutor');
        } else if (pin.length >= dbPin.length) {
            setPinError(true);
            setTimeout(() => setPin(''), 500);
        }
      }
    };
    checkPin();
  }, [pin, onSuccess, activeTab]);

  // --- Student Logic ---
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStudentError('');

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !data) {
        setStudentError('Kullanıcı adı veya şifre hatalı.');
      } else {
        onSuccess('student', data as Student);
      }
    } catch (err) {
      setStudentError('Giriş yapılırken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-orange-50 p-6 relative">
      <div className="bg-white p-8 rounded-3xl shadow-sm w-full max-w-sm z-10">
        
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-1">EgitselBlog</h1>
          <p className="text-slate-400 text-sm">Öğrenci Takip Sistemi</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
          <button 
            onClick={() => setActiveTab('tutor')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'tutor' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}
          >
            <User size={16} />
            Öğretmen
          </button>
          <button 
            onClick={() => setActiveTab('student')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'student' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}
          >
            <GraduationCap size={16} />
            Öğrenci
          </button>
        </div>

        {activeTab === 'tutor' ? (
          // Tutor PIN Interface
          <div className="text-center animate-fade-in">
             <div className="mb-6 flex justify-center">
                <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-indigo-50 shadow-md flex items-center justify-center bg-indigo-50">
                    {profileImage ? (
                        <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                        <User size={40} className="text-indigo-300" />
                    )}
                </div>
            </div>
            <p className="text-slate-600 font-medium mb-6">Hümeyra öğretmenim şifrenizi girer misiniz?</p>

            <div className="flex justify-center gap-4 mb-8 min-h-[20px]">
                {pin.length > 0 ? (
                    Array.from({ length: pin.length }).map((_, i) => (
                        <div 
                            key={i}
                            className={`h-4 w-4 rounded-full transition-all duration-300 ${
                                pinError ? 'bg-rose-400' : 'bg-indigo-400' 
                            }`}
                        />
                    ))
                ) : (
                    <span className="text-slate-300 text-sm">PIN Girin</span>
                )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handlePinPress(num.toString())}
                  disabled={checkingPin}
                  className="h-16 rounded-2xl bg-slate-50 text-xl font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 transition-all disabled:opacity-50"
                >
                  {num}
                </button>
              ))}
              <div />
              <button
                onClick={() => handlePinPress('0')}
                disabled={checkingPin}
                className="h-16 rounded-2xl bg-slate-50 text-xl font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 transition-all disabled:opacity-50"
              >
                0
              </button>
              <button
                onClick={handlePinDelete}
                disabled={checkingPin}
                className="h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 active:scale-95 transition-all disabled:opacity-50"
              >
                <Delete size={24} />
              </button>
            </div>
          </div>
        ) : (
          // Student Login Form
          <form onSubmit={handleStudentLogin} className="flex flex-col gap-4 animate-fade-in">
             <div className="mb-4 flex justify-center">
                <div className="h-20 w-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 border-4 border-indigo-100">
                    <GraduationCap size={40} />
                </div>
            </div>
            {studentError && (
              <div className="bg-rose-50 text-rose-600 text-sm p-3 rounded-xl text-center font-semibold">
                {studentError}
              </div>
            )}
            <div>
              <label className="text-sm font-semibold text-slate-600 ml-1">Kullanıcı Adı</label>
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-slate-800 focus:border-indigo-200 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 transition-all"
                placeholder="Örn: ahmet123"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600 ml-1">Şifre</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-slate-800 focus:border-indigo-200 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 transition-all"
                placeholder="******"
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={20} />}
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        )}
      </div>

      {/* Social Links Footer */}
      <div className="mt-8 flex flex-col items-center gap-3 w-full max-w-sm">
        <a 
          href="https://egitselblog.github.io/egitselblog/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 bg-white/60 hover:bg-white rounded-2xl text-slate-600 font-semibold transition-all border border-slate-100 shadow-sm"
        >
          <Globe size={18} className="text-indigo-500" />
          <span>Web Sitesini Ziyaret Et</span>
        </a>
        <a 
          href="https://www.instagram.com/egitselblog/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 bg-white/60 hover:bg-white rounded-2xl text-slate-600 font-semibold transition-all border border-slate-100 shadow-sm"
        >
          <Instagram size={18} className="text-pink-600" />
          <span>@egitselblog</span>
        </a>
      </div>
    </div>
  );
};