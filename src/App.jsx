import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ProviderPortal from './pages/ProviderPortal';
import Records from './pages/Records';
import Consent from './pages/Consent';
import AuditLedger from './pages/AuditLedger';
import { initializeState } from './services/storage';

export default function App() {
  // Pre-seed storage state when the app mounts
  useEffect(() => {
    initializeState();
  }, []);

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        
        {/* Main Content Area */}
        <main style={{ flexGrow: 1, position: 'relative', zIndex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/patient" element={<Dashboard />} />
            <Route path="/doctor" element={<ProviderPortal />} />
            <Route path="/upload" element={<Records />} />
            <Route path="/consent" element={<Consent />} />
            <Route path="/audit" element={<AuditLedger />} />
          </Routes>
        </main>
        
        {/* Premium footer */}
        <footer style={{
          padding: '24px',
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--text-muted)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          background: 'rgba(10, 14, 23, 0.5)',
          marginTop: 'auto',
          zIndex: 1
        }}>
          <p>© 2026 DHDE Network. Secure Cryptographic Ledger-governed Healthcare Exchange. Built on P2P Storage.</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}
