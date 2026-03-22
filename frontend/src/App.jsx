import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, Send, CheckCircle, AlertCircle, Clock, FileSpreadsheet, Download, LogOut, User } from 'lucide-react';
import Auth from './Auth';

const API_BASE = import.meta.env.VITE_API_BASE || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

function App() {
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [filter, setFilter] = useState('All');
  const [gatewayUrl, setGatewayUrl] = useState('http://192.168.1.100:8080/v1/sms/send');
  
  // Ref for polling interval
  const pollingInterval = useRef(null);

  // Poll status when sending
  useEffect(() => {
    if (isSending) {
      pollingInterval.current = setInterval(fetchStatus, 2000);
    } else {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    }
    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [isSending]);

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE}/status`);
      setData(res.data.data || []);
      
      // Auto-stop polling if data array is valid and backend reports not sending
      // but also if all pending are gone, might stop sending. We rely on backend 'isSending' flag.
      if (res.data.isSending === false && isSending) {
        setIsSending(false);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile);
    } else {
      alert('Please upload a valid Excel file (.xlsx or .xls)');
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const res = await axios.post(`${API_BASE}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setData(res.data.data);
      alert('File processed successfully! Review data before sending.');
    } catch (error) {
      console.error(error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const startSending = async () => {
    if (data.length === 0) return;
    if (!gatewayUrl) {
      alert('Please enter your Mobile SMS Gateway URL');
      return;
    }

    try {
      await axios.post(`${API_BASE}/send`, { gatewayUrl });
      setIsSending(true);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Failed to start sending.');
    }
  };

  const downloadReport = () => {
    // Basic CSV generation
    const headers = ['Name', 'RegNo', 'Phone', 'Status', 'Remarks'];
    const rows = data.map(s => [s.name, s.regNo, s.phone, s.status, s.remarks]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sms_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats
  const total = data.length;
  const sent = data.filter(d => d.status === 'Sent').length;
  const failed = data.filter(d => d.status === 'Failed').length;
  const pending = data.filter(d => d.status === 'Pending').length;
  const progressPercent = total === 0 ? 0 : Math.round(((sent + failed) / total) * 100);

  const filteredData = data.filter(d => filter === 'All' ? true : d.status === filter);

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  const handleLogout = () => {
    setUser(null);
    setData([]);
    setFile(null);
  };

  return (
    <div className="container">
      <header className="header" style={{ position: 'relative' }}>
        <button 
          onClick={handleLogout} 
          className="btn btn-outline" 
          style={{ position: 'absolute', right: 0, top: 0, padding: '0.5rem 1rem', fontSize: '0.875rem' }}
        >
          <LogOut size={16} /> Logout
        </button>
        <div style={{ position: 'absolute', left: 0, top: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
          <User size={18} />
          <span style={{ fontWeight: 500 }}>{user.name}</span>
        </div>
        <h1>Smart SMS Sending System</h1>
        <p>Automated messaging for Class Advisors</p>
      </header>

      {/* Upload Section */}
      {data.length === 0 && (
        <div className="glass-panel">
          <div className="upload-header" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--text-main)', marginBottom: '1rem' }}>Get Started with Smart SMS</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '650px', margin: '0 auto 1.5rem auto', lineHeight: '1.6' }}>
              Upload your student marks sheet to begin. To ensure all data is processed correctly, make sure your file includes proper columns for Name, Registration Number, Phone Number, and Subject Marks. Not sure where to start?
            </p>
            <a 
              href="/Student_Marks_Template.xlsx" 
              download 
              className="btn btn-outline"
            >
              <Download size={18} /> Download Example Template
            </a>
          </div>

          <div 
            className="upload-section"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
          >
            <UploadCloud className="upload-icon" />
            <h3>Drag & Drop your Excel file here</h3>
            <p className="text-muted">Supports .xlsx files with Student Data</p>
            
            <input 
              type="file" 
              id="fileInput" 
              accept=".xlsx,.xls" 
              style={{ display: 'none' }} 
              onChange={handleFileSelect}
            />
            
            <button 
              className="btn btn-primary" 
              onClick={() => document.getElementById('fileInput').click()}
            >
              Browse Files
            </button>

            {file && (
              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileSpreadsheet size={20} color="var(--primary)" />
                <span>{file.name}</span>
                <button 
                  className="btn btn-primary" 
                  style={{ marginLeft: '1rem' }} 
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Process File'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dashboard Section */}
      {data.length > 0 && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon total"><FileSpreadsheet size={24} /></div>
              <div className="stat-content">
                <h3>Total Students</h3>
                <p>{total}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon sent"><CheckCircle size={24} /></div>
              <div className="stat-content">
                <h3>Sent</h3>
                <p>{sent}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon failed"><AlertCircle size={24} /></div>
              <div className="stat-content">
                <h3>Failed</h3>
                <p>{failed}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon pending"><Clock size={24} /></div>
              <div className="stat-content">
                <h3>Pending</h3>
                <p>{pending}</p>
              </div>
            </div>
          </div>

          <div className="progress-container">
            <div className="progress-header">
              <span>Sending Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="progress-bar-bg">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="controls">
            <div className="filter-group">
              {['All', 'Pending', 'Sent', 'Failed'].map(f => (
                <button 
                  key={f} 
                  className={`filter-btn ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input 
                type="text" 
                value={gatewayUrl} 
                onChange={(e) => setGatewayUrl(e.target.value)} 
                placeholder="Mobile SMS Gateway URL (e.g. http://192.168.1.100:8080/v1/sms/send)"
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  width: '350px'
                }}
              />
              <button className="btn" style={{ border: '1px solid var(--border)', background: 'white' }} onClick={downloadReport}>
                <Download size={18} /> Report
              </button>
              
              <button 
                className="btn btn-primary" 
                onClick={startSending}
                disabled={isSending || (pending === 0 && failed === 0)}
              >
                <Send size={18} /> 
                {isSending ? 'Sending...' : (failed > 0 && pending === 0 ? 'Retry Failed' : 'Start Sending Messages')}
              </button>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Reg No</th>
                  <th>Phone</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(student => (
                  <tr key={student.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{student.name}</div>
                      {/* Optional: Add hover tooltip to see full message */}
                    </td>
                    <td>{student.regNo}</td>
                    <td>{student.phone}</td>
                    <td>
                      <span className={`status-badge status-${student.status}`}>
                        {student.status === 'Sent' && <CheckCircle size={14} />}
                        {student.status === 'Pending' && <Clock size={14} />}
                        {student.status === 'Failed' && <AlertCircle size={14} />}
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
