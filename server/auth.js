const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { ethers } = require('ethers');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 12;

// Blockchain configuration
const getBlockchainProvider = () => {
  const blockchainUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8080';
  const provider = new ethers.JsonRpcProvider(blockchainUrl);
  return provider;
};

const getBlockchainContract = async () => {
  try {
    const contractABI = require('../build/contracts/InstituteRegistry.json').abi;
    const contractNetworks = require('../build/contracts/InstituteRegistry.json').networks;
    
    const provider = getBlockchainProvider();
    
    // Get network ID using net_version for Truffle compatibility
    const networkId = await provider.send('net_version', []);
    console.log('Network ID:', networkId);
    console.log('Available networks:', Object.keys(contractNetworks));
    
    if (!contractNetworks[networkId]) {
      console.error(`Contract not deployed on network ${networkId}`);
      console.error('Available networks:', Object.keys(contractNetworks));
      throw new Error('InstituteRegistry contract not deployed. Please deploy the contract first.');
    }
    
    const contractAddress = contractNetworks[networkId].address;
    console.log('Contract address:', contractAddress);
    
    const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY || '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d';
    
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);
    
    return contract;
  } catch (error) {
    console.error('Error loading blockchain contract:', error);
    throw error;
  }
};

// Generate credential hash for blockchain (instituteId + passwordHash)
const generateCredentialHash = (instituteId, passwordHash) => {
  const combined = `${instituteId}:${passwordHash}`;
  return crypto.createHash('sha256').update(combined).digest('hex');
};

// Convert string to bytes32 for Solidity
const stringToBytes32 = (str) => {
  return ethers.id(str);
};

// Authentication middleware
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Register institute
const registerInstitute = async (db, instituteData) => {
  const { instituteId, instituteName, password } = instituteData;
  
  // Validate inputs
  if (!instituteId || !instituteName || !password) {
    throw new Error('Missing required fields: instituteId, instituteName, password');
  }
  
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  
  let institutesCollection;
  let existingInstitute;
  
  if (db) {
    // MongoDB check
    institutesCollection = db.collection('institutes');
    existingInstitute = await institutesCollection.findOne({ instituteId });
  } else {
    // File-based storage check
    const fs = require('fs');
    const path = require('path');
    const institutesPath = path.join(__dirname, 'institutes.json');
    
    if (!fs.existsSync(institutesPath)) {
      fs.writeFileSync(institutesPath, JSON.stringify([]), 'utf8');
    }
    
    const institutes = JSON.parse(fs.readFileSync(institutesPath, 'utf8'));
    existingInstitute = institutes.find(inst => inst.instituteId === instituteId);
  }
  
  if (existingInstitute) {
    throw new Error('Institute with this ID already exists');
  }
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  
  // Generate credential hash for blockchain
  const credentialHash = generateCredentialHash(instituteId, passwordHash);
  const credentialHashBytes32 = stringToBytes32(credentialHash);
  
  // Store in blockchain - REQUIRED
  try {
    const contract = await getBlockchainContract();
    const tx = await contract.registerInstitute(
      instituteId,
      instituteName,
      credentialHashBytes32
    );
    await tx.wait();
    console.log('Institute registered on blockchain:', tx.hash);
  } catch (blockchainError) {
    console.error('Blockchain registration error:', blockchainError);
    // Rollback database entry if blockchain fails
    if (db) {
      await institutesCollection.deleteOne({ instituteId });
    }
    throw new Error('Failed to register on blockchain. Please ensure the blockchain is running and the contract is deployed: ' + blockchainError.message);
  }
  
  // Store in MongoDB
  const institute = {
    instituteId,
    instituteName,
    passwordHash,
    credentialHash,
    createdAt: new Date().toISOString(),
    isActive: true
  };
  
  if (db) {
    await institutesCollection.insertOne(institute);
  } else {
    // File-based storage
    const fs = require('fs');
    const path = require('path');
    const institutesPath = path.join(__dirname, 'institutes.json');
    const institutes = JSON.parse(fs.readFileSync(institutesPath, 'utf8'));
    institutes.push(institute);
    fs.writeFileSync(institutesPath, JSON.stringify(institutes, null, 2), 'utf8');
  }
  
  return {
    instituteId,
    instituteName,
    createdAt: institute.createdAt
  };
};

// Login institute with dual verification
const loginInstitute = async (db, loginData) => {
  const { instituteId, password } = loginData;
  
  if (!instituteId || !password) {
    throw new Error('Missing required fields: instituteId, password');
  }
  
  let institute;
  
  // Step 1: MongoDB verification
  if (db) {
    const institutesCollection = db.collection('institutes');
    institute = await institutesCollection.findOne({ instituteId });
  } else {
    // File-based storage
    const fs = require('fs');
    const path = require('path');
    const institutesPath = path.join(__dirname, 'institutes.json');
    
    if (!fs.existsSync(institutesPath)) {
      throw new Error('Invalid institute ID or password');
    }
    
    const institutes = JSON.parse(fs.readFileSync(institutesPath, 'utf8'));
    institute = institutes.find(inst => inst.instituteId === instituteId);
  }
  
  if (!institute) {
    throw new Error('Invalid institute ID or password');
  }
  
  if (!institute.isActive) {
    throw new Error('Institute account is deactivated');
  }
  
  // Verify password
  const passwordValid = await bcrypt.compare(password, institute.passwordHash);
  
  if (!passwordValid) {
    throw new Error('Invalid institute ID or password');
  }
  
  // Step 2: Blockchain verification - REQUIRED
  try {
    const contract = await getBlockchainContract();
    const credentialHash = generateCredentialHash(instituteId, institute.passwordHash);
    const credentialHashBytes32 = stringToBytes32(credentialHash);
    
    const isValid = await contract.verifyInstituteCredentials(
      instituteId,
      credentialHashBytes32
    );
    
    if (!isValid) {
      throw new Error('Blockchain verification failed - credentials do not match');
    }
    
    console.log('Blockchain verification successful');
  } catch (blockchainError) {
    console.error('Blockchain verification error:', blockchainError);
    throw new Error('Blockchain verification failed. Please ensure the blockchain is running: ' + blockchainError.message);
  }
  
  // Generate JWT token
  const token = jwt.sign(
    { 
      instituteId: institute.instituteId,
      instituteName: institute.instituteName
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  return {
    token,
    institute: {
      instituteId: institute.instituteId,
      instituteName: institute.instituteName
    }
  };
};

module.exports = {
  authMiddleware,
  registerInstitute,
  loginInstitute,
  getBlockchainContract,
  generateCredentialHash,
  JWT_SECRET
};
