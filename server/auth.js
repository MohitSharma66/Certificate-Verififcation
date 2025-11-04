require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 12;

// Blockchain configuration
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CERTIFICATE_REGISTRY_ADDRESS = process.env.CONTRACT_ADDRESS;
const INSTITUTE_REGISTRY_ADDRESS = process.env.INSTITUTE_REGISTRY_ADDRESS;

// Load CertificateRegistry ABI
const certificateContractPath = path.join(__dirname, '../build/contracts/CertificateRegistry.json');
let CERTIFICATE_REGISTRY_ABI;
try {
  const contractJson = JSON.parse(fs.readFileSync(certificateContractPath, 'utf8'));
  CERTIFICATE_REGISTRY_ABI = contractJson.abi;
} catch (error) {
  console.error('Warning: Could not load CertificateRegistry ABI:', error.message);
  CERTIFICATE_REGISTRY_ABI = [];
}

// Load InstituteRegistry ABI
const instituteContractPath = path.join(__dirname, '../build/contracts/InstituteRegistry.json');
let INSTITUTE_REGISTRY_ABI;
try {
  const contractJson = JSON.parse(fs.readFileSync(instituteContractPath, 'utf8'));
  INSTITUTE_REGISTRY_ABI = contractJson.abi;
} catch (error) {
  console.error('Warning: Could not load InstituteRegistry ABI:', error.message);
  INSTITUTE_REGISTRY_ABI = [];
}

// Get CertificateRegistry contract instance (for certificate operations)
const getBlockchainContract = async () => {
  if (!SEPOLIA_RPC_URL) {
    throw new Error('SEPOLIA_RPC_URL environment variable not set. Please configure your Sepolia RPC endpoint.');
  }
  
  if (!PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY environment variable not set');
  }
  
  if (!CERTIFICATE_REGISTRY_ADDRESS) {
    throw new Error('CONTRACT_ADDRESS environment variable not set');
  }
  
  if (!CERTIFICATE_REGISTRY_ABI || CERTIFICATE_REGISTRY_ABI.length === 0) {
    throw new Error('CertificateRegistry ABI not loaded');
  }
  
  try {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CERTIFICATE_REGISTRY_ADDRESS, CERTIFICATE_REGISTRY_ABI, wallet);
    
    return contract;
  } catch (error) {
    console.error('Error creating CertificateRegistry contract instance:', error);
    throw error;
  }
};

// Get InstituteRegistry contract instance (for unique ID operations)
const getInstituteRegistryContract = async () => {
  if (!SEPOLIA_RPC_URL) {
    throw new Error('SEPOLIA_RPC_URL environment variable not set. Please configure your Sepolia RPC endpoint.');
  }
  
  if (!PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY environment variable not set');
  }
  
  if (!INSTITUTE_REGISTRY_ADDRESS) {
    throw new Error('INSTITUTE_REGISTRY_ADDRESS environment variable not set');
  }
  
  if (!INSTITUTE_REGISTRY_ABI || INSTITUTE_REGISTRY_ABI.length === 0) {
    throw new Error('InstituteRegistry ABI not loaded');
  }
  
  try {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(INSTITUTE_REGISTRY_ADDRESS, INSTITUTE_REGISTRY_ABI, wallet);
    
    return contract;
  } catch (error) {
    console.error('Error creating InstituteRegistry contract instance:', error);
    throw error;
  }
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
  const { instituteId, instituteName, password, blockchainTxHash, walletAddress } = instituteData;
  
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
  
  // Store in database
  const institute = {
    instituteId,
    instituteName,
    passwordHash,
    blockchainTxHash: blockchainTxHash || null,
    walletAddress: walletAddress || null,
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
  
  console.log('Institute registered successfully:', instituteId);
  if (blockchainTxHash) {
    console.log('Blockchain transaction hash:', blockchainTxHash);
  }
  
  return {
    instituteId,
    instituteName,
    createdAt: institute.createdAt,
    blockchainTxHash: institute.blockchainTxHash
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
  
  console.log('Login successful for institute:', instituteId);
  
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
  getInstituteRegistryContract,
  JWT_SECRET
};
