const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const { 
  authMiddleware, 
  registerInstitute, 
  loginInstitute,
  getBlockchainContract,
  getInstituteRegistryContract
} = require('./auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL].filter(Boolean)
    : true,
  credentials: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

if (process.env.NODE_ENV === 'production' && !MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required in production');
  process.exit(1);
}
let db;

// Initialize MongoDB connection
const connectToDatabase = async () => {
  try {
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      tls: true,
      serverApi: { version: '1', strict: false, deprecationErrors: false }
    });
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    db = client.db('certificateDB');
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    
    if (process.env.NODE_ENV === 'production') {
      console.error('MongoDB connection failed in production. Exiting.');
      process.exit(1);
    }
    
    console.log('Development mode: Falling back to file-based storage...');
    const fs = require('fs');
    const path = require('path');
    
    const certificatesPath = path.join(__dirname, 'certificates.json');
    if (!fs.existsSync(certificatesPath)) {
      fs.writeFileSync(certificatesPath, JSON.stringify([]), 'utf8');
    }
    
    const institutesPath = path.join(__dirname, 'institutes.json');
    if (!fs.existsSync(institutesPath)) {
      fs.writeFileSync(institutesPath, JSON.stringify([]), 'utf8');
    }
    
    const uniqueIdsPath = path.join(__dirname, 'uniqueIds.json');
    if (!fs.existsSync(uniqueIdsPath)) {
      fs.writeFileSync(uniqueIdsPath, JSON.stringify([]), 'utf8');
    }
    
    db = null;
    console.log('Using file-based storage');
  }
};

// Helper functions
const fs = require('fs');
const path = require('path');
const certificatesPath = path.join(__dirname, 'certificates.json');
const institutesPath = path.join(__dirname, 'institutes.json');
const uniqueIdsPath = path.join(__dirname, 'uniqueIds.json');

const readFromFile = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading file:', error);
    return [];
  }
};

const writeToFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing file:', error);
    throw error;
  }
};

// Hash function for certificate ID + public key
const hashCertificateId = (certificateId, publicKey) => {
  return crypto.createHash('sha256').update(`${certificateId}:${publicKey}`).digest('hex');
};

// ============= AUTHENTICATION ROUTES =============

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Certificate Backend API is running' });
});

