export interface Student {
  id: string;
  name: string;
  phone: string;
  hourly_rate: number;
  notes: string;
  username?: string;
  password?: string;
  created_at?: string;
}

export interface Lesson {
  id: string;
  student_id: string;
  start_time: string; // ISO string
  end_time: string;   // ISO string
  is_paid: boolean;
  topic_notes: string;
  created_at?: string;
  // Joins
  students?: Student; 
}

export interface Settings {
  id: number;
  password_pin: string;
  tutor_name?: string;
  tutor_title?: string;
  profile_image_url?: string;
}

export type ViewState = 'dashboard' | 'schedule' | 'students' | 'profile' | 'finance';

export type UserRole = 'tutor' | 'student';