import { sha256 } from './crypto';

// Re-usable block creator
export const createBlock = (index, prevHash, data) => {
  const timestamp = new Date().toISOString();
  const dataStr = JSON.stringify(data);
  const blockHash = sha256(index + prevHash + timestamp + dataStr);
  return {
    index,
    timestamp,
    data,
    prevHash,
    hash: blockHash,
  };
};

export const getGenesisBlock = () => {
  return createBlock(0, '0'.repeat(64), { info: 'Genesis Block - Healthcare Data Exchange Active' });
};
