import { generateKeyPair, encryptAES, decryptAES, encryptRSA, decryptRSA } from './crypto';
import { isContractsDeployed, getContracts, connectWallet } from './blockchain';
import { uploadToIPFS, fetchFromIPFS } from './ipfs';

// Hardhat standard local test accounts for doctors to make manual testing seamless!
export const MOCK_PROVIDERS = [
  { id: 'prov1', name: 'Dr. Elizabeth Blackwell', specialty: 'Cardiology', facility: 'Mayo Clinic', publicKey: '', address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' },
  { id: 'prov2', name: 'Dr. Gregory House', specialty: 'Diagnostics', facility: 'Princeton-Plainsboro', publicKey: '', address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' },
  { id: 'prov3', name: 'St. Jude Lab Team', specialty: 'Oncology Research', facility: 'St. Jude Hospital', publicKey: '', address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906' },
  { id: 'prov4', name: 'Dr. Alice Carter', specialty: 'General Practice', facility: 'Metro Health Center', publicKey: '', address: '0x15d34AAf54a67C6430493770267C822170103395' }
];

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
  if (localStorage.getItem('dhde_initialized')) return;

  const mockKeys = {
    publicKey: JSON.stringify({ kty: 'RSA', n: 'mock_n', e: 'AQAB' }),
    privateKey: JSON.stringify({ kty: 'RSA', n: 'mock_n', d: 'mock_d' })
  };

  const initialRecords = [
    {
      id: 'rec1',
      title: 'Cardiology ECG Report',
      date: '2026-06-15',
      category: 'Diagnostic',
      facility: 'Metro Health Center',
      ownerKey: mockKeys.publicKey,
      fileName: 'ecg_john_doe_2026.enc',
      ipfsHash: 'QmYwAPJzv5CZ1aA5xKVnHbN6mX16rqc3F6N3A2g8Wp1234',
      size: '2.4 KB',
      replicas: ['Node Alpha (Zurich)', 'Node Gamma (Singapore)'],
      encryptedContent: '-----BEGIN HEALTH RECORD CIPHERTEXT-----\nVersion: DHDE-AES-256\nKey-Ref: local...\n\nU2FsdGVkX1951234567890NormalSinusRhythmWithMildTachycardiaCheckUpNeeded\n-----END HEALTH RECORD CIPHERTEXT-----',
      decryptedContent: 'Patient: John Doe. Vitals: BP 122/80, HR 82. ECG indicates normal sinus rhythm. No acute ischemic changes.'
    },
    {
      id: 'rec2',
      title: 'Blood Panel Panel-12',
      date: '2026-05-10',
      category: 'Lab Report',
      facility: 'LabCorp Central',
      ownerKey: mockKeys.publicKey,
      fileName: 'blood_report_may2026.enc',
      ipfsHash: 'QmZtBXKzv5CZ1aA5xKVnHbN6mX16rqc3F6N3A2g8Wp9876',
      size: '1.1 KB',
      replicas: ['Node Beta (San Francisco)', 'Node Delta (Tokyo)'],
      encryptedContent: '-----BEGIN HEALTH RECORD CIPHERTEXT-----\nVersion: DHDE-AES-256\nKey-Ref: local...\n\nU2FsdGVkX189876543210HaemoglobinNormalCholesterolSlightlyElevated\n-----END HEALTH RECORD CIPHERTEXT-----',
      decryptedContent: 'WBC: 6.2 x10^3/uL (Normal), Hb: 15.1 g/dL (Normal), Total Cholesterol: 210 mg/dL (Borderline High), Vitamin D: 28 ng/mL (Slight Deficiency).'
    }
  ];

  const ledger = [
    {
      index: 0,
      timestamp: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
      hash: 'genesis_hash',
      prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
      data: { action: 'GENESIS', info: 'Genesis Block - Healthcare Data Exchange Active' }
    }
  ];

  const consents = [
    {
      id: 'con1',
      recordId: 'rec1',
      providerId: 'prov1',
      patientKey: mockKeys.publicKey,
      providerKey: 'mock_provider_key',
      status: 'Active',
      grantedAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString()
    }
  ];

  setStorageItem('dhde_patient_keys', mockKeys);
  setStorageItem('dhde_records', initialRecords);
  setStorageItem('dhde_consents', consents);
  setStorageItem('dhde_ledger', ledger);
  setStorageItem('dhde_wallet_address', '');
  setStorageItem('dhde_wallet_connected', false);
  localStorage.setItem('dhde_initialized', 'true');
};

/**
 * Gets or creates RSA keypair associated with current wallet address.
 */
export const getOrCreatePatientKeys = async (address) => {
  if (!address) return getStorageItem('dhde_patient_keys', {});
  
  const key = `dhde_keys_${address.toLowerCase()}`;
  let keys = getStorageItem(key, null);
  
  if (!keys) {
    console.log('Generating new RSA keypair for address:', address);
    keys = await generateKeyPair();
    setStorageItem(key, keys);
    
    // Auto-register public key if contracts are deployed
    if (isContractsDeployed()) {
      try {
        const { accessControl } = await getContracts();
        const tx = await accessControl.registerPublicKey(keys.publicKey);
        await tx.wait();
        console.log('Successfully registered public key on-chain.');
      } catch (e) {
        console.error('On-chain public key registration failed:', e);
      }
    }
  }
  return keys;
};

/**
 * Register public key manually.
 */
export const registerPublicKeyOnChain = async (address, publicKeyString) => {
  if (!isContractsDeployed()) return;
  try {
    const { accessControl } = await getContracts();
    const currentOnChain = await accessControl.getPublicKey(address);
    if (!currentOnChain) {
      console.log('Registering public key on blockchain...');
      const tx = await accessControl.registerPublicKey(publicKeyString);
      await tx.wait();
    }
  } catch (error) {
    console.error('registerPublicKeyOnChain error:', error);
  }
};

/**
 * Gets public key for a doctor.
 */
export const getDoctorPublicKey = async (doctorAddress) => {
  if (isContractsDeployed()) {
    try {
      const { accessControl } = await getContracts();
      const pubKey = await accessControl.getPublicKey(doctorAddress);
      if (pubKey) return pubKey;
    } catch (e) {
      console.error('Error fetching doctor public key from blockchain:', e);
    }
  }
  // Simulated fallback public key mapping
  return JSON.stringify({ kty: 'RSA', n: 'mock_doc_n_' + doctorAddress.substring(0, 8), e: 'AQAB' });
};

/**
 * Fetch records (combines smart contracts and localStorage mock states)
 */
export const getRecords = async (address) => {
  initializeState();
  if (isContractsDeployed() && address) {
    try {
      const { recordRegistry } = await getContracts();
      const recordIds = await recordRegistry.getPatientRecords(address);
      const records = [];
      
      for (const id of recordIds) {
        try {
          const result = await recordRegistry.getRecord(id);
          // result = [ipfsHash, title, category, facility, timestamp, owner, encryptedOwnerKey]
          records.push({
            id,
            ipfsHash: result[0],
            title: result[1],
            category: result[2],
            facility: result[3],
            date: new Date(Number(result[4]) * 1000).toISOString().split('T')[0],
            owner: result[5],
            encryptedOwnerKey: result[6],
            // Pull files locally or from memory
            fileName: result[1].toLowerCase().replace(/ /g, '_') + '.enc'
          });
        } catch (innerErr) {
          console.warn(`Could not read record ${id} from chain:`, innerErr.message);
        }
      }
      return records;
    } catch (error) {
      console.error('Error fetching records from blockchain:', error);
    }
  }
  return getStorageItem('dhde_records', []);
};

/**
 * Register and encrypt a new record
 */
export const saveRecord = async (title, category, facility, cleartext, walletAddress) => {
  // 1. Locally encrypt file using AES-GCM
  const aesResult = await encryptAES(cleartext); // returns { ciphertext, iv, aesKeyJwk }
  const payloadToUpload = JSON.stringify({
    encryptedContent: aesResult.ciphertext,
    iv: aesResult.iv,
    fileName: title.toLowerCase().replace(/ /g, '_') + '.enc'
  });

  // 2. Upload ciphertext to IPFS
  const ipfsResult = await uploadToIPFS(payloadToUpload, title);

  // 3. Encrypt AES key for the owner (patient)
  const patientKeys = await getOrCreatePatientKeys(walletAddress);
  const encryptedOwnerKey = await encryptRSA(patientKeys.publicKey, aesResult.aesKeyJwk);

  const recordId = 'rec_' + Math.random().toString(36).substr(2, 9);

  if (isContractsDeployed() && walletAddress) {
    const { recordRegistry } = await getContracts();
    
    // Call smart contract transaction
    console.log('Sending registerRecord transaction on-chain...');
    const tx = await recordRegistry.registerRecord(
      recordId,
      ipfsResult.cid,
      title,
      category,
      facility,
      encryptedOwnerKey
    );
    await tx.wait();
    console.log('On-chain registration complete.');
    
    appendLedgerEvent({
      action: 'RECORD_REGISTERED',
      operator: `Patient (${walletAddress.substring(0, 6)}...)`,
      recordId,
      title,
      ipfsHash: ipfsResult.cid
    });
    
    return recordId;
  }

  // Fallback to local simulated storage
  const newRecord = {
    id: recordId,
    title,
    date: new Date().toISOString().split('T')[0],
    category,
    facility,
    ownerKey: patientKeys.publicKey,
    fileName: title.toLowerCase().replace(/ /g, '_') + '.enc',
    ipfsHash: ipfsResult.cid,
    size: (ipfsResult.size / 1024).toFixed(1) + ' KB',
    replicas: ipfsResult.replicas,
    encryptedContent: aesResult.ciphertext,
    iv: aesResult.iv,
    encryptedOwnerKey: encryptedOwnerKey,
    decryptedContent: cleartext // Cached locally for mock simulation
  };

  const records = getStorageItem('dhde_records', []);
  records.unshift(newRecord);
  setStorageItem('dhde_records', records);

  appendLedgerEvent({
    action: 'RECORD_REGISTERED',
    operator: 'Patient (John Doe)',
    recordId,
    title,
    ipfsHash: ipfsResult.cid
  });

  return recordId;
};

/**
 * Get active consents
 */
export const getConsents = async (patientAddress) => {
  initializeState();
  
  if (isContractsDeployed() && patientAddress) {
    try {
      const { accessControl } = await getContracts();
      // Compile consents list from AccessControl on-chain events
      const grantedFilter = accessControl.filters.AccessGranted(patientAddress);
      const revokedFilter = accessControl.filters.AccessRevoked(patientAddress);

      const grants = await accessControl.queryFilter(grantedFilter);
      const revokes = await accessControl.queryFilter(revokedFilter);

      const consentMap = new Map();

      // Process grants
      for (const log of grants) {
        const docAddress = log.args[1];
        const recordId = log.args[2];
        const key = `${docAddress}_${recordId}`;
        consentMap.set(key, {
          recordId,
          providerAddress: docAddress,
          status: 'Active',
          grantedAt: new Date().toISOString() // Or block timestamp if desired
        });
      }

      // Process revokes
      for (const log of revokes) {
        const docAddress = log.args[1];
        const recordId = log.args[2];
        const key = `${docAddress}_${recordId}`;
        if (consentMap.has(key)) {
          consentMap.set(key, {
            ...consentMap.get(key),
            status: 'Revoked',
            revokedAt: new Date().toISOString()
          });
        }
      }

      return Array.from(consentMap.values());
    } catch (error) {
      console.error('Error reading consents from blockchain events:', error);
    }
  }

  return getStorageItem('dhde_consents', []);
};

/**
 * Grant record access to a doctor
 */
export const saveConsent = async (recordId, providerAddress, patientAddress) => {
  if (isContractsDeployed() && patientAddress) {
    const { accessControl, recordRegistry } = await getContracts();
    
    // 1. Fetch record to get encrypted owner key
    const result = await recordRegistry.getRecord(recordId);
    const encryptedOwnerKey = result[6];
    
    // 2. Decrypt record's AES key using patient's private key
    const patientKeys = await getOrCreatePatientKeys(patientAddress);
    const aesKeyJwk = await decryptRSA(patientKeys.privateKey, encryptedOwnerKey);

    // 3. Fetch doctor public key from registry
    const doctorPublicKey = await getDoctorPublicKey(providerAddress);

    // 4. Encrypt record's AES key with doctor public key
    const doctorEncryptedAESKey = await encryptRSA(doctorPublicKey, aesKeyJwk);

    // 5. Send transaction
    console.log('Sending grantAccess transaction on-chain...');
    const tx = await accessControl.grantAccess(providerAddress, recordId, doctorEncryptedAESKey);
    await tx.wait();
    console.log('On-chain access grant confirmed.');

    const provider = MOCK_PROVIDERS.find(p => p.address.toLowerCase() === providerAddress.toLowerCase()) || { name: providerAddress };
    const recordTitle = result[1];

    appendLedgerEvent({
      action: 'CONSENT_GRANTED',
      operator: `Patient (${patientAddress.substring(0, 6)}...)`,
      providerName: provider.name,
      recordTitle,
      recordId
    });

    return;
  }

  // Simulated fallback
  const consents = getStorageItem('dhde_consents', []);
  const records = getStorageItem('dhde_records', []);
  const record = records.find(r => r.id === recordId);
  const provider = MOCK_PROVIDERS.find(p => p.address === providerAddress) || MOCK_PROVIDERS[0];
  const patientKeys = await getOrCreatePatientKeys(patientAddress);

  consents.push({
    id: 'con_' + Math.random().toString(36).substr(2, 9),
    recordId,
    providerId: provider.id,
    providerAddress: provider.address,
    patientKey: patientKeys.publicKey,
    providerKey: provider.publicKey || 'mock_doc_pub',
    status: 'Active',
    grantedAt: new Date().toISOString()
  });

  setStorageItem('dhde_consents', consents);

  appendLedgerEvent({
    action: 'CONSENT_GRANTED',
    operator: 'Patient (John Doe)',
    providerName: provider.name,
    recordTitle: record ? record.title : 'Unknown Record',
    recordId
  });
};

/**
 * Revoke record access from a doctor
 */
export const revokeConsent = async (recordId, providerAddress, patientAddress) => {
  if (isContractsDeployed() && patientAddress) {
    const { accessControl, recordRegistry } = await getContracts();
    
    console.log('Sending revokeAccess transaction on-chain...');
    const tx = await accessControl.revokeAccess(providerAddress, recordId);
    await tx.wait();
    console.log('On-chain access revoke confirmed.');

    const result = await recordRegistry.getRecord(recordId);
    const recordTitle = result[1];
    const provider = MOCK_PROVIDERS.find(p => p.address.toLowerCase() === providerAddress.toLowerCase()) || { name: providerAddress };

    appendLedgerEvent({
      action: 'CONSENT_REVOKED',
      operator: `Patient (${patientAddress.substring(0, 6)}...)`,
      providerName: provider.name,
      recordTitle,
      recordId
    });

    return;
  }

  // Simulated fallback
  const consents = getStorageItem('dhde_consents', []);
  const records = getStorageItem('dhde_records', []);
  const record = records.find(r => r.id === recordId);
  const provider = MOCK_PROVIDERS.find(p => p.address === providerAddress) || MOCK_PROVIDERS[0];

  const updatedConsents = consents.map(c => {
    if (c.recordId === recordId && c.providerAddress === providerAddress) {
      return { ...c, status: 'Revoked', revokedAt: new Date().toISOString() };
    }
    return c;
  });

  setStorageItem('dhde_consents', updatedConsents);

  appendLedgerEvent({
    action: 'CONSENT_REVOKED',
    operator: 'Patient (John Doe)',
    providerName: provider ? provider.name : 'Unknown Provider',
    recordTitle: record ? record.title : 'Unknown Record',
    recordId
  });
};

/**
 * Get full audit ledger feed
 */
export const getLedger = () => {
  initializeState();
  return getStorageItem('dhde_ledger', []);
};

export const appendLedgerEvent = (data) => {
  const ledger = getLedger();
  const prevBlock = ledger[ledger.length - 1] || { hash: '0'.repeat(64) };
  
  const newBlock = {
    index: ledger.length,
    timestamp: new Date().toISOString(),
    hash: 'block_' + Math.random().toString(36).substr(2, 9),
    prevHash: prevBlock.hash,
    data
  };

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
    operator: connected ? `Address: ${address.substring(0, 6)}...` : 'Patient (John Doe)',
    timestamp: new Date().toISOString()
  });
};
