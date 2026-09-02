import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/auth/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import Courses from './pages/shared/Courses';
import TrainingEvents from './pages/shared/TrainingEvents';
import StudyMaterial from './pages/shared/StudyMaterial';
import Settings from './pages/shared/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        
        {/* Student Routes */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />

        {/* Common Modules */}
        <Route path="/courses" element={<Courses />} />
        <Route path="/events" element={<TrainingEvents />} />
        <Route path="/study-material" element={<StudyMaterial />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;