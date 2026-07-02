import React, { useState, useEffect } from 'react';
import { FileText, Lock, Plus, Database, Eye, HardDrive, CheckCircle } from 'lucide-react';
import { getRecords, saveRecord } from '../services/storage';
import { encryptData } from '../services/crypto';
import { uploadToIPFS } from '../services/ipfs';
import Visualizer from '../components/Visualizer';

export default function Records() {
  const [records, setRecords] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Diagnostic');
  const [facility, setFacility] = useState('');
  const [cleartext, setCleartext] = useState('');
  
  // Animation states
  const [transferStage, setTransferStage] = useState('idle');
  const [visualizerText, setVisualizerText] = useState('');
  
  // Ciphertext viewer modal state
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    setRecords(getRecords());
  }, []);

  const handleUpload = (e) => {
    e.preventDefault();
    if (!title || !facility || !cleartext) return;

    // Trigger Visualizer animation stages
    setTransferStage('upload');
    setVisualizerText('Hashing and encrypting clinical file contents using local key...');

    setTimeout(() => {
      // 1. Generate local document key reference
      const docKey = '0xkey_' + Math.random().toString(36).substr(2, 10);
      
      // 2. Encrypt cleartext locally
      const ciphertext = encryptData(cleartext, docKey);

      setVisualizerText('Broadcasting cipher blocks to IPFS storage providers...');

      setTimeout(() => {
        // 3. Upload to IPFS nodes
        const ipfsResult = uploadToIPFS(ciphertext, title);

        setVisualizerText(`Success! Stored on IPFS as Content-ID: ${ipfsResult.cid}`);

        // 4. Save record locally
        const newRecord = {
          id: 'rec_' + Math.random().toString(36).substr(2, 9),
          title,
          date: new Date().toISOString().split('T')[0],
          category,
          facility,
          ownerKey: '0xpub_john_doe',
          fileName: title.toLowerCase().replace(/ /g, '_') + '.enc',
          ipfsHash: ipfsResult.cid,
          size: (ipfsResult.size / 1024).toFixed(1) + ' KB',
          replicas: ipfsResult.replicas,
          encryptedContent: ciphertext,
          decryptedContent: cleartext
        };

        saveRecord(newRecord);
        setRecords(getRecords());
        
        // Reset form
        setTitle('');
        setFacility('');
        setCleartext('');

        // Finish animation
        setTimeout(() => {
          setTransferStage('idle');
          setVisualizerText('');
        }, 1200);
      }, 1500);
    }, 1500);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Electronic Health Records</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Encrypt files locally before broadcasting to IPFS content nodes.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
        {/* Left Side: Upload / Encrypt Form */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Lock size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Encrypt & Register Record</h3>
          </div>

          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Record Title</label>
              <input
                type="text"
                className="input-glass"
                placeholder="e.g. Annual Blood Summary"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={transferStage !== 'idle'}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Category</label>
                <select
                  className="input-glass"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={transferStage !== 'idle'}
                  style={{ background: 'var(--bg-primary)' }}
                >
                  <option value="Diagnostic">Diagnostic</option>
                  <option value="Lab Report">Lab Report</option>
                  <option value="Prescription">Prescription</option>
                  <option value="Vaccination">Vaccination</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Medical Facility</label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="e.g. LabCorp Clinic"
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                  required
                  disabled={transferStage !== 'idle'}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Cleartext EHR Content</label>
              <textarea
                className="input-glass"
                rows="4"
                placeholder="Enter sensitive health info (e.g. Blood type A+, Cholesterol levels, recommendations)"
                value={cleartext}
                onChange={(e) => setCleartext(e.target.value)}
                required
                disabled={transferStage !== 'idle'}
                style={{ resize: 'vertical' }}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={transferStage !== 'idle'} style={{ justifyContent: 'center' }}>
              <Lock size={16} /> Encrypt & Post to IPFS
            </button>
          </form>
        </div>

        {/* Right Side: Network Visualizer */}
        <Visualizer transferStage={transferStage} customText={visualizerText} />
      </div>

      {/* Uploaded Records Registry List */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Database size={18} color="var(--accent-purple)" />
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Active IPFS Records Index</h3>
        </div>

        {records.length === 0 ? (
          <p style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>No records registered on your identity index.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {records.map((rec) => (
              <div key={rec.id} style={{
                background: 'rgba(5, 8, 17, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16
              }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{
                    padding: 10,
                    borderRadius: 8,
                    background: 'rgba(0, 242, 254, 0.05)',
                    color: 'var(--accent-cyan)',
                    marginTop: 2
                  }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{rec.title}</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                      <span>Date: {rec.date}</span>
                      <span>Facility: {rec.facility}</span>
                      <span>Size: {rec.size}</span>
                    </div>
                    {/* Content Identifier */}
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <HardDrive size={13} color="var(--text-muted)" />
                      <span style={{ color: 'var(--text-muted)' }}>IPFS Hash (CID):</span>
                      <span className="ledger-hash">{rec.ipfsHash}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                  {/* Replicas nodes tags */}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {rec.replicas.map((rep, idx) => (
                      <span key={idx} style={{ fontSize: 10, background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: '2px 6px', borderRadius: '4px' }}>
                        {rep}
                      </span>
                    ))}
                  </div>

                  <span className="badge badge-cyan">{rec.category}</span>
                  
                  <button onClick={() => setSelectedRecord(rec)} className="btn-secondary" style={{ padding: '8px 14px', fontSize: 13, gap: 4 }}>
                    <Eye size={14} /> View Cipher
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ciphertext Dialog Modal overlay */}
      {selectedRecord && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 8, 17, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1100,
          padding: 16
        }}>
          <div className="glass-card" style={{
            maxWidth: '650px',
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            border: '1px solid var(--accent-cyan)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600 }}>Asymmetric Ciphertext Block</h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>File: {selectedRecord.fileName}</p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 20 }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--success)' }}>
              <CheckCircle size={15} /> Encrypted client-side with AES-256 before broadcast.
            </div>

            {/* Cipher code block */}
            <pre style={{
              background: 'rgba(5, 8, 17, 0.9)',
              padding: '16px',
              borderRadius: '8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--accent-cyan)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              maxHeight: '300px'
            }}>
              {selectedRecord.encryptedContent}
            </pre>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedRecord(null)} className="btn-secondary" style={{ padding: '8px 20px' }}>
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
