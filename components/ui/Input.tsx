import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-sm font-semibold text-slate-600 ml-1">{label}</label>}
      <input 
        className={`w-full rounded-xl border-2 border-slate-100 bg-white px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-indigo-200 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 transition-all ${className}`} 
        {...props} 
      />
    </div>
  );
};