import { generateKeyPair, encryptData, decryptData, sha256 } from './crypto';
import { getGenesisBlock, createBlock } from './blockchain';
import { uploadToIPFS } from './ipfs';

// Predefined list of mock healthcare providers/clinicians
export const MOCK_PROVIDERS = [
  { id: 'prov1', name: 'Dr. Elizabeth Blackwell', specialty: 'Cardiology', facility: 'Mayo Clinic', publicKey: '0xpub_blackwell8d29b0a7c', address: '0x3F8...2eA1' },
  { id: 'prov2', name: 'Dr. Gregory House', specialty: 'Diagnostics', facility: 'Princeton-Plainsboro', publicKey: '0xpub_house7f14c2b9a', address: '0x7B9...9cE4' },
  { id: 'prov3', name: 'St. Jude Lab Team', specialty: 'Oncology Research', facility: 'St. Jude Hospital', publicKey: '0xpub_stjudelab3e49f8', address: '0xA12...5dD8' },
  { id: 'prov4', name: 'Dr. Alice Carter', specialty: 'General Practice', facility: 'Metro Health Center', publicKey: '0xpub_carter6a18d3c5b', address: '0x6C4...8fB3' }
];

// Helper to retrieve storage
const getStorageItem = (key, defaultValue) => {
  const item = localStorage.getItem(key);
  if (!item) return defaultValue;
  try {
    return JSON.parse(item);
  } catch (e) {
    return defaultValue;
  }
};

const setStorageItem = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Initialize State
export const initializeState = () => {
  // If already initialized, do nothing
  if (localStorage.getItem('dhde_initialized')) return;

  // Generate a key pair for the main patient
  const patientKeys = generateKeyPair('Patient_John_Doe');
  
  // Set up initial records
  const initialRecords = [
    {
      id: 'rec1',
      title: 'Cardiology ECG Report',
      date: '2026-06-15',
      category: 'Diagnostic',
      facility: 'Metro Health Center',
      ownerKey: patientKeys.publicKey,
      fileName: 'ecg_john_doe_2026.pdf',
      ipfsHash: 'QmYwAPJzv5CZ1aA5xKVnHbN6mX16rqc3F6N3A2g8Wp1234',
      size: '2.4 MB',
      replicas: ['Node Alpha (Zurich)', 'Node Gamma (Singapore)'],
      encryptedContent: '-----BEGIN HEALTH RECORD CIPHERTEXT-----\nVersion: DHDE-AES-256\nKey-Ref: 0xpub_black...\n\nU2FsdGVkX1951234567890NormalSinusRhythmWithMildTachycardiaCheckUpNeeded\n-----END HEALTH RECORD CIPHERTEXT-----',
      decryptedContent: 'Patient: John Doe. Vitals: BP 122/80, HR 82. ECG indicates normal sinus rhythm. No acute ischemic changes.'
    },
    {
      id: 'rec2',
      title: 'Blood Panel Panel-12',
      date: '2026-05-10',
      category: 'Lab Report',
      facility: 'LabCorp Central',
      ownerKey: patientKeys.publicKey,
      fileName: 'blood_report_may2026.pdf',
      ipfsHash: 'QmZtBXKzv5CZ1aA5xKVnHbN6mX16rqc3F6N3A2g8Wp9876',
      size: '1.1 MB',
      replicas: ['Node Beta (San Francisco)', 'Node Delta (Tokyo)'],
      encryptedContent: '-----BEGIN HEALTH RECORD CIPHERTEXT-----\nVersion: DHDE-AES-256\nKey-Ref: 0xpub_house...\n\nU2FsdGVkX189876543210HaemoglobinNormalCholesterolSlightlyElevated\n-----END HEALTH RECORD CIPHERTEXT-----',
      decryptedContent: 'WBC: 6.2 x10^3/uL (Normal), Hb: 15.1 g/dL (Normal), Total Cholesterol: 210 mg/dL (Borderline High), Vitamin D: 28 ng/mL (Slight Deficiency).'
    }
  ];

  // Set up initial blockchain ledger
  const genesis = getGenesisBlock();
  const ledger = [genesis];
  
  // Add initial transaction for record registration
  const block1 = createBlock(1, genesis.hash, {
    action: 'RECORD_REGISTERED',
    operator: 'Patient (John Doe)',
    recordId: 'rec1',
    title: 'Cardiology ECG Report',
    ipfsHash: 'QmYwAPJzv5CZ1aA5xKVnHbN6mX16rqc3F6N3A2g8Wp1234',
    timestamp: new Date(Date.now() - 3600000 * 24 * 5).toISOString() // 5 days ago
  });
  ledger.push(block1);

  const block2 = createBlock(2, block1.hash, {
    action: 'RECORD_REGISTERED',
    operator: 'Patient (John Doe)',
    recordId: 'rec2',
    title: 'Blood Panel Panel-12',
    ipfsHash: 'QmZtBXKzv5CZ1aA5xKVnHbN6mX16rqc3F6N3A2g8Wp9876',
    timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString() // 3 days ago
  });
  ledger.push(block2);

  // Set up initial consent grants
  // Grant Dr. Elizabeth Blackwell access to Cardology ECG Report
  const consents = [
    {
      id: 'con1',
      recordId: 'rec1',
      providerId: 'prov1', // Blackwell
      patientKey: patientKeys.publicKey,
      providerKey: MOCK_PROVIDERS[0].publicKey,
      status: 'Active',
      grantedAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString()
    }
  ];

  // Log consent grant in ledger
  const block3 = createBlock(3, block2.hash, {
    action: 'CONSENT_GRANTED',
    operator: 'Patient (John Doe)',
    providerName: 'Dr. Elizabeth Blackwell',
    recordTitle: 'Cardiology ECG Report',
    recordId: 'rec1',
    timestamp: consents[0].grantedAt
  });
  ledger.push(block3);

  // Save to localStorage
  setStorageItem('dhde_patient_keys', patientKeys);
  setStorageItem('dhde_records', initialRecords);
  setStorageItem('dhde_consents', consents);
  setStorageItem('dhde_ledger', ledger);
  setStorageItem('dhde_wallet_address', '0x71C...49b2');
  setStorageItem('dhde_wallet_connected', true);
  
  localStorage.setItem('dhde_initialized', 'true');
};

