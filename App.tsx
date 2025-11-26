import React, { useState } from 'react';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Schedule } from './components/Schedule';
import { Students } from './components/Students';
import { Profile } from './components/Profile';
import { Finance } from './components/Finance';
import { StudentDashboard } from './components/StudentDashboard';
import { ViewState, UserRole, Student } from './types';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<UserRole>('tutor');
  const [loggedInStudent, setLoggedInStudent] = useState<Student | undefined>(undefined);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');

  const handleLoginSuccess = (userRole: UserRole, studentData?: Student) => {
    setRole(userRole);
    if (userRole === 'student' && studentData) {
      setLoggedInStudent(studentData);
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setRole('tutor');
    setLoggedInStudent(undefined);
    setCurrentView('dashboard');
  };

  if (!isAuthenticated) {
    return <Login onSuccess={handleLoginSuccess} />;
  }

  // If Student
  if (role === 'student' && loggedInStudent) {
    return <StudentDashboard student={loggedInStudent} onLogout={handleLogout} />;
  }

  // If Tutor
  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      {currentView === 'dashboard' && <Dashboard onNavigate={setCurrentView} />}
      {currentView === 'schedule' && <Schedule />}
      {currentView === 'finance' && <Finance />}
      {currentView === 'students' && <Students />}
      {currentView === 'profile' && <Profile onLogout={handleLogout} />}
    </Layout>
  );
}

export default App;