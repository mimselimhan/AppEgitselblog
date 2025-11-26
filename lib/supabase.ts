import { createClient } from '@supabase/supabase-js';

// Helper to safely access environment variables
const getEnvVar = (key: string) => {
  // Check import.meta.env (Vite standard)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  // Check process.env (Legacy/Node)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

// Configured with the credentials provided
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || 'https://gunewgndosarpazblhzh.supabase.co';
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1bmV3Z25kb3NhcnBhemJsaHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjUxMDEsImV4cCI6MjA3OTc0MTEwMX0.SXcXukHDE0Rm43GN8hY9utfzRlcjSrPZrWE9BH2i57k';

export const supabase = createClient(supabaseUrl, supabaseKey);