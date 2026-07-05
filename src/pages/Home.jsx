import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, User, Heart, Database, Activity, FileText, Lock } from 'lucide-react';
import { getRecords, getConsents, getLedger } from '../services/storage';

export default function Home() {
  const [stats, setStats] = useState({ recordsCount: 0, activeConsents: 0, blocksCount: 0 });

  useEffect(() => {
    const loadStats = async () => {
      const records = await getRecords();
      const consents = await getConsents();
      const ledger = getLedger();
      setStats({
        recordsCount: Array.isArray(records) ? records.length : 0,
        activeConsents: Array.isArray(consents) ? consents.filter(c => c.status === 'Active').length : 0,
        blocksCount: Array.isArray(ledger) ? ledger.length : 0
      });
    };
    loadStats().catch(console.error);
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: 48 }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', padding: '40px 0', position: 'relative' }}>
        <div className="float-element" style={{ display: 'inline-flex', padding: 12, borderRadius: '50%', background: 'rgba(0, 242, 254, 0.1)', marginBottom: 20 }}>
          <Shield size={48} color="#00f2fe" style={{ filter: 'drop-shadow(0 0 12px rgba(0, 242, 254, 0.5))' }} />
        </div>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 800,
          marginBottom: 16,
          background: 'linear-gradient(135deg, #ffffff 30%, #a855f7 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.2
        }}>
          Decentralized Healthcare <br />Data Exchange
        </h1>
        <p style={{
          fontSize: '18px',
          color: 'var(--text-secondary)',
          maxWidth: '680px',
          margin: '0 auto 32px auto',
          lineHeight: 1.6
        }}>
          Take complete control of your medical records. Securely encrypt, distribute across IPFS nodes, and govern provider access permissions using cryptographic consent contracts.
        </p>

        {/* Global Network Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 20,
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <div className="glass-card" style={{ padding: '20px 16px', textAlign: 'center' }}>
            <Database size={20} color="#00f2fe" style={{ marginBottom: 8 }} />
            <h4 style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{stats.recordsCount}</h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Encrypted Records</p>
          </div>
          <div className="glass-card" style={{ padding: '20px 16px', textAlign: 'center' }}>
            <Activity size={20} color="#10b981" style={{ marginBottom: 8 }} />
            <h4 style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{stats.activeConsents}</h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Active Consents</p>
          </div>
          <div className="glass-card" style={{ padding: '20px 16px', textAlign: 'center' }}>
            <Shield size={20} color="#f59e0b" style={{ marginBottom: 8 }} />
            <h4 style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{stats.blocksCount}</h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Verified Blocks</p>
          </div>
        </div>
      </div>

      <div className="glow-line" />

      {/* Main Portals Grid */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 24, textAlign: 'center' }}>Enter Gateway Portals</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24
        }}>
          {/* Patient Portal Card */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'rgba(0, 242, 254, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User size={24} color="#00f2fe" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600 }}>Patient Control Panel</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Connect your private wallet, view your encrypted healthcare record index, control which clinicians can decrypt records, and track audit events.
              </p>
            </div>
            <Link to="/patient" className="btn-primary" style={{ textDecoration: 'none', justifyContent: 'center' }}>
              Access Patient Panel
            </Link>
          </div>

          {/* Clinician Desk Card */}
          <div className="glass-card purple-glow" style={{ display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'rgba(127, 0, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Heart size={24} color="#a855f7" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600 }}>Clinician Request Desk</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Enter as a registered healthcare provider. Request access to patients' medical data, verify consent cryptographic keys, and decrypt files locally.
              </p>
            </div>
            <Link to="/doctor" className="btn-secondary" style={{ textDecoration: 'none', justifyContent: 'center', color: '#a855f7', borderColor: 'rgba(127, 0, 255, 0.3)' }}>
              Access Clinic Desk
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Explanations */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 24,
        marginTop: 20
      }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ color: '#00f2fe' }}><Lock size={24} /></div>
          <div>
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Zero-Knowledge Philosophy</h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Data is encrypted client-side using generated keypairs before transmission. No central provider has access to cleartext values.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ color: '#a855f7' }}><FileText size={24} /></div>
          <div>
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>P2P Content Storage (IPFS)</h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Files are split and stored across independent peer-to-peer storage nodes. Recover files via immutable content identifiers (CIDs).
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ color: '#f59e0b' }}><Shield size={24} /></div>
          <div>
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Immutable Consent Contracts</h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Permissions are cataloged as cryptographic rules. Doctor access queries are strictly checked against blockchain registry rules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
