import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import VisualizerPage from './pages/VisualizerPage';
import CodeVisualizerPage from './pages/CodeVisualizerPage';
import Profile from './pages/Profile';
import Quiz from './pages/Quiz';
import Login from './pages/Login';
import BookReader from './pages/BookReader'; // New Import

import './App.css';

function App() {
  // Persistent session logic
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [user]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 960) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) {
    return (
      <AnimatePresence>
        <Login onLogin={setUser} />
      </AnimatePresence>
    );
  }

  return (
    <Router>
      <div className="app">
        <Sidebar
          user={user}
          setUser={setUser}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen((prev) => !prev)}
          onClose={() => setIsSidebarOpen(false)}
        />
        <div className="main-content with-sidebar">
          <AnimatePresence mode='wait'>
            <Routes>
              <Route path="/dashboard" element={<Dashboard user={user} />} />
              <Route path="/visualizer/:type" element={<VisualizerPage />} />
              <Route path="/code-visualizer" element={<CodeVisualizerPage />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
              <Route path="/reader/:type" element={<BookReader />} />
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </AnimatePresence>
        </div>
      </div>
    </Router>
  );
}

export default App;