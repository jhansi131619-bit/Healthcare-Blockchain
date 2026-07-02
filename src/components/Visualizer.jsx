import React, { useEffect, useState } from 'react';
import { Shield, HardDrive, Cpu, Heart } from 'lucide-react';

export default function Visualizer({ transferStage = 'idle', customText = '' }) {
  const [packetPos, setPacketPos] = useState({ x: 0, y: 0, visible: false });
  const [activeStage, setActiveStage] = useState('idle');

  // Node coordinates inside the 600x300 SVG viewbox
  const nodes = {
    patient: { x: 80, y: 150, color: '#00f2fe', label: 'Patient Node', icon: Shield },
    ipfs: { x: 300, y: 70, color: '#a855f7', label: 'IPFS Storage', icon: HardDrive },
    ledger: { x: 300, y: 230, color: '#f59e0b', label: 'Ledger Registry', icon: Cpu },
    doctor: { x: 520, y: 150, color: '#10b981', label: 'Provider Portal', icon: Heart }
  };

  useEffect(() => {
    if (transferStage === 'idle') {
      setPacketPos({ x: 0, y: 0, visible: false });
      setActiveStage('idle');
      return;
    }

    setActiveStage(transferStage);

    let animationTimeout;
    if (transferStage === 'upload') {
      // Animate packet Patient -> IPFS, then IPFS -> Ledger
      setPacketPos({ x: nodes.patient.x, y: nodes.patient.y, visible: true });
      
      // Step 1: Patient to IPFS
      animationTimeout = setTimeout(() => {
        setPacketPos({ x: nodes.ipfs.x, y: nodes.ipfs.y, visible: true });
        
        // Step 2: IPFS to Ledger
        animationTimeout = setTimeout(() => {
          setPacketPos({ x: nodes.ledger.x, y: nodes.ledger.y, visible: true });
          
          animationTimeout = setTimeout(() => {
            setPacketPos({ x: 0, y: 0, visible: false });
            setActiveStage('idle');
          }, 1500);
        }, 1500);
      }, 100);
    } else if (transferStage === 'exchange') {
      // Animate from Patient -> Ledger (Consent), then Doctor requests from IPFS
      setPacketPos({ x: nodes.patient.x, y: nodes.patient.y, visible: true });

      animationTimeout = setTimeout(() => {
        setPacketPos({ x: nodes.ledger.x, y: nodes.ledger.y, visible: true });

        animationTimeout = setTimeout(() => {
          setPacketPos({ x: nodes.ipfs.x, y: nodes.ipfs.y, visible: true });

          animationTimeout = setTimeout(() => {
            setPacketPos({ x: nodes.doctor.x, y: nodes.doctor.y, visible: true });

            animationTimeout = setTimeout(() => {
              setPacketPos({ x: 0, y: 0, visible: false });
              setActiveStage('idle');
            }, 1200);
          }, 1200);
        }, 1200);
      }, 100);
    }

    return () => clearTimeout(animationTimeout);
  }, [transferStage]);

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Decentralized Network Map</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Real-time cryptographic data routing activity</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`badge ${activeStage !== 'idle' ? 'badge-cyan animate-pulse' : 'badge-purple'}`}>
            {activeStage === 'idle' ? 'Ambient Mesh' : activeStage === 'upload' ? 'IPFS Hashing...' : 'P2P Exchange...'}
          </span>
        </div>
      </div>

      <div style={{
        position: 'relative',
        width: '100%',
        height: '250px',
        background: 'rgba(10, 14, 23, 0.4)',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.03)'
      }}>
        {/* SVG lines and animations */}
        <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 600 300">
          <defs>
            <linearGradient id="cyanPurple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--accent-purple)" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="purpleGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-purple)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--warning)" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="goldGreen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--warning)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--success)" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Network Paths */}
          <line x1={nodes.patient.x} y1={nodes.patient.y} x2={nodes.ipfs.x} y2={nodes.ipfs.y} stroke="url(#cyanPurple)" strokeWidth="2" strokeDasharray="5,5" />
          <line x1={nodes.patient.x} y1={nodes.patient.y} x2={nodes.ledger.x} y2={nodes.ledger.y} stroke="url(#cyanPurple)" strokeWidth="2" strokeDasharray="5,5" />
          <line x1={nodes.ipfs.x} y1={nodes.ipfs.y} x2={nodes.ledger.x} y2={nodes.ledger.y} stroke="url(#purpleGold)" strokeWidth="2" strokeDasharray="5,5" />
          <line x1={nodes.ipfs.x} y1={nodes.ipfs.y} x2={nodes.doctor.x} y2={nodes.doctor.y} stroke="url(#cyanPurple)" strokeWidth="2" strokeDasharray="5,5" />
          <line x1={nodes.ledger.x} y1={nodes.ledger.y} x2={nodes.doctor.x} y2={nodes.doctor.y} stroke="url(#goldGreen)" strokeWidth="2" strokeDasharray="5,5" />

          {/* Animating data packet */}
          {packetPos.visible && (
            <circle
              cx={packetPos.x}
              cy={packetPos.y}
              r="6"
              fill={activeStage === 'upload' ? 'var(--accent-cyan)' : 'var(--accent-pink)'}
              style={{
                transition: 'cx 1.4s ease-in-out, cy 1.4s ease-in-out',
                filter: 'drop-shadow(0 0 6px var(--accent-cyan))'
              }}
            />
          )}

          {/* Render Nodes */}
          {Object.entries(nodes).map(([key, node]) => {
            const IconComponent = node.icon;
            const isNodeActive = activeStage !== 'idle' && (
              (activeStage === 'upload' && (key === 'patient' || key === 'ipfs' || key === 'ledger')) ||
              (activeStage === 'exchange' && (key === 'patient' || key === 'ledger' || key === 'ipfs' || key === 'doctor'))
            );

            return (
              <g key={key} transform={`translate(${node.x}, ${node.y})`}>
                {/* Outer pulsing ring for active nodes */}
                {isNodeActive ? (
                  <circle r="26" fill="none" stroke={node.color} strokeWidth="1" strokeOpacity="0.8">
                    <animate attributeName="r" values="22;35;22" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="stroke-opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                  </circle>
                ) : (
                  <circle r="22" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                )}
                
                {/* Node Solid Circle */}
                <circle r="20" fill="var(--bg-secondary)" stroke={node.color} strokeWidth="1.5" />
                
                {/* Node Icon */}
                <g transform="translate(-10, -10)">
                  <IconComponent size={20} color={node.color} />
                </g>

                {/* Node Label */}
                <text
                  y="36"
                  textAnchor="middle"
                  fill="var(--text-secondary)"
                  style={{ fontSize: 11, fontWeight: 500, fontFamily: 'var(--font-sans)' }}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Live Event overlay */}
        <div style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          right: 12,
          background: 'rgba(5, 8, 17, 0.7)',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.04)',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: activeStage !== 'idle' ? 'var(--accent-cyan)' : 'var(--success)',
            display: 'inline-block',
            boxShadow: `0 0 8px ${activeStage !== 'idle' ? 'var(--accent-cyan)' : 'var(--success)'}`
          }} />
          <span style={{ fontFamily: 'var(--font-mono)' }}>
            {customText || (activeStage === 'idle' ? 'Network secure. Listening for patient contracts.' : activeStage === 'upload' ? 'Syncing encrypted content and publishing hashes to IPFS peers...' : 'Verifying user signatures and granting secure proxy access...')}
          </span>
        </div>
      </div>
    </div>
  );
}
