import { ethers } from 'ethers';
import addresses from '../contracts/addresses.json';

/**
 * Check if smart contracts are deployed and configured.
 */
export const isContractsDeployed = () => {
  return (
    addresses &&
    addresses.AccessControlAddress &&
    addresses.RecordRegistryAddress &&
    addresses.AccessControlAddress !== ''
  );
};

export const getContractAddresses = () => {
  return {
    accessControl: addresses.AccessControlAddress,
    recordRegistry: addresses.RecordRegistryAddress
  };
};

/**
 * Request MetaMask wallet connection.
 * @returns {Promise<string>} Wallet address
 */
export const connectWallet = async () => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed. Please install MetaMask to use Web3 features.');
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts[0];
  } catch (error) {
    console.error('Wallet connection failed:', error);
    throw error;
  }
};

/**
 * Gets the current Web3 signer connected via MetaMask.
 */
export const getSigner = async () => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed.');
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  return await provider.getSigner();
};

/**
 * Gets the Contract instances connected to the active MetaMask signer.
 */
export const getContracts = async () => {
  if (!isContractsDeployed()) {
    throw new Error('Smart contracts are not deployed. Running in simulated fallback mode.');
  }

  const signer = await getSigner();

  const accessControlContract = new ethers.Contract(
    addresses.AccessControlAddress,
    addresses.AccessControlABI,
    signer
  );

  const recordRegistryContract = new ethers.Contract(
    addresses.RecordRegistryAddress,
    addresses.RecordRegistryABI,
    signer
  );

  return {
    accessControl: accessControlContract,
    recordRegistry: recordRegistryContract
  };
};

/**
 * Sets up listeners for MetaMask account and chain updates.
 */
export const setupWalletListeners = (onAccountChanged) => {
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', (accounts) => {
      onAccountChanged(accounts[0] || '');
    });
    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    });
  }
};
