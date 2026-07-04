import React, { useState, useEffect } from 'react';
import { Database, Link2, Shield, Activity, RefreshCw } from 'lucide-react';
import { getLedger } from '../services/storage';
import { isContractsDeployed, getContracts } from '../services/blockchain';

export default function AuditLedger() {
  const [ledger, setLedger] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLedger = async () => {
    setRefreshing(true);
    try {
      const localLedger = [...getLedger()];
      
      if (isContractsDeployed()) {
        const { recordRegistry, accessControl } = await getContracts();
        
        // Query events from contract
        const uploads = await recordRegistry.queryFilter(recordRegistry.filters.RecordUploaded());
        const views = await recordRegistry.queryFilter(recordRegistry.filters.RecordViewed());
        const grants = await accessControl.queryFilter(accessControl.filters.AccessGranted());
        const revokes = await accessControl.queryFilter(accessControl.filters.AccessRevoked());

        const blockchainBlocks = [];

        // Helper to safely get timestamps/details
        const resolveEvents = async (events, actionName, dataMapper) => {
          for (const event of events) {
            try {
              const blockDetails = await event.getBlock();
              blockchainBlocks.push({
                index: event.blockNumber,
                timestamp: new Date(Number(blockDetails.timestamp) * 1000).toISOString(),
                hash: event.transactionHash,
                prevHash: blockDetails.parentHash,
                data: {
                  action: actionName,
                  ...dataMapper(event.args)
                }
              });
            } catch (innerErr) {
              console.warn("Could not load block details for event:", innerErr);
            }
          }
        };

        await resolveEvents(uploads, 'RECORD_REGISTERED', (args) => ({
          operator: `Patient (${args[1].substring(0, 6)}...)`,
          recordId: args[0],
          title: args[3],
          ipfsHash: args[2]
        }));

        await resolveEvents(views, 'RECORD_DECRYPTED', (args) => ({
          operator: `Doctor (${args[1].substring(0, 6)}...)`,
          recordTitle: `Record Ref: ${args[0]}`,
          recordId: args[0],
          facility: 'Web3 Clinic'
        }));

        await resolveEvents(grants, 'CONSENT_GRANTED', (args) => ({
          operator: `Patient (${args[0].substring(0, 6)}...)`,
          providerName: `Doctor (${args[1].substring(0, 6)}...)`,
          recordTitle: `Record: ${args[2]}`,
          recordId: args[2]
        }));

        await resolveEvents(revokes, 'CONSENT_REVOKED', (args) => ({
          operator: `Patient (${args[0].substring(0, 6)}...)`,
          providerName: `Doctor (${args[1].substring(0, 6)}...)`,
          recordTitle: `Record: ${args[2]}`,
          recordId: args[2]
        }));

        // Sort by block number ascending
        blockchainBlocks.sort((a, b) => a.index - b.index);

        // Merge local connections and genesis
        const merged = [
          ...localLedger.filter(b => b.data.action === 'GENESIS' || b.data.action.includes('WALLET')),
          ...blockchainBlocks
        ];

        // Sort final list by block index descending
        merged.sort((a, b) => b.index - a.index);
        setLedger(merged);
      } else {
        setLedger([...localLedger].reverse());
      }
    } catch (error) {
      console.error('Error compiling blockchain ledger:', error);
      setLedger([...getLedger()].reverse());
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);


  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Blockchain Audit Ledger</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Immutable transactional history of healthcare consents, indexing, and accesses.</p>
        </div>
        <button
          onClick={fetchLedger}
          className="btn-secondary"
          disabled={refreshing}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: 13 }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Syncing...' : 'Sync Blockchain'}
        </button>
      </div>

      {/* Network Health Indicators */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
          <Database size={20} color="var(--accent-cyan)" />
          <div>
            <h4 style={{ fontSize: 13, color: 'var(--text-secondary)' }}>BLOCK HEIGHT</h4>
            <p style={{ fontSize: 18, fontWeight: 700 }}>{ledger.length} Blocks</p>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
          <Shield size={20} color="#10b981" />
          <div>
            <h4 style={{ fontSize: 13, color: 'var(--text-secondary)' }}>CONSENSUS STATUS</h4>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }}>Active (PoA)</p>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
          <Activity size={20} color="#a855f7" />
          <div>
            <h4 style={{ fontSize: 13, color: 'var(--text-secondary)' }}>NETWORK HASHRATE</h4>
            <p style={{ fontSize: 18, fontWeight: 700 }}>142.6 KH/s</p>
          </div>
        </div>
      </div>

      {/* Ledger Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600 }}>Ledger Blocks</h3>

        {ledger.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>Syncing blockchain ledger...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
            
            {/* Timeline line connector */}
            <div style={{
              position: 'absolute',
              top: '40px',
              bottom: '40px',
              left: '32px',
              width: '2px',
              background: 'linear-gradient(180deg, var(--accent-cyan), var(--accent-purple), transparent)',
              zIndex: 0
            }} className="desktop-timeline-line" />

            {ledger.map((block, idx) => {
              const action = block.data.action || 'GENESIS';
              
              // Map badge styling depending on action type
              let actionBadge = <span className="badge badge-purple">{action}</span>;
              if (action === 'RECORD_REGISTERED') {
                actionBadge = <span className="badge badge-cyan">Record Registered</span>;
              } else if (action === 'CONSENT_GRANTED') {
                actionBadge = <span className="badge badge-success">Consent Granted</span>;
              } else if (action === 'CONSENT_REVOKED') {
                actionBadge = <span className="badge badge-warning" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', color: 'var(--danger)' }}>Consent Revoked</span>;
              } else if (action === 'RECORD_DECRYPTED') {
                actionBadge = <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)', color: '#c084fc' }}>Access Decrypted</span>;
              } else if (action.includes('WALLET')) {
                actionBadge = <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>Wallet Event</span>;
              }

              return (
                <div key={block.hash} style={{
                  display: 'flex',
                  gap: 24,
                  zIndex: 1,
                  position: 'relative'
                }} className="ledger-block-row">
                  {/* Block Number badge */}
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'var(--bg-secondary)',
                    border: '2px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: block.index === 0 ? '0 0 15px rgba(0, 242, 254, 0.1)' : 'none'
                  }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>BLOCK</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>#{block.index}</span>
                  </div>

                  {/* Block Details Panel */}
                  <div className="glass-card" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Block Header Info */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {actionBadge}
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(block.timestamp).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
                        <span>Operator:</span>
                        <strong style={{ color: '#fff' }}>{block.data.operator || block.data.providerName || 'Network Service'}</strong>
                      </div>
                    </div>

                    {/* Block Cryptographic Hash Blocks */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: 12,
                      padding: 10,
                      background: 'rgba(5, 8, 17, 0.4)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.02)'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>BLOCK HASH</span>
                        <span className="ledger-hash" style={{ fontSize: 12, wordBreak: 'break-all' }}>{block.hash}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>PREVIOUS HASH</span>
                        <span className="ledger-hash" style={{ fontSize: 12, color: 'var(--text-muted)', wordBreak: 'break-all' }}>{block.prevHash}</span>
                      </div>
                    </div>

                    {/* Block Transaction Data payload */}
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>TRANSACTION PAYLOAD (DATA BLOCK)</span>
                      <pre style={{
                        background: 'rgba(5, 8, 17, 0.2)',
                        padding: '12px',
                        borderRadius: '6px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        overflowX: 'auto',
                        border: '1px solid rgba(255,255,255,0.01)'
                      }}>
                        {JSON.stringify(block.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Timeline responsive overrides */}
      <style>{`
        @media (max-width: 600px) {
          .desktop-timeline-line {
            display: none !important;
          }
          .ledger-block-row {
            flex-direction: column !important;
            gap: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
