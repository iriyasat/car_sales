import React, { useState } from 'react';
import { Shield, Sparkles } from 'lucide-react';

// --- PAGE IMPORTS ---
// We import each simplified page component from the dedicated pages folder
import DashboardPage from './pages/DashboardPage';
import DataPage from './pages/DataPage';
import ReportPage from './pages/ReportPage';
import AdminPage from './pages/AdminPage';
import AccessDenied from './components/AccessDenied';

// --- JSON DATA IMPORT ---
// Load the 500 sales records generated from the CSV conversion
import salesDataRaw from './data/car_sales_500.json';

/**
 * App Coordinator
 * This is the root component of the React application. It handles navigation tabs,
 * active user roles, loads dataset values, and enforces page security permissions.
 */
export default function App() {
  // --- 1. TABS & ROLE STATE MANAGEMENT ---
  const [currentTab, setCurrentTab] = useState('dashboard'); // Tracks which tab is selected ('dashboard', 'data', 'reports', 'admin')
  const [userRole, setUserRole] = useState('Administrator'); // Tracks active user permissions ('Administrator', 'Sales Manager', 'Sales Agent')
  const [salesData, setSalesData] = useState(salesDataRaw); // Holds the active vehicle dataset array in state

  // Helper to simulate reloading dataset from database
  const handleReloadData = () => {
    setSalesData([...salesDataRaw]);
  };

  // --- 2. SECURITY ROUTER (ROLE ENFORCEMENT) ---
  // Calculates which component to render based on the current tab and current user role
  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        // Dashboard is accessible to Administrators and Sales Managers
        if (userRole === 'Administrator' || userRole === 'Sales Manager') {
          return <DashboardPage salesData={salesData} />;
        }
        // Access Denied screen shown to Sales Agents
        return <AccessDenied requiredRoles={['Administrator', 'Sales Manager']} currentRole={userRole} />;
      
      case 'data':
        // Inventory Table page is accessible to ALL user roles
        return <DataPage salesData={salesData} />;
      
      case 'reports':
        // Pivot Reports are accessible to Administrators and Sales Managers
        if (userRole === 'Administrator' || userRole === 'Sales Manager') {
          return <ReportPage salesData={salesData} />;
        }
        return <AccessDenied requiredRoles={['Administrator', 'Sales Manager']} currentRole={userRole} />;
      
      case 'admin':
        // Admin controls (cleaning triggers, manual uploads) are only accessible to Administrators
        if (userRole === 'Administrator') {
          return <AdminPage onReloadData={handleReloadData} salesData={salesData} />;
        }
        return <AccessDenied requiredRoles={['Administrator']} currentRole={userRole} />;
      
      default:
        return <DashboardPage salesData={salesData} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* 3. NAVIGATION BAR HEADER */}
      <nav className="navbar">
        <div className="container nav-container">
          
          {/* Brand Logo Section */}
          <a href="#" className="brand" onClick={(e) => { e.preventDefault(); setCurrentTab('dashboard'); }}>
            <div className="brand-icon">🚗</div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
              <span style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '-0.5px' }}>AUTOMETRIC</span>
              <span style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: '600', letterSpacing: '1px' }}>REPORTING</span>
            </div>
          </a>

          {/* Navigation Tab Click Listeners */}
          <div className="nav-links">
            <button 
              className={`nav-link ${currentTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentTab('dashboard')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Dashboard
            </button>
            <button 
              className={`nav-link ${currentTab === 'data' ? 'active' : ''}`}
              onClick={() => setCurrentTab('data')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Inventory Table
            </button>
            <button 
              className={`nav-link ${currentTab === 'reports' ? 'active' : ''}`}
              onClick={() => setCurrentTab('reports')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Pivot Reports
            </button>
            <button 
              className={`nav-link ${currentTab === 'admin' ? 'active' : ''}`}
              onClick={() => setCurrentTab('admin')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Admin Controls
            </button>
          </div>

          {/* 4. DYNAMIC USER ROLE SELECTOR PANEL */}
          {/* Allows user to test different access permissions live */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className={`role-badge ${userRole === 'Administrator' ? 'admin' : userRole === 'Sales Manager' ? 'manager' : 'agent'}`}>
              <Shield size={12} />
              {userRole}
            </div>

            <select 
              className="role-selector" 
              value={userRole} 
              onChange={(e) => {
                const selected = e.target.value;
                setUserRole(selected);
                
                // If switching to a role that does not have access to the current page, redirect them.
                if (selected === 'Sales Agent' && (currentTab === 'dashboard' || currentTab === 'reports' || currentTab === 'admin')) {
                  setCurrentTab('data'); // Agents are redirected to table listing
                } else if (selected === 'Sales Manager' && currentTab === 'admin') {
                  setCurrentTab('dashboard'); // Managers are redirected to Dashboard
                }
              }}
            >
              <option value="Administrator">Administrator</option>
              <option value="Sales Manager">Sales Manager</option>
              <option value="Sales Agent">Sales Agent</option>
            </select>
          </div>

        </div>
      </nav>

      {/* 5. ACTIVE CONTENT CONTAINER */}
      <main className="main-content">
        <div className="container">
          {renderTabContent()}
        </div>
      </main>

      {/* 6. SYSTEM FOOTER */}
      <footer className="footer">
        <div className="container footer-container">
          <div>
            <strong>Car Sales Reporting System</strong> — Day 10 Project
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block', marginTop: '2px' }}>
              Built by Ibrahim Hasan (Frontend) & Marzia (Design/Analysis)
            </span>
          </div>
          <div className="footer-links">
            <a href="#" onClick={(e) => { e.preventDefault(); setCurrentTab('data'); }}>Data Source</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setCurrentTab('reports'); }}>Excel Pivot Reference</a>
            <span style={{ color: 'var(--color-card-border)' }}>|</span>
            <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={12} />
              500 Records Cleaned & Verified
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
