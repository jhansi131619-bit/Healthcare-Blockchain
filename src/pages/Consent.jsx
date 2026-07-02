import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Heart, FileText, Check, AlertCircle } from 'lucide-react';
import { getRecords, getConsents, saveConsent, revokeConsent, MOCK_PROVIDERS } from '../services/storage';

export default function Consent() {
  const [records, setRecords] = useState([]);
  const [consents, setConsents] = useState([]);
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    setRecords(getRecords());
    setConsents(getConsents());
    
    // Set initial form values if records/providers are loaded
    const recs = getRecords();
    if (recs.length > 0) setSelectedRecordId(recs[0].id);
    if (MOCK_PROVIDERS.length > 0) setSelectedProviderId(MOCK_PROVIDERS[0].id);
  }, []);

  const handleGrant = (e) => {
    e.preventDefault();
    if (!selectedRecordId || !selectedProviderId) return;

    saveConsent(selectedRecordId, selectedProviderId);
    setConsents(getConsents());

    // Show temporary confirmation
    const providerName = MOCK_PROVIDERS.find(p => p.id === selectedProviderId)?.name;
    setToastMessage(`Consent successfully granted to ${providerName}`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleRevoke = (recordId, providerId) => {
    revokeConsent(recordId, providerId);
    setConsents(getConsents());
    
    const providerName = MOCK_PROVIDERS.find(p => p.id === providerId)?.name;
    setToastMessage(`Access revoked for ${providerName}`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Group active consents
  const activeConsents = consents.filter(c => c.status === 'Active');
  const revokedConsents = consents.filter(c => c.status === 'Revoked');

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Access Management & Consents</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Authorize clinicians using secure, patient-signed consent contracts.</p>
      </div>

      {toastMessage && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: 'var(--success)',
          padding: '12px 20px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 14
        }}>
          <Check size={16} />
          {toastMessage}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
        {/* Grant Access Form */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Plus size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Create Access Rule</h3>
          </div>

          {records.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <AlertCircle size={32} color="var(--warning)" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>You must upload a record first before you can grant consent.</p>
            </div>
          ) : (
            <form onSubmit={handleGrant} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Select Medical Record</label>
                <select
                  className="input-glass"
                  value={selectedRecordId}
                  onChange={(e) => setSelectedRecordId(e.target.value)}
                  style={{ background: 'var(--bg-primary)' }}
                >
                  {records.map(rec => (
                    <option key={rec.id} value={rec.id}>{rec.title} ({rec.facility})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Select Healthcare Provider</label>
                <select
                  className="input-glass"
                  value={selectedProviderId}
                  onChange={(e) => setSelectedProviderId(e.target.value)}
                  style={{ background: 'var(--bg-primary)' }}
                >
                  {MOCK_PROVIDERS.map(prov => (
                    <option key={prov.id} value={prov.id}>{prov.name} — {prov.specialty} ({prov.facility})</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>
                <Shield size={16} /> Authorize Clinic
              </button>
            </form>
          )}
        </div>

        {/* Registered Clinicians Overview */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Active Provider Directory</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {MOCK_PROVIDERS.map(prov => (
              <div key={prov.id} style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(10, 14, 23, 0.3)',
                border: '1px solid rgba(255,255,255,0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ padding: 8, borderRadius: 8, background: 'rgba(168, 85, 247, 0.08)', color: '#c084fc' }}>
                    <Heart size={16} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 600 }}>{prov.name}</h4>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{prov.specialty} • {prov.facility}</p>
                  </div>
                </div>
                <span className="badge badge-purple" style={{ fontSize: 10 }}>Registered</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Access Rules Table */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Active Consents & Permissions</h3>
        
        {activeConsents.length === 0 ? (
          <p style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>No active access permissions granted.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: 13 }}>
                  <th style={{ padding: '12px 8px', fontWeight: 500 }}>Medical Record</th>
                  <th style={{ padding: '12px 8px', fontWeight: 500 }}>Authorized Provider</th>
                  <th style={{ padding: '12px 8px', fontWeight: 500 }}>Public Key reference</th>
                  <th style={{ padding: '12px 8px', fontWeight: 500 }}>Granted At</th>
                  <th style={{ padding: '12px 8px', fontWeight: 500 }}>Status</th>
                  <th style={{ padding: '12px 8px', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeConsents.map((con) => {
                  const record = records.find(r => r.id === con.recordId);
                  const provider = MOCK_PROVIDERS.find(p => p.id === con.providerId);
                  return (
                    <tr key={con.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 14 }}>
                      <td style={{ padding: '16px 8px', fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FileText size={15} color="var(--accent-cyan)" />
                          {record ? record.title : 'Deleted Record'}
                        </div>
                      </td>
                      <td style={{ padding: '16px 8px' }}>
                        <div>{provider ? provider.name : 'Unknown Clinician'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{provider?.facility}</div>
                      </td>
                      <td style={{ padding: '16px 8px' }}>
                        <span className="ledger-hash" style={{ fontSize: 11 }}>
                          {con.providerKey.substring(0, 10)}...{con.providerKey.substring(con.providerKey.length - 6)}
                        </span>
                      </td>
                      <td style={{ padding: '16px 8px', fontSize: 12, color: 'var(--text-secondary)' }}>
                        {new Date(con.grantedAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '16px 8px' }}>
                        <span className="badge badge-success" style={{ padding: '2px 8px', fontSize: 10 }}>Active</span>
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleRevoke(con.recordId, con.providerId)}
                          className="btn-danger"
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Trash2 size={13} /> Revoke
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revocation History logs */}
      {revokedConsents.length > 0 && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>Revocation History Logs</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {revokedConsents.map((con) => {
              const record = records.find(r => r.id === con.recordId);
              const provider = MOCK_PROVIDERS.find(p => p.id === con.providerId);
              return (
                <div key={con.id} style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.02)',
                  border: '1px solid rgba(239, 68, 68, 0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  color: 'var(--text-secondary)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={14} color="var(--danger)" />
                    <span>
                      Revoked authorization for <strong>{provider ? provider.name : 'Clinician'}</strong> to access <strong>{record ? record.title : 'Record'}</strong>
                    </span>
                  </div>
                  <span style={{ fontSize: 11 }}>{con.revokedAt ? new Date(con.revokedAt).toLocaleDateString() : ''}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
