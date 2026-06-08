import React from 'react';
import { ShieldAlert, Shield } from 'lucide-react';

export default function AccessDenied({ requiredRoles, currentRole }) {
  return (
    <div className="card unauthorized-card">
      <div className="unauthorized-icon">
        <ShieldAlert size={32} />
      </div>
      <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Access Restricted</h2>
      <p className="section-desc" style={{ maxWidth: '480px', margin: '0 auto 24px auto' }}>
        This page requires <strong>{requiredRoles.join(' or ')}</strong> privileges. 
        Your current role is <strong>{currentRole}</strong>.
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <div className="role-badge agent" style={{ padding: '8px 16px' }}>
          <Shield size={14} style={{ marginRight: '6px' }} />
          Standard read access only
        </div>
      </div>
    </div>
  );
}
