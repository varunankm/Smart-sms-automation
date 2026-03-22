import React, { useState } from 'react';
import axios from 'axios';
import { User, Lock, Mail, Building, Sparkles, Clock, ShieldCheck } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE ? `${import.meta.env.VITE_API_BASE}/auth` : (window.location.hostname === 'localhost' ? 'http://localhost:5000/api/auth' : '/api/auth');

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', department: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/login' : '/register';
      const res = await axios.post(`${API_BASE}${endpoint}`, formData);
      onLogin(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="auth-wrapper container">
      <div className="auth-hero">
        <h1>Smart SMS Sending System</h1>
        <p>
          Effortlessly communicate with students and parents. Upload your Excel data, 
          and our advanced system handles automated message delivery instantly.
        </p>
        <div className="auth-features">
          <div className="feature-item">
            <div className="feature-icon"><Sparkles size={24} /></div>
            <span><strong>Smart Parsing:</strong> Automatically detects headers and formats phone numbers from any Excel file.</span>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><Clock size={24} /></div>
            <span><strong>Time-Saving:</strong> Send bulk SMS to hundreds of students in minutes, keeping everyone informed easily.</span>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><ShieldCheck size={24} /></div>
            <span><strong>Reliable Tracking:</strong> Track the delivery status of each message in real-time with detailed status reports.</span>
          </div>
        </div>
      </div>

      <div className="auth-card glass-panel">
        <div className="auth-header">
          <h2>{isLogin ? 'Faculty Login' : 'Faculty Registration'}</h2>
          <p className="text-muted">
            {isLogin 
              ? 'Welcome back! Please login to continue.' 
              : 'Create your account with basic data to get started.'}
          </p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              <div className="input-group">
                <User size={18} className="input-icon" />
                <input 
                  type="text" 
                  name="name" 
                  placeholder="Full Name" 
                  required 
                  value={formData.name} 
                  onChange={handleChange} 
                />
              </div>
              <div className="input-group">
                <Building size={18} className="input-icon" />
                <input 
                  type="text" 
                  name="department" 
                  placeholder="Department" 
                  value={formData.department} 
                  onChange={handleChange} 
                />
              </div>
            </>
          )}
          
          <div className="input-group">
            <Mail size={18} className="input-icon" />
            <input 
              type="email" 
              name="email" 
              placeholder="Email Address" 
              required 
              value={formData.email} 
              onChange={handleChange} 
            />
          </div>
          
          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input 
              type="password" 
              name="password" 
              placeholder="Password" 
              required 
              value={formData.password} 
              onChange={handleChange} 
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Please wait...' : (isLogin ? 'Login to Dashboard' : 'Complete Registration')}
          </button>
        </form>
        
        <div className="auth-toggle">
          {isLogin ? (
            <p>New faculty member? <button type="button" className="text-btn" onClick={() => setIsLogin(false)}>Register here</button></p>
          ) : (
            <p>Already registered? <button type="button" className="text-btn" onClick={() => setIsLogin(true)}>Login easily here</button></p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Auth;
