import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import axios from 'axios';
import './App.css';

// Components
import Landing from './components/Landing';
import Auth from './components/Auth';
import Feed from './components/Feed';
import Profile from './components/Profile';
import Messages from './components/Messages';
import Stories from './components/Stories';
import Reels from './components/Reels';
import Groups from './components/Groups';
import Marketplace from './components/Marketplace';
import Events from './components/Events';
import Jobs from './components/Jobs';
import Notifications from './components/Notifications';
import Search from './components/Search';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API
});

// Add token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.params = { ...config.params, authorization: token };
  }
  return config;
});

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Handle session_id from Google OAuth
    const hash = window.location.hash;
    if (hash.includes('session_id=')) {
      const sessionId = hash.split('session_id=')[1].split('&')[0];
      handleGoogleCallback(sessionId);
      window.location.hash = '';
    }
  }, []);

  const handleGoogleCallback = async (sessionId) => {
    try {
      const formData = new FormData();
      formData.append('session_id', sessionId);
      
      const response = await axios.post(`${API}/auth/google/callback`, formData);
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        toast.success('Welcome to Social X!');
      }
    } catch (error) {
      toast.error('Authentication failed');
    }
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data.user);
        connectWebSocket(response.data.user.id);
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  const connectWebSocket = (userId) => {
    const wsUrl = `${BACKEND_URL.replace('https', 'wss').replace('http', 'ws')}/ws/${userId}`;
    const socket = new WebSocket(wsUrl);
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'notification') {
        toast.info(data.data.content);
      } else if (data.type === 'message') {
        toast('New message received');
      }
    };
    
    setWs(socket);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    if (ws) {
      ws.close();
    }
    toast.success('Logged out successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="App">
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/" element={user ? <Navigate to="/feed" /> : <Landing />} />
          <Route path="/auth" element={user ? <Navigate to="/feed" /> : <Auth setUser={setUser} />} />
          <Route path="/feed" element={user ? <Feed user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/profile/:userId" element={user ? <Profile currentUser={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/messages" element={user ? <Messages user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/stories" element={user ? <Stories user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/reels" element={user ? <Reels user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/groups" element={user ? <Groups user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/marketplace" element={user ? <Marketplace user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/events" element={user ? <Events user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/jobs" element={user ? <Jobs user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/notifications" element={user ? <Notifications user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/search" element={user ? <Search user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
export { api, API, BACKEND_URL };
