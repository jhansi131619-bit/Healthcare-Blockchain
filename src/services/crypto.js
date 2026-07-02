/**
 * Mock Cryptographic Services for Decentralized Healthcare Data Exchange.
 * Simulates asymmetric public/private key pairs and symmetric encryption.
 */

// Simple helper to hash strings (Simulated SHA-256)
export const sha256 = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0') + 
         Math.abs(hash * 31).toString(16).padStart(8, '0');
};

// Generates a mock public/private keypair
export const generateKeyPair = (name) => {
  const seed = name + Date.now();
  const publicKey = '0xpub_' + sha256(seed).substring(0, 16);
  const privateKey = '0xpriv_' + sha256(seed + '_private').substring(0, 32);
  return { publicKey, privateKey };
};

// Simple mock encryption (Caesar/XOR hybrid for visual display of "encrypted" text)
export const encryptData = (text, key) => {
  let result = '';
  const keyStr = typeof key === 'string' ? key : JSON.stringify(key);
  const shift = keyStr.charCodeAt(0) % 26;
  
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    // Standard printable ASCII range shifts
    if (charCode >= 32 && charCode <= 126) {
      result += String.fromCharCode(((charCode - 32 + shift) % 95) + 32);
    } else {
      result += text[i];
    }
  }
  
  // Format as simulated ciphertext block
  return `-----BEGIN HEALTH RECORD CIPHERTEXT-----\nVersion: DHDE-AES-256\nKey-Ref: ${keyStr.substring(0, 10)}...\n\n${btoa(result).match(/.{1,64}/g).join('\n')}\n-----END HEALTH RECORD CIPHERTEXT-----`;
};

// Simple mock decryption
export const decryptData = (ciphertext, key) => {
  try {
    if (!ciphertext.includes('-----BEGIN HEALTH RECORD CIPHERTEXT-----')) {
      return ciphertext; // Not encrypted
    }
    
    // Extract base64 part
    const lines = ciphertext.split('\n');
    const base64Content = lines.slice(4, lines.length - 2).join('');
    const shiftedText = atob(base64Content);
    
    const keyStr = typeof key === 'string' ? key : JSON.stringify(key);
    const shift = keyStr.charCodeAt(0) % 26;
    
    let result = '';
    for (let i = 0; i < shiftedText.length; i++) {
      const charCode = shiftedText.charCodeAt(i);
      if (charCode >= 32 && charCode <= 126) {
        result += String.fromCharCode(((charCode - 32 - shift + 95 * 10) % 95) + 32);
      } else {
        result += shiftedText[i];
      }
    }
    return result;
  } catch (e) {
    console.error('Decryption failed:', e);
    return '[ERROR: DECRYPTION KEY INVALID OR CORRUPTED]';
  }
};
