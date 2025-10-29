const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 12;


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
  JWT_SECRET
};
