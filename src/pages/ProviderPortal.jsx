import React, { useState, useEffect } from 'react';
import { Eye, Shield, Lock, ShieldAlert, Heart, RefreshCw, Key, Unlock, FileText, CheckCircle } from 'lucide-react';
import { getRecords, getConsents, MOCK_PROVIDERS, getPatientKeys, appendLedgerEvent } from '../services/storage';
import { decryptData } from '../services/crypto';
import Visualizer from '../components/Visualizer';

export default function ProviderPortal() {
  const [activeProviderId, setActiveProviderId] = useState(MOCK_PROVIDERS[0].id);
  const [activeProvider, setActiveProvider] = useState(MOCK_PROVIDERS[0]);
  const [patientKeyInput, setPatientKeyInput] = useState('');
  
  // UI states
  const [records, setRecords] = useState([]);
  const [consents, setConsents] = useState([]);
  const [fetched, setFetched] = useState(false);
  const [decryptedContents, setDecryptedContents] = useState({}); // { recordId: decryptedText }
  
  // Animation states
  const [transferStage, setTransferStage] = useState('idle');
  const [visualizerText, setVisualizerText] = useState('');

  useEffect(() => {
    const pKeys = getPatientKeys();
    setPatientKeyInput(pKeys.publicKey || '');
    
    const prov = MOCK_PROVIDERS.find(p => p.id === activeProviderId);
    setActiveProvider(prov);
    
    // Reset lists on doctor change
    setRecords([]);
    setFetched(false);
    setDecryptedContents({});
  }, [activeProviderId]);

  const handleFetch = (e) => {
    e.preventDefault();
    if (!patientKeyInput) return;

    setTransferStage('exchange');
    setVisualizerText(`Connecting to patient node registry...`);

    setTimeout(() => {
      setVisualizerText(`Checking smart contracts for active consent rules...`);

      setTimeout(() => {
        const allRecords = getRecords();
        const allConsents = getConsents();
        
        setRecords(allRecords);
        setConsents(allConsents);
        setFetched(true);
        setTransferStage('idle');
        setVisualizerText('');
      }, 1500);
    }, 1500);
  };

  const handleDecrypt = (record) => {
    const consent = consents.find(c => c.recordId === record.id && c.providerId === activeProviderId);
    
    if (!consent || consent.status !== 'Active') {
      alert("Error: You do not have an active consent contract for this record!");
      return;
    }

    setVisualizerText(`Retrieving ciphertext block from IPFS: ${record.ipfsHash.substring(0, 15)}...`);
    setTransferStage('exchange');

    setTimeout(() => {
      setVisualizerText(`Validating provider signature and decrypting with private key...`);

      setTimeout(() => {
        // Simulates proxy re-encryption and private key decryption
        // AES key references in crypto.js shifting characters
        const keyRef = activeProvider.publicKey;
        const decrypted = decryptData(record.encryptedContent, keyRef);
        
        // Actually grab the mock decrypted text from storage
        setDecryptedContents(prev => ({
          ...prev,
          [record.id]: record.decryptedContent
        }));

        // Log this access event on the ledger blockchain!
        appendLedgerEvent({
          action: 'RECORD_DECRYPTED',
          operator: activeProvider.name,
          recordTitle: record.title,
          recordId: record.id,
          facility: activeProvider.facility,
          timestamp: new Date().toISOString()
        });

        setTransferStage('idle');
        setVisualizerText('');
      }, 1500);
    }, 1500);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header and Switcher */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Clinician Request Desk</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Secure portal for authenticated clinicians to query patient registries.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Switch Clinician:</span>
          <select
            className="input-glass"
            value={activeProviderId}
            onChange={(e) => setActiveProviderId(e.target.value)}
            style={{ background: 'var(--bg-primary)', width: 'auto' }}
          >
            {MOCK_PROVIDERS.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.specialty})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Provider Crypto Keys Profile */}
      <div className="glass-card purple-glow" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ padding: 10, borderRadius: 10, background: 'rgba(168, 85, 247, 0.1)', color: '#c084fc' }}>
            <Heart size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>{activeProvider?.name}</h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{activeProvider?.specialty} • {activeProvider?.facility}</p>
          </div>
        </div>
        <div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>PROVIDER ID KEY</span>
          <span className="ledger-hash" style={{ fontSize: 11 }}>{activeProvider?.publicKey}</span>
        </div>
        <div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>CRYPTO WALLET ADDRESS</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
            <Key size={13} color="var(--text-muted)" />
            {activeProvider?.address}
          </div>
        </div>
      </div>

      {/* Query Form and Network Map */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
        {/* Left Side Query Panel */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <RefreshCw size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Query Patient Registry</h3>
          </div>

          <form onSubmit={handleFetch} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Enter Patient Discovery Key</label>
              <input
                type="text"
                className="input-glass font-mono"
                placeholder="e.g. 0xpub_john_doe..."
                value={patientKeyInput}
                onChange={(e) => setPatientKeyInput(e.target.value)}
                required
                disabled={transferStage !== 'idle'}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={transferStage !== 'idle'} style={{ justifyContent: 'center' }}>
              <Unlock size={16} /> Fetch Authorized Records
            </button>
          </form>
        </div>

        {/* Network Map Visualizer */}
        <Visualizer transferStage={transferStage} customText={visualizerText} />
      </div>

      {/* Query Results */}
      {fetched && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Patient Index Query Results</h3>

          {records.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>No records indexed on this patient identity.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {records.map((rec) => {
                // Check if this specific clinician has access
                const consent = consents.find(c => c.recordId === rec.id && c.providerId === activeProviderId);
                const hasAccess = consent && consent.status === 'Active';
                const isDecrypted = decryptedContents[rec.id];

                return (
                  <div key={rec.id} style={{
                    background: 'rgba(10, 14, 23, 0.4)',
                    border: `1px solid ${hasAccess ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}`,
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16
                  }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{
                          padding: 10,
                          borderRadius: 8,
                          background: hasAccess ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                          color: hasAccess ? 'var(--success)' : 'var(--danger)'
                        }}>
                          <FileText size={20} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{rec.title}</h4>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>CID: {rec.ipfsHash.substring(0, 24)}...</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {hasAccess ? (
                          <span className="badge badge-success" style={{ gap: 4 }}><Lock size={12} /> Consent Granted</span>
                        ) : (
                          <span className="badge badge-warning" style={{ gap: 4, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', color: 'var(--danger)' }}>
                            <ShieldAlert size={12} /> Access Locked
                          </span>
                        )}
                        <span className="badge badge-cyan">{rec.category}</span>
                      </div>
                    </div>

                    {/* Action Panel for Decryption */}
                    {hasAccess ? (
                      <div>
                        {isDecrypted ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--success)', fontWeight: 500 }}>
                              <CheckCircle size={15} /> Decrypted Content (Local Decryption Key Verified)
                            </div>
                            <div style={{
                              background: 'rgba(16, 185, 129, 0.03)',
                              border: '1px solid rgba(16, 185, 129, 0.15)',
                              borderRadius: '8px',
                              padding: '16px',
                              fontSize: '14px',
                              lineHeight: '1.6',
                              color: 'var(--text-primary)',
                              whiteSpace: 'pre-wrap'
                            }}>
                              {decryptedContents[rec.id]}
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(10, 14, 23, 0.3)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Record content encrypted. Provider decryption key available.</span>
                            <button onClick={() => handleDecrypt(rec)} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
                              <Unlock size={14} /> Decrypt Record
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{
                        background: 'rgba(239, 68, 68, 0.02)',
                        border: '1px dashed rgba(239, 68, 68, 0.15)',
                        borderRadius: '8px',
                        padding: '16px',
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10
                      }}>
                        <ShieldAlert size={16} color="var(--danger)" />
                        <span>
                          Decryption failed: Access rules prevent Dr. {activeProvider.name.split(' ')[1]} from requesting key wrappers for patient record <em>{rec.title}</em>. Ask the patient to update their consent settings.
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
