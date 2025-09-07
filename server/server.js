const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://TheFirstUser:FirstPassword@cluster0.jtka6ih.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
let db;

// Initialize MongoDB connection
const connectToDatabase = async () => {
  try {
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      tls: true,
      tlsInsecure: true, // This allows insecure TLS connections
      serverApi: { version: '1', strict: false, deprecationErrors: false }
    });
    await client.connect();
    // Test the connection
    await client.db("admin").command({ ping: 1 });
    db = client.db('certificateDB');
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    
    // Fallback to file-based storage if MongoDB fails
    console.log('Falling back to file-based storage...');
    const fs = require('fs');
    const path = require('path');
    
    // Create certificates.json if it doesn't exist
    const certificatesPath = path.join(__dirname, 'certificates.json');
    if (!fs.existsSync(certificatesPath)) {
      fs.writeFileSync(certificatesPath, JSON.stringify([]), 'utf8');
    }
    
    // Set db to null to indicate we're using file storage
    db = null;
    console.log('Using file-based storage in certificates.json');
  }
};

// Helper functions
const fs = require('fs');
const path = require('path');
const certificatesPath = path.join(__dirname, 'certificates.json');

const getCertificatesCollection = () => {
  if (db) {
    return db.collection('certificates');
  }
  return null; // Using file storage
};

// File storage helper functions
const readCertificatesFromFile = () => {
  try {
    const data = fs.readFileSync(certificatesPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading certificates file:', error);
    return [];
  }
};

const writeCertificatesToFile = (certificates) => {
  try {
    fs.writeFileSync(certificatesPath, JSON.stringify(certificates, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing certificates file:', error);
    throw error;
  }
};

// Hash function for certificate ID + public key
const hashCertificateId = (certificateId, publicKey) => {
  return crypto.createHash('sha256').update(`${certificateId}:${publicKey}`).digest('hex');
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Certificate Backend API is running' });
});

// Get all certificates (for admin purposes)
app.get('/certificates', async (req, res) => {
  try {
    let allCertificates;
    
    if (db) {
      // MongoDB
      const certificates = getCertificatesCollection();
      allCertificates = await certificates.find({}).toArray();
    } else {
      // File storage
      allCertificates = readCertificatesFromFile();
    }
    
    res.json(allCertificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Store certificate data
app.post('/certificates', async (req, res) => {
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

    // Create certificate object
    const certificate = {
      id,
      studentName,
      courseName,
      institution,
      instituteId,
      year,
      semester,
      CGPA,
      publicKey,
      createdAt: new Date().toISOString(),
      isValid: true
    };

    // Generate hash for blockchain storage
    const certificateHash = hashCertificateId(id, publicKey);

    let success = false;

    if (db) {
      // MongoDB storage
      const certificates = getCertificatesCollection();
      
      // Check if certificate already exists
      const existingCert = await certificates.findOne({ id: id });
      if (existingCert) {
        return res.status(409).json({ error: 'Certificate with this ID already exists' });
      }

      // Insert into MongoDB
      const result = await certificates.insertOne(certificate);
      success = result.insertedId;
    } else {
      // File storage
      const certificates = readCertificatesFromFile();
      
      // Check if certificate already exists
      const existingCert = certificates.find(cert => cert.id === id);
      if (existingCert) {
        return res.status(409).json({ error: 'Certificate with this ID already exists' });
      }

      // Add to file
      certificates.push(certificate);
      writeCertificatesToFile(certificates);
      success = true;
    }
    
    if (success) {
      res.status(201).json({
        message: 'Certificate stored successfully',
        certificateHash, // This hash should be stored on blockchain
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

// Verify certificate
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
      // MongoDB storage
      const certificates = getCertificatesCollection();
      certificate = await certificates.findOne({ 
        id: certificateId, 
        publicKey: publicKey 
      });
    } else {
      // File storage
      const certificates = readCertificatesFromFile();
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

    // Generate hash for blockchain verification
    const certificateHash = hashCertificateId(certificateId, publicKey);

    // Return certificate data (this would be called after blockchain verification)
    res.json({
      isValid: true,
      certificateHash, // This should match the hash stored on blockchain
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

// Get certificate hash for blockchain storage
app.get('/hash/:certificateId/:publicKey', (req, res) => {
  try {
    const { certificateId, publicKey } = req.params;
    const hash = hashCertificateId(certificateId, publicKey);
    res.json({ certificateHash: hash });
  } catch (error) {
    console.error('Error generating hash:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
const startServer = async () => {
  await connectToDatabase();
  app.listen(PORT, 'localhost', () => {
    console.log(`Certificate Backend API running on http://localhost:${PORT}`);
  });
};

startServer().catch(console.error);

module.exports = app;