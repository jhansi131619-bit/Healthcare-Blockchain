import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Key, Shield, User, FileText, CheckCircle2, ChevronRight, Activity, Globe } from 'lucide-react';
import { getOrCreatePatientKeys, getRecords, getConsents, getWalletInfo, setWalletConnected, registerPublicKeyOnChain } from '../services/storage';
import { connectWallet } from '../services/blockchain';

export default function Dashboard() {
  const [keys, setKeys] = useState({});
  const [recordsCount, setRecordsCount] = useState(0);
  const [activeConsentsCount, setActiveConsentsCount] = useState(0);
  const [wallet, setWallet] = useState({ connected: false, address: '' });
  const [recentRecords, setRecentRecords] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const walletInfo = getWalletInfo();
      setWallet(walletInfo);

      const address = walletInfo.connected ? walletInfo.address : '';
      const pKeys = await getOrCreatePatientKeys(address);
      setKeys(pKeys);

      if (address) {
        await registerPublicKeyOnChain(address, pKeys.publicKey);
      }

      const recs = await getRecords(address);
      setRecordsCount(recs.length);
      setRecentRecords(recs.slice(0, 3));

      const consents = await getConsents(address);
      const activeConsents = consents.filter(c => c.status === 'Active');
      setActiveConsentsCount(activeConsents.length);
    };

    loadData();
  }, [wallet.connected]);

  const handleConnectWallet = async () => {
    if (wallet.connected) {
      setWalletConnected(false, '');
      setWallet({ connected: false, address: '' });
      setKeys({});
    } else {
      try {
        const address = await connectWallet();
        setWalletConnected(true, address);
        setWallet({ connected: true, address });
      } catch (err) {
        alert(err.message || 'MetaMask connection failed');
      }
    }
  };


  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Welcome & Wallet Alert */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Patient control panel</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Welcome back, John Doe. Govern your encrypted health workspace.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {wallet.connected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="badge badge-success">
              <CheckCircle2 size={14} /> Wallet Connected
            </div>
          ) : (
            <button onClick={handleConnectWallet} className="btn-primary">
              Connect Web3 Wallet
            </button>
          )}
        </div>
      </div>

      {/* Cryptographic Key Block */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Key color="var(--accent-cyan)" size={22} />
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Your Decentralized Identity Keys</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>PUBLIC CRYPTO KEY (DISCOVERABLE)</span>
            <div style={{
              background: 'rgba(5, 8, 17, 0.4)',
              padding: '12px',
              borderRadius: '8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: 'var(--accent-cyan)',
              border: '1px solid rgba(255,255,255,0.03)',
              wordBreak: 'break-all'
            }}>
              {keys.publicKey}
            </div>
          </div>
          <div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>PRIVATE SECRET DECRYPTION KEY (LOCAL COLD STORAGE)</span>
            <div style={{
              background: 'rgba(5, 8, 17, 0.4)',
              padding: '12px',
              borderRadius: '8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: 'var(--text-muted)',
              border: '1px solid rgba(255,255,255,0.03)',
              wordBreak: 'break-all',
              userSelect: 'none'
            }}>
              •••••••••••••••••••••••••••••••• {keys.privateKey ? keys.privateKey.substring(keys.privateKey.length - 8) : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ padding: 12, borderRadius: 12, background: 'rgba(0, 242, 254, 0.1)', color: '#00f2fe' }}>
            <FileText size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: 22, fontWeight: 700 }}>{recordsCount}</h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Registered Records</p>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ padding: 12, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <Activity size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: 22, fontWeight: 700 }}>{activeConsentsCount}</h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Clinicians Authorized</p>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ padding: 12, borderRadius: 12, background: 'rgba(127, 0, 255, 0.1)', color: '#a855f7' }}>
            <Shield size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: 22, fontWeight: 700 }}>Optimal</h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Security Integrity</p>
          </div>
        </div>
      </div>

      {/* Bottom Split Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Left Side: Quick Links */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600 }}>Governing Operations</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link to="/upload" style={{
              textDecoration: 'none',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-glass)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#fff',
              transition: 'var(--transition)'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-glass)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <FileText size={18} color="var(--accent-cyan)" />
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 600 }}>Upload & Encrypt Record</h4>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Lock record with private key and push to IPFS</p>
                </div>
              </div>
              <ChevronRight size={16} />
            </Link>

            <Link to="/consent" style={{
              textDecoration: 'none',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-glass)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#fff',
              transition: 'var(--transition)'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-purple)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-glass)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Shield size={18} color="#a855f7" />
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 600 }}>Manage Clinic Consents</h4>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Grant or revoke asymmetric provider access</p>
                </div>
              </div>
              <ChevronRight size={16} />
            </Link>

            <Link to="/audit" style={{
              textDecoration: 'none',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-glass)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#fff',
              transition: 'var(--transition)'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#f59e0b'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-glass)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Globe size={18} color="#f59e0b" />
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 600 }}>Blockchain Log Explorer</h4>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Review tamper-proof logs of access attempts</p>
                </div>
              </div>
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        {/* Right Side: Recent Registered Records */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600 }}>Your Active Records</h3>
          {recentRecords.length === 0 ? (
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>
              No records found. Upload a record to see it here.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentRecords.map((rec) => (
                <div key={rec.id} style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(10, 14, 23, 0.3)',
                  border: '1px solid rgba(255,255,255,0.03)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{rec.title}</h4>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>CID: </span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                      {rec.ipfsHash.substring(0, 10)}...{rec.ipfsHash.substring(rec.ipfsHash.length - 8)}
                    </span>
                  </div>
                  <span className="badge badge-cyan">{rec.category}</span>
                </div>
              ))}
            </div>
          )}
          {recentRecords.length > 0 && (
            <Link to="/upload" style={{ color: 'var(--accent-cyan)', fontSize: '13px', alignSelf: 'flex-end', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              View All Records <ChevronRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
