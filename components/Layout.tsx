import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, Calendar, Users, UserCog, History } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate }) => {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Ana Sayfa' },
    { id: 'schedule', icon: Calendar, label: 'Program' },
    { id: 'finance', icon: History, label: 'Geçmiş' },
    { id: 'students', icon: Users, label: 'Öğrenciler' },
    { id: 'profile', icon: UserCog, label: 'Profil' },
  ] as const;

  return (
    <div className="min-h-screen bg-orange-50 max-w-md mx-auto relative shadow-2xl overflow-hidden flex flex-col">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto scrollbar-hide p-6">
            {children}
        </main>

        {/* Bottom Navigation for Mobile */}
        <nav className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-2 flex justify-between items-center z-40">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id as ViewState)}
                        className={`flex flex-col items-center justify-center w-full py-2 rounded-xl transition-all duration-300 ${isActive ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className="mb-1" />
                        <span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
                            {item.label}
                        </span>
                    </button>
                )
            })}
        </nav>
    </div>
  );
};