import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, Play, Terminal, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function AdminControls({ onReloadData, salesData }) {
  const [logs, setLogs] = useState([
    { type: 'info', text: 'System Initialized. Ingestion B-Tree indexes active.' },
    { type: 'success', text: 'Database engine running. Current records count: 500.' }
  ]);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const consoleEndRef = useRef(null);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (text, type = 'info') => {
    setLogs(prev => [...prev, { type, text: `[${new Date().toLocaleTimeString()}] ${text}` }]);
  };

  // Simulation of Database Cleaning & Ingestion Pipeline
  const runPipeline = () => {
    if (isRunningPipeline) return;
    setIsRunningPipeline(true);
    setLogs([]);
    
    setTimeout(() => addLog('Starting data scrubbing & validation pipeline...', 'info'), 200);
    setTimeout(() => addLog('Scanning directory for raw datasets... Found Day-10/Data/car_prices.csv (88.0 MB)', 'info'), 1000);
    setTimeout(() => addLog('FR1 Triggered: Filtering records for missing value placeholders ("—", "null", "nan")...', 'info'), 2200);
    setTimeout(() => addLog('Validation: Discarded 41 records with invalid numeric parameters.', 'warning'), 3500);
    setTimeout(() => addLog('FR2 Triggered: Sorting records ascending by sale date (saledate) for chronological consistency.', 'info'), 4500);
    setTimeout(() => addLog('FR3 Triggered: Truncating previous dataset and ingestion capped at exactly 500 records.', 'info'), 5500);
    setTimeout(() => addLog('FR4 Triggered: Rebuilding high-performance unique index on "vin" column...', 'info'), 6800);
    setTimeout(() => addLog('Dynamic aggregation completed for make, model, and monthly statistics.', 'info'), 7800);
    
    setTimeout(() => {
      addLog('Ingestion pipeline completed successfully! 500 clean records loaded.', 'success');
      setIsRunningPipeline(false);
      if (onReloadData) onReloadData();
    }, 8500);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadedFile(file);
    addLog(`Uploaded raw CSV file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, 'info');
    
    // Simulate parsing
    setTimeout(() => {
      addLog('Checking CSV headers... Found valid columns matching database schema.', 'info');
      addLog('Triggering manual validation routine...', 'info');
      addLog(`Auto-increment primary keys mapped for ${salesData.length} records.`, 'success');
    }, 1500);
  };

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Administrator Console</h1>
        <p className="section-desc">Manage manual dataset uploads, run ingestion jobs, and audit scrubbing logs</p>
      </div>

      <div className="grid grid-cols-2-1" style={{ marginBottom: '24px' }}>
        
        {/* Controls and upload */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Action Trigger Card */}
          <div className="card">
            <h2 className="card-title" style={{ color: '#f8fafc' }}>
              <span style={{ display: 'flex', alignContent: 'center', gap: '8px' }}>
                <ShieldCheck size={18} style={{ color: '#ef4444' }} />
                Pipeline Control Panel
              </span>
            </h2>
            <p className="section-desc" style={{ marginBottom: '20px' }}>
              Run the full data sanitization process. This script reads the raw 88.0MB csv, filters null entries, orders the timestamps chronologically, and updates the database indexing.
            </p>
            
            <button 
              className={`btn btn-danger ${isRunningPipeline ? 'btn-disabled' : ''}`}
              onClick={runPipeline}
              style={{ width: '100%' }}
            >
              <Play size={16} />
              {isRunningPipeline ? 'Running Cleaning Pipeline...' : 'Run Data Scrubbing Pipeline (FR1-FR5)'}
            </button>
          </div>

          {/* CSV File Upload Card */}
          <div className="card">
            <h2 className="card-title" style={{ color: '#f8fafc' }}>
              <span style={{ display: 'flex', alignContent: 'center', gap: '8px' }}>
                <UploadCloud size={18} style={{ color: '#3b82f6' }} />
                Manual CSV Ingestion
              </span>
            </h2>
            
            <label className="file-upload-area">
              <UploadCloud className="file-upload-icon" size={32} />
              <div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', display: 'block' }}>
                  {uploadedFile ? uploadedFile.name : 'Click to select CSV file'}
                </span>
                <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                  Upload raw vehicle log file to append to current dataset
                </span>
              </div>
              <input 
                type="file" 
                accept=".csv" 
                style={{ display: 'none' }} 
                onChange={handleFileUpload}
                disabled={isRunningPipeline}
              />
            </label>
          </div>
        </div>

        {/* Real-time Logs Console */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 className="card-title" style={{ color: '#f8fafc', marginBottom: '12px' }}>
            <span style={{ display: 'flex', alignContent: 'center', gap: '8px' }}>
              <Terminal size={18} style={{ color: '#10b981' }} />
              Live Ingestion Log Stream
            </span>
          </h2>
          
          <div className="admin-console" style={{ flexGrow: 1, minHeight: '340px' }}>
            {logs.map((log, idx) => (
              <div key={idx} className={`console-line ${log.type}`}>
                {log.type === 'success' && <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />}
                {log.type === 'warning' && <AlertTriangle size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />}
                {log.text}
              </div>
            ))}
            <div ref={consoleEndRef} />
          </div>

          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
            <span>Terminal: bin/bash --session=pipeline</span>
            <span style={{ color: '#10b981' }}>● Connection Secure</span>
          </div>
        </div>
      </div>
    </div>
  );
}
