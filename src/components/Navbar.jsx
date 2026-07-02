import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Wallet, Activity, Menu, X } from 'lucide-react';
import { getWalletInfo, setWalletConnected } from '../services/storage';

export default function Navbar() {
  const location = useLocation();
  const [wallet, setWallet] = useState({ connected: false, address: '' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Initial fetch
    setWallet(getWalletInfo());

    // Listen for custom events or updates (optional storage listener)
    const handleStorageChange = () => {
      setWallet(getWalletInfo());
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Check state periodically since we are in a single page app
    const interval = setInterval(() => {
      setWallet(getWalletInfo());
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleWalletToggle = () => {
    if (wallet.connected) {
      setWalletConnected(false, '');
    } else {
      setWalletConnected(true, '0x71C824...49b2');
    }
    setWallet(getWalletInfo());
  };

  const navItems = [
    { name: 'Gateway', path: '/' },
    { name: 'Patient Panel', path: '/patient' },
    { name: 'Clinic Desk', path: '/doctor' },
    { name: 'Records Storage', path: '/upload' },
    { name: 'Consent Rules', path: '/consent' },
    { name: 'Audit Ledger', path: '/audit' }
  ];

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: 'rgba(10, 14, 23, 0.75)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      {/* Brand logo */}
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Shield size={26} color="#00f2fe" style={{ filter: 'drop-shadow(0 0 8px rgba(0, 242, 254, 0.4))' }} />
        <span style={{
          fontWeight: 700,
          fontSize: '20px',
          background: 'linear-gradient(90deg, #00f2fe, #4facfe)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '0.5px'
        }}>
          DHDE.network
        </span>
      </Link>

      {/* Desktop Navigation Links */}
      <div style={{ display: 'none', gap: '8px' }} className="desktop-nav-links">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                textDecoration: 'none',
                color: isActive ? '#00f2fe' : '#9ca3af',
                fontSize: '14px',
                fontWeight: 500,
                padding: '8px 16px',
                borderRadius: '8px',
                background: isActive ? 'rgba(0, 242, 254, 0.08)' : 'transparent',
                border: isActive ? '1px solid rgba(0, 242, 254, 0.15)' : '1px solid transparent',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Wallet Connection */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={handleWalletToggle}
          style={{
            background: wallet.connected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 242, 254, 0.1)',
            border: wallet.connected ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(0, 242, 254, 0.2)',
            color: wallet.connected ? '#10b981' : '#00f2fe',
            fontWeight: 500,
            fontSize: '13px',
            fontFamily: wallet.connected ? 'var(--font-mono)' : 'inherit',
            padding: '8px 16px',
            borderRadius: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.3s ease'
          }}
        >
          <Wallet size={16} />
          {wallet.connected ? wallet.address : 'Connect Wallet'}
        </button>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            background: 'none',
            border: 'none',
            color: '#f3f4f6',
            cursor: 'pointer',
            padding: 4
          }}
          className="mobile-nav-toggle"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <div style={{
          position: 'absolute',
          top: '73px',
          left: 0,
          right: 0,
          background: 'rgba(10, 14, 23, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          zIndex: 999
        }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  textDecoration: 'none',
                  color: isActive ? '#00f2fe' : '#f3f4f6',
                  fontWeight: 500,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  background: isActive ? 'rgba(0, 242, 254, 0.08)' : 'transparent'
                }}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      )}

      {/* Injecting basic responsive breakpoints CSS in a style tag for simplicity */}
      <style>{`
        .desktop-nav-links {
          display: flex !important;
        }
        .mobile-nav-toggle {
          display: none !important;
        }
        @media (max-width: 900px) {
          .desktop-nav-links {
            display: none !important;
          }
          .mobile-nav-toggle {
            display: block !important;
          }
        }
      `}</style>
    </nav>
  );
}
