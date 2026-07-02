import { sha256 } from './crypto';

// Simulated IPFS nodes in the network
export const MOCK_IPFS_PEERS = [
  { id: 'QmNode1', name: 'Node Alpha (Zurich)', ping: '12ms', type: 'Storage Provider', status: 'Online' },
  { id: 'QmNode2', name: 'Node Beta (San Francisco)', ping: '45ms', type: 'Clinical Host', status: 'Online' },
  { id: 'QmNode3', name: 'Node Gamma (Singapore)', ping: '88ms', type: 'Research Node', status: 'Online' },
  { id: 'QmNode4', name: 'Node Delta (Tokyo)', ping: '72ms', type: 'Backup Vault', status: 'Online' },
];

/**
 * Simulates uploading data to an IPFS network.
 * Generates a mock CID (Content Identifier) and selects mock peers to store replicas.
 */
export const uploadToIPFS = (content, fileName) => {
  const contentHash = sha256(content + fileName + Date.now());
  const cid = 'Qm' + contentHash.substring(0, 44);
  
  // Distribute to 2-3 random mock nodes
  const shuffled = [...MOCK_IPFS_PEERS].sort(() => 0.5 - Math.random());
  const replicas = shuffled.slice(0, 3).map(p => p.name);

  return {
    cid,
    size: new Blob([content]).size,
    replicas,
    timestamp: new Date().toISOString(),
  };
};