// Register institute
app.post('/auth/register', async (req, res) => {
  try {
    const result = await registerInstitute(db, req.body);
    res.status(201).json({
      message: 'Institute registered successfully',
      institute: result
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Login institute
app.post('/auth/login', async (req, res) => {
  try {
    const result = await loginInstitute(db, req.body);
    res.json({
      message: 'Login successful',
      token: result.token,
      institute: result.institute
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
});

// Get current institute info
app.get('/auth/me', authMiddleware, (req, res) => {
  res.json({ institute: req.user });
});

// ============= UNIQUE ID GENERATION =============

// Generate unique ID
app.post('/unique-id/generate', authMiddleware, async (req, res) => {
  try {
    const uniqueId = uuidv4();
    const instituteId = req.user.instituteId;
    
    // Store on blockchain - REQUIRED
    try {
      const contract = await getInstituteRegistryContract();
      const tx = await contract.generateUniqueId(uniqueId, instituteId);
      await tx.wait();
      console.log('Unique ID registered on blockchain:', tx.hash);
    } catch (blockchainError) {
      console.error('Blockchain error:', blockchainError);
      return res.status(500).json({ 
        error: 'Failed to register unique ID on blockchain. Please ensure blockchain is running: ' + blockchainError.message 
      });
    }
    
    // Store in database
    const uniqueIdRecord = {
      uniqueId,
      instituteId,
      instituteName: req.user.instituteName,
      generatedAt: new Date().toISOString(),
      isActive: true
    };
    
    if (db) {
      const uniqueIdsCollection = db.collection('uniqueIds');
      await uniqueIdsCollection.insertOne(uniqueIdRecord);
    } else {
      const uniqueIds = readFromFile(uniqueIdsPath);
      uniqueIds.push(uniqueIdRecord);
      writeToFile(uniqueIdsPath, uniqueIds);
    }
    
    res.status(201).json({
      message: 'Unique ID generated successfully',
      uniqueId,
      generatedAt: uniqueIdRecord.generatedAt
    });
  } catch (error) {
    console.error('Error generating unique ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all unique IDs for current institute
app.get('/unique-id/list', authMiddleware, async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    let uniqueIds;
    
    if (db) {
      const uniqueIdsCollection = db.collection('uniqueIds');
      uniqueIds = await uniqueIdsCollection.find({ instituteId }).toArray();
    } else {
      const allUniqueIds = readFromFile(uniqueIdsPath);
      uniqueIds = allUniqueIds.filter(uid => uid.instituteId === instituteId);
    }
    
    res.json({ uniqueIds });
  } catch (error) {
    console.error('Error fetching unique IDs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============= CERTIFICATE ROUTES =============

// Store certificate data (now requires authentication)
app.post('/certificates', authMiddleware, async (req, res) => {
  try {
    const {
      id,
      studentName,
      courseName,
      institution,
      instituteId,
      year,
      semester,
      CGPA,
      publicKey
    } = req.body;

    // Validate required fields
    if (!id || !studentName || !courseName || !institution || !publicKey) {
      return res.status(400).json({ 
        error: 'Missing required fields: id, studentName, courseName, institution, publicKey' 
      });
    }

    // Ensure the institute can only issue certificates for themselves
    if (req.user.instituteId !== instituteId) {
      return res.status(403).json({ 
        error: 'You can only issue certificates for your own institute' 
      });
    }

    // Create certificate object
    const certificate = {
      id,
      studentName,
      courseName,
      institution,
      instituteId: req.user.instituteId,
      year,
      semester,
      CGPA,
      publicKey,
      issuedBy: req.user.instituteId,
      createdAt: new Date().toISOString(),
      isValid: true
    };

    // Generate hash for blockchain storage
    const certificateHash = hashCertificateId(id, publicKey);

    let success = false;

    if (db) {
      const certificates = db.collection('certificates');
      
      const existingCert = await certificates.findOne({ id: id });
      if (existingCert) {
        return res.status(409).json({ error: 'Certificate with this ID already exists' });
      }

      const result = await certificates.insertOne(certificate);
      success = result.insertedId;
    } else {
      const certificates = readFromFile(certificatesPath);
      
      const existingCert = certificates.find(cert => cert.id === id);
      if (existingCert) {
        return res.status(409).json({ error: 'Certificate with this ID already exists' });
      }

      certificates.push(certificate);
      writeToFile(certificatesPath, certificates);
      success = true;
    }
    
    // Store on blockchain - REQUIRED
    try {
      const contract = await getBlockchainContract();
      const tx = await contract.issueCertificate(
        certificateHash,
        req.user.instituteId,
        req.user.instituteName
      );
      await tx.wait();
      console.log('Certificate registered on blockchain:', tx.hash);
    } catch (blockchainError) {
      console.error('Blockchain error:', blockchainError);
      // Rollback certificate if blockchain fails
      if (success && db) {
        await db.collection('certificates').deleteOne({ id });
      } else if (success && !db) {
        const certificates = readFromFile(certificatesPath);
        const filtered = certificates.filter(c => c.id !== id);
        writeToFile(certificatesPath, filtered);
      }
      return res.status(500).json({ 
        error: 'Failed to register certificate on blockchain. Please ensure blockchain is running: ' + blockchainError.message 
      });
    }
    
    if (success) {
      res.status(201).json({
        message: 'Certificate stored successfully',
        certificateHash,
        certificate: {
          id,
          studentName,
          institution,
          createdAt: certificate.createdAt
        }
      });
    } else {
      res.status(500).json({ error: 'Failed to store certificate' });
    }
  } catch (error) {
    console.error('Error storing certificate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify certificate (public endpoint)
app.post('/verify', async (req, res) => {
  try {
    const { certificateId, publicKey } = req.body;

    if (!certificateId || !publicKey) {
      return res.status(400).json({ 
        error: 'Missing required fields: certificateId, publicKey' 
      });
    }

    let certificate;

    if (db) {
      const certificates = db.collection('certificates');
      certificate = await certificates.findOne({ 
        id: certificateId, 
        publicKey: publicKey 
      });
    } else {
      const certificates = readFromFile(certificatesPath);
      certificate = certificates.find(cert => 
        cert.id === certificateId && cert.publicKey === publicKey
      );
    }

    if (!certificate) {
      return res.status(404).json({ 
        error: 'Certificate not found or invalid public key' 
      });
    }

    if (!certificate.isValid) {
      return res.status(400).json({ 
        error: 'Certificate has been revoked' 
      });
    }

    const certificateHash = hashCertificateId(certificateId, publicKey);

    res.json({
      isValid: true,
      certificateHash,
      certificate: {
        id: certificate.id,
        studentName: certificate.studentName,
        courseName: certificate.courseName,
        institution: certificate.institution,
        instituteId: certificate.instituteId,
        year: certificate.year,
        semester: certificate.semester,
        CGPA: certificate.CGPA,
        createdAt: certificate.createdAt
      }
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Revoke certificate (requires authentication)
app.delete('/certificates/:certificateId', authMiddleware, async (req, res) => {
  try {
    const { certificateId } = req.params;
    
    let certificate;
    let updateSuccess = false;
    
    if (db) {
      const certificates = db.collection('certificates');
      certificate = await certificates.findOne({ id: certificateId });
      
      if (certificate && certificate.instituteId === req.user.instituteId) {
        const result = await certificates.updateOne(
          { id: certificateId },
          { $set: { isValid: false, revokedAt: new Date().toISOString(), revokedBy: req.user.instituteId } }
        );
        updateSuccess = result.modifiedCount > 0;
      }
    } else {
      const certificates = readFromFile(certificatesPath);
      const certIndex = certificates.findIndex(cert => cert.id === certificateId);
      
      if (certIndex !== -1 && certificates[certIndex].instituteId === req.user.instituteId) {
        certificate = certificates[certIndex];
        certificates[certIndex].isValid = false;
        certificates[certIndex].revokedAt = new Date().toISOString();
        certificates[certIndex].revokedBy = req.user.instituteId;
        writeToFile(certificatesPath, certificates);
        updateSuccess = true;
      }
    }
    
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    
    if (certificate.instituteId !== req.user.instituteId) {
      return res.status(403).json({ error: 'You can only revoke certificates issued by your institute' });
    }
    
    // Revoke on blockchain - REQUIRED
    try {
      const contract = await getBlockchainContract();
      const certificateHash = hashCertificateId(certificateId, certificate.publicKey);
      const tx = await contract.revokeCertificate(certificateHash);
      await tx.wait();
      console.log('Certificate revoked on blockchain:', tx.hash);
    } catch (blockchainError) {
      console.error('Blockchain revocation error:', blockchainError);
      return res.status(500).json({ 
        error: 'Failed to revoke certificate on blockchain. Please ensure blockchain is running: ' + blockchainError.message 
      });
    }
    
    if (updateSuccess) {
      res.json({ message: 'Certificate revoked successfully' });
    } else {
      res.status(500).json({ error: 'Failed to revoke certificate' });
    }
  } catch (error) {
    console.error('Error revoking certificate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all certificates for current institute
app.get('/certificates', authMiddleware, async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    let certificates;
    
    if (db) {
      const certificatesCollection = db.collection('certificates');
      certificates = await certificatesCollection.find({ instituteId }).toArray();
    } else {
      const allCertificates = readFromFile(certificatesPath);
      certificates = allCertificates.filter(cert => cert.instituteId === instituteId);
    }
    
    res.json({ certificates });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
const startServer = async () => {
  await connectToDatabase();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Certificate Backend API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer().catch(console.error);

module.exports = app;