// State Accessors & Mutators
export const getPatientKeys = () => {
  initializeState();
  return getStorageItem('dhde_patient_keys', {});
};

export const getRecords = () => {
  initializeState();
  return getStorageItem('dhde_records', []);
};

export const saveRecord = (record) => {
  const records = getRecords();
  records.unshift(record);
  setStorageItem('dhde_records', records);

  // Push to Blockchain Ledger
  appendLedgerEvent({
    action: 'RECORD_REGISTERED',
    operator: 'Patient (John Doe)',
    recordId: record.id,
    title: record.title,
    ipfsHash: record.ipfsHash,
  });
};

export const getConsents = () => {
  initializeState();
  return getStorageItem('dhde_consents', []);
};

export const saveConsent = (recordId, providerId) => {
  const consents = getConsents();
  const provider = MOCK_PROVIDERS.find(p => p.id === providerId);
  const patientKeys = getPatientKeys();
  const records = getRecords();
  const record = records.find(r => r.id === recordId);

  // Check if consent already exists
  const existingIndex = consents.findIndex(c => c.recordId === recordId && c.providerId === providerId);
  
  if (existingIndex >= 0) {
    if (consents[existingIndex].status === 'Active') return; // Already active
    consents[existingIndex].status = 'Active';
    consents[existingIndex].grantedAt = new Date().toISOString();
  } else {
    consents.push({
      id: 'con_' + Math.random().toString(36).substr(2, 9),
      recordId,
      providerId,
      patientKey: patientKeys.publicKey,
      providerKey: provider.publicKey,
      status: 'Active',
      grantedAt: new Date().toISOString()
    });
  }

  setStorageItem('dhde_consents', consents);

  // Append Ledger block
  appendLedgerEvent({
    action: 'CONSENT_GRANTED',
    operator: 'Patient (John Doe)',
    providerName: provider.name,
    recordTitle: record ? record.title : 'Unknown Record',
    recordId,
  });
};

export const revokeConsent = (recordId, providerId) => {
  const consents = getConsents();
  const provider = MOCK_PROVIDERS.find(p => p.id === providerId);
  const records = getRecords();
  const record = records.find(r => r.id === recordId);

  const updatedConsents = consents.map(c => {
    if (c.recordId === recordId && c.providerId === providerId) {
      return { ...c, status: 'Revoked', revokedAt: new Date().toISOString() };
    }
    return c;
  });

  setStorageItem('dhde_consents', updatedConsents);

  // Append Ledger block
  appendLedgerEvent({
    action: 'CONSENT_REVOKED',
    operator: 'Patient (John Doe)',
    providerName: provider ? provider.name : 'Unknown Provider',
    recordTitle: record ? record.title : 'Unknown Record',
    recordId,
  });
};

export const getLedger = () => {
  initializeState();
  return getStorageItem('dhde_ledger', []);
};

export const appendLedgerEvent = (data) => {
  const ledger = getLedger();
  const prevBlock = ledger[ledger.length - 1];
  const newBlock = createBlock(ledger.length, prevBlock.hash, data);
  ledger.push(newBlock);
  setStorageItem('dhde_ledger', ledger);
  return newBlock;
};

export const getWalletInfo = () => {
  initializeState();
  return {
    connected: getStorageItem('dhde_wallet_connected', false),
    address: getStorageItem('dhde_wallet_address', '')
  };
};

export const setWalletConnected = (connected, address = '') => {
  setStorageItem('dhde_wallet_connected', connected);
  setStorageItem('dhde_wallet_address', address);
  
  appendLedgerEvent({
    action: connected ? 'WALLET_CONNECTED' : 'WALLET_DISCONNECTED',
    operator: connected ? `Address: ${address}` : 'Patient (John Doe)',
    timestamp: new Date().toISOString()
  });
};
