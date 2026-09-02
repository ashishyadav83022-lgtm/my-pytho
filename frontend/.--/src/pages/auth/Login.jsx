import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const handleLogin = async (email, password) => {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
    
    // Save Token & Role
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('role', res.data.role);

    // Redirect Based on Role
    if (res.data.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/student/dashboard');
    }
  } catch (err) {
    console.error('Login Failed', err);
  }
};