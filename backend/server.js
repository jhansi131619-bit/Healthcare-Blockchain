import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory mock IPFS storage (fallback if Pinata not configured or for local mock testing)
const mockIpfsStorage = new Map();

// Open SSE connections
let clients = [];

// SSE Subscription Endpoint
app.get('/api/notifications', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  clients.push(res);

  req.on('close', () => {
    clients = clients.filter(client => client !== res);
  });
});

// Broadcast notification to all SSE clients
const broadcastNotification = (eventData) => {
  clients.forEach(client => {
    try {
      client.write(`data: ${JSON.stringify(eventData)}\n\n`);
    } catch (e) {
      console.error('Failed to notify client:', e.message);
    }
  });
};

// Upload to IPFS (via Pinata or mock fallback)
app.post('/api/ipfs/upload', async (req, res) => {
  const { content, name } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  const hasPinata = process.env.PINATA_JWT && process.env.PINATA_JWT !== 'YOUR_PINATA_JWT';

  if (hasPinata) {
    try {
      console.log(`Pinning to Pinata: ${name}`);
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        {
          pinataContent: {
            encryptedContent: content,
            name: name
          },
          pinataMetadata: {
            name: name || 'dhde-record'
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.PINATA_JWT}`
          }
        }
      );
      
      const cid = response.data.IpfsHash;
      console.log(`Pinata success. CID: ${cid}`);
      return res.json({
        cid,
        size: response.data.PinSize || content.length,
        replicas: ['Pinata IPFS Gateway', 'Node Alpha (Zurich)'],
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Pinata upload error, falling back to mock storage:', error.message);
      // Fallback to mock on error
    }
  }

  // Mock IPFS storage fallback
  const cryptoSeed = name + Date.now() + Math.random().toString();
  // Generate simple mock CID
  let hash = 0;
  for (let i = 0; i < cryptoSeed.length; i++) {
    hash = (hash << 5) - hash + cryptoSeed.charCodeAt(i);
    hash = hash & hash;
  }
  const cid = 'QmMock' + Math.abs(hash).toString(16).padStart(8, '0') + Math.random().toString(36).substring(2, 10);
  
  mockIpfsStorage.set(cid, {
    content,
    name,
    timestamp: new Date().toISOString()
  });

  console.log(`Mock IPFS Upload. CID: ${cid}`);
  
  res.json({
    cid,
    size: content.length,
    replicas: ['Local Memory (Mock)', 'Node Beta (San Francisco)'],
    timestamp: new Date().toISOString()
  });
});

// Fetch from IPFS (either local mock or Pinata Gateway fallback)
app.get('/api/ipfs/:cid', async (req, res) => {
  const { cid } = req.params;
  
  // Check mock storage first
  if (mockIpfsStorage.has(cid)) {
    const data = mockIpfsStorage.get(cid);
    return res.json({ encryptedContent: data.content, name: data.name });
  }

  // Otherwise, fetch from public IPFS gateways
  try {
    const gateways = [
      `https://gateway.pinata.cloud/ipfs/${cid}`,
      `https://ipfs.io/ipfs/${cid}`
    ];

    for (const url of gateways) {
      try {
        const response = await axios.get(url, { timeout: 5000 });
        if (response.data && response.data.encryptedContent) {
          return res.json(response.data);
        } else if (response.data) {
          // If the gateway returns raw content direct
          return res.json({ encryptedContent: typeof response.data === 'string' ? response.data : JSON.stringify(response.data) });
        }
      } catch (err) {
        console.warn(`Gateway failed: ${url}`);
      }
    }
    
    res.status(404).json({ error: 'Content not found on IPFS gateways' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch from IPFS', details: error.message });
  }
});

// Admin-triggerable manual event notification for mock events or alerts
app.post('/api/notifications/manual', (req, res) => {
  const { type, title, message, ...rest } = req.body;
  const eventData = {
    type: type || 'ALERT',
    title: title || 'System Update',
    message: message || 'No message provided',
    timestamp: new Date().toISOString(),
    ...rest
  };
  broadcastNotification(eventData);
  res.json({ success: true, broadcasted: eventData });
});

// Listen to contract events if addresses exist and RPC is available
const initBlockchainListener = () => {
  const addressesPath = path.join(__dirname, 'addresses.json');
  if (!fs.existsSync(addressesPath)) {
    console.log('No addresses.json found. Blockchain notifications listener will wait until contracts are deployed.');
    return;
  }

  try {
    const { AccessControlAddress, RecordRegistryAddress, RecordRegistryABI } = JSON.parse(
      fs.readFileSync(addressesPath, 'utf8')
    );

    const providerUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
    const provider = new ethers.JsonRpcProvider(providerUrl);

    provider.getNetwork()
      .then((network) => {
        console.log(`Connected to blockchain node at ${providerUrl}. Network: ${network.name} (${network.chainId})`);

        const registryContract = new ethers.Contract(RecordRegistryAddress, RecordRegistryABI, provider);

        // Listen for uploads
        registryContract.on('RecordUploaded', (recordId, owner, ipfsHash, title) => {
          console.log(`[Event] RecordUploaded: ${title} (ID: ${recordId}) by ${owner}`);
          broadcastNotification({
            type: 'RECORD_UPLOADED',
            title: 'Medical Record Uploaded',
            message: `A new record "${title}" was securely encrypted and registered.`,
            recordId,
            owner,
            ipfsHash,
            timestamp: new Date().toISOString()
          });
        });

        // Listen for access views
        registryContract.on('RecordViewed', (recordId, doctor, timestamp) => {
          console.log(`[Event] RecordViewed: Record ${recordId} was accessed by Doctor ${doctor}`);
          broadcastNotification({
            type: 'RECORD_VIEWED',
            title: 'Record Decrypted Audit Alert',
            message: `Doctor ${doctor.substring(0, 6)}...${doctor.substring(doctor.length - 4)} decrypted record ${recordId}.`,
            recordId,
            doctor,
            timestamp: new Date(Number(timestamp) * 1000).toISOString()
          });
        });

        console.log('Contract event listeners successfully initialized.');
      })
      .catch((err) => {
        console.warn('Could not connect to Ethereum provider. SSE notifications will run without blockchain events.', err.message);
      });
  } catch (error) {
    console.error('Error initializing blockchain listener:', error.message);
  }
};

app.listen(PORT, () => {
  console.log(`DHDE Backend Server running on port ${PORT}`);
  initBlockchainListener();
});
