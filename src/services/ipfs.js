import { sha256 } from './crypto';

// Simulated IPFS nodes in the network for visual mesh mappings
export const MOCK_IPFS_PEERS = [
  { id: 'QmNode1', name: 'Node Alpha (Zurich)', ping: '12ms', type: 'Storage Provider', status: 'Online' },
  { id: 'QmNode2', name: 'Node Beta (San Francisco)', ping: '45ms', type: 'Clinical Host', status: 'Online' },
  { id: 'QmNode3', name: 'Node Gamma (Singapore)', ping: '88ms', type: 'Research Node', status: 'Online' },
  { id: 'QmNode4', name: 'Node Delta (Tokyo)', ping: '72ms', type: 'Backup Vault', status: 'Online' },
];

const BACKEND_URL = 'http://localhost:3001';

/**
 * Uploads data to IPFS via Node.js Express proxy.
 * Falls back to local simulated storage if the backend is unavailable.
 */
export const uploadToIPFS = async (content, fileName) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ipfs/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, name: fileName }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        cid: data.cid,
        size: data.size,
        replicas: data.replicas,
        timestamp: data.timestamp
      };
    }
  } catch (error) {
    console.warn('Backend IPFS proxy offline. Falling back to local simulated IPFS.', error.message);
  }

  // Fallback to local memory mock
  const contentHash = await sha256(content + fileName + Date.now());
  const cid = 'QmMock' + contentHash.substring(0, 38);
  const shuffled = [...MOCK_IPFS_PEERS].sort(() => 0.5 - Math.random());
  const replicas = shuffled.slice(0, 3).map(p => p.name);

  // Store in localStorage for mock mode consistency
  const mockStorage = JSON.parse(localStorage.getItem('dhde_mock_ipfs') || '{}');
  mockStorage[cid] = { content, fileName };
  localStorage.setItem('dhde_mock_ipfs', JSON.stringify(mockStorage));

  return {
    cid,
    size: new Blob([content]).size,
    replicas,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Retrieves data from IPFS.
 */
export const fetchFromIPFS = async (cid) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ipfs/${cid}`);
    if (response.ok) {
      const data = await response.json();
      return data.encryptedContent;
    }
  } catch (error) {
    console.warn('Backend IPFS proxy offline. Checking local simulated IPFS for CID:', cid);
  }

  // Check local mock storage
  const mockStorage = JSON.parse(localStorage.getItem('dhde_mock_ipfs') || '{}');
  if (mockStorage[cid]) {
    return mockStorage[cid].content;
  }
  
  throw new Error(`CID ${cid} not found on local simulated IPFS`);
};
