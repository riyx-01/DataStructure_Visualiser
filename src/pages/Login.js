import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import './Login.css';

const Login = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Get stored users
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');

    setTimeout(() => {
      if (isSignUp) {
        // Sign Up Flow
        if (users.find(u => u.email === email)) {
          setError('User already exists with this email.');
          setIsLoading(false);
          return;
        }
        const newUser = { name, email, avatar: name[0].toUpperCase() };
        users.push({ ...newUser, authPassword: password });
        localStorage.setItem('registeredUsers', JSON.stringify(users));
        onLogin(newUser);
      } else {
        // Login Flow
        const user = users.find(u => u.email === email && u.authPassword === password);
        if (user || (email === 'riya@gmail.com' && password === '12345')) {
          onLogin(user || { name: 'Riya Vinod Thakur', email: 'riya@gmail.com', avatar: 'R' });
        } else {
          setError('Invalid email or password.');
        }
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="login-card"
      >
        <div className="login-header">
          <div className="login-logo">
            <Database size={32} color="#10b981" />
          </div>
          <h1>{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
          <p>{isSignUp ? 'Start your learning journey today' : 'Sign in to continue learning'}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {isSignUp && (
            <div className="input-group">
              <label htmlFor="full-name">Full Name</label>
              <div className="input-wrapper">
                <input
                  id="full-name"
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-label="Full name"
                  required
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail size={20} className="input-icon" />
              <input
                id="email"
                type="email"
                placeholder="riya@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email address"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock size={20} className="input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-label="Password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && <div className="login-error-msg">{error}</div>}

          <button
            type="submit"
            className={`login-btn ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button onClick={() => setIsSignUp(!isSignUp)} className="toggle-auth">
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;