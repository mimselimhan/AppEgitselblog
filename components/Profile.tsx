import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Settings } from '../types';
import { User, Lock, Save, LogOut, Image as ImageIcon, Plus, Loader2 } from 'lucide-react';

interface ProfileProps {
    onLogout: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ onLogout }) => {
  const [profileData, setProfileData] = useState<Partial<Settings>>({
    tutor_name: '',
    tutor_title: '',
    profile_image_url: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: ''
  });

  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data } = await supabase.from('settings').select('*').single();
    if (data) {
        setProfileData({
            tutor_name: data.tutor_name || '',
            tutor_title: data.tutor_title || '',
            profile_image_url: data.profile_image_url || ''
        });
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const { data: currentSettings } = await supabase.from('settings').select('id').single();
    
    if (currentSettings) {
        const { error } = await supabase
            .from('settings')
            .update({
                tutor_name: profileData.tutor_name,
                tutor_title: profileData.tutor_title,
                profile_image_url: profileData.profile_image_url
            })
            .eq('id', currentSettings.id);

        if (error) {
            setMessage({ type: 'error', text: 'Profil güncellenirken hata oluştu.' });
        } else {
            setMessage({ type: 'success', text: 'Profil bilgileri başarıyla güncellendi!' });
        }
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
        setUploading(true);
        setMessage({ type: '', text: '' });

        if (!event.target.files || event.target.files.length === 0) {
            throw new Error('Lütfen bir resim seçin.');
        }

        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload file to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        // Get public URL
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        
        // Update local state
        setProfileData(prev => ({ ...prev, profile_image_url: data.publicUrl }));
        setMessage({ type: 'success', text: 'Resim yüklendi, kaydetmeyi unutmayın!' });

    } catch (error: any) {
        setMessage({ type: 'error', text: error.message });
    } finally {
        setUploading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwordForm.newPin.length < 4) {
        setMessage({ type: 'error', text: 'Yeni şifre en az 4 haneli olmalıdır.' });
        return;
    }

    if (passwordForm.newPin !== passwordForm.confirmPin) {
        setMessage({ type: 'error', text: 'Yeni şifreler eşleşmiyor.' });
        return;
    }

    const { data: currentSettings } = await supabase.from('settings').select('*').single();

    if (!currentSettings) return;

    if (currentSettings.password_pin !== passwordForm.currentPin) {
        setMessage({ type: 'error', text: 'Mevcut şifre yanlış.' });
        return;
    }

    const { error } = await supabase
        .from('settings')
        .update({ password_pin: passwordForm.newPin })
        .eq('id', currentSettings.id);

    if (error) {
        setMessage({ type: 'error', text: 'Şifre değiştirilemedi.' });
    } else {
        setMessage({ type: 'success', text: 'Şifreniz başarıyla değiştirildi.' });
        setPasswordForm({ currentPin: '', newPin: '', confirmPin: '' });
    }
  };

  return (
    <div className="pb-24 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-800">Profil Ayarları</h2>
        <button 
            onClick={onLogout}
            className="text-rose-600 font-semibold flex items-center gap-2 px-4 py-2 bg-rose-50 rounded-full hover:bg-rose-100 transition-colors"
        >
            <LogOut size={18} />
            Çıkış
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl text-sm font-semibold ${message.type === 'error' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {message.text}
        </div>
      )}

      {/* Profil Bilgileri */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-50">
        <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500">
                <User size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Kişisel Bilgiler</h3>
        </div>
        <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="flex justify-center mb-4">
                <div className="relative group">
                    <div className="h-28 w-28 rounded-full bg-slate-100 overflow-hidden border-4 border-slate-50 shadow-md">
                        {profileData.profile_image_url ? (
                            <img src={profileData.profile_image_url} alt="Profil" className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-400">
                                <ImageIcon size={40} />
                            </div>
                        )}
                        {uploading && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <Loader2 className="animate-spin text-white" />
                            </div>
                        )}
                    </div>
                    
                    <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 bg-indigo-500 text-white p-2 rounded-full shadow-lg hover:bg-indigo-600 transition-colors"
                    >
                        <Plus size={20} />
                    </button>
                    <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="hidden" 
                    />
                </div>
            </div>

            <Input 
                label="Adınız Soyadınız" 
                value={profileData.tutor_name} 
                onChange={e => setProfileData({...profileData, tutor_name: e.target.value})} 
            />
            <Input 
                label="Branş / Unvan" 
                value={profileData.tutor_title} 
                onChange={e => setProfileData({...profileData, tutor_title: e.target.value})} 
                placeholder="Örn: Matematik Öğretmeni"
            />
            
            <Button type="submit" fullWidth className="mt-2">
                <Save size={18} className="mr-2" />
                Bilgileri Kaydet
            </Button>
        </form>
      </div>

      {/* Şifre Değiştirme */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-50">
        <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
                <Lock size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Şifre Değiştir</h3>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input 
                label="Mevcut Şifre" 
                type="password"
                inputMode="numeric"
                value={passwordForm.currentPin} 
                onChange={e => setPasswordForm({...passwordForm, currentPin: e.target.value})} 
            />
            <Input 
                label="Yeni Şifre (Min. 4 hane)" 
                type="password"
                inputMode="numeric"
                value={passwordForm.newPin} 
                onChange={e => setPasswordForm({...passwordForm, newPin: e.target.value})} 
            />
            <Input 
                label="Yeni Şifre Tekrar" 
                type="password"
                inputMode="numeric"
                value={passwordForm.confirmPin} 
                onChange={e => setPasswordForm({...passwordForm, confirmPin: e.target.value})} 
            />
            <Button type="submit" variant="secondary" fullWidth className="mt-2">
                Şifreyi Güncelle
            </Button>
        </form>
      </div>
    </div>
  );
};