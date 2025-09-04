const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database file path
const DB_FILE = path.join(__dirname, 'certificates.json');

// Initialize database file if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// Helper functions
const readDatabase = () => {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return [];
  }
};

const writeDatabase = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing database:', error);
    return false;
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
app.get('/certificates', (req, res) => {
  const certificates = readDatabase();
  res.json(certificates);
});

// Store certificate data
app.post('/certificates', (req, res) => {
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

    const certificates = readDatabase();
    
    // Check if certificate already exists
    const existingCert = certificates.find(cert => cert.id === id);
    if (existingCert) {
      return res.status(409).json({ error: 'Certificate with this ID already exists' });
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

    certificates.push(certificate);
    
    if (writeDatabase(certificates)) {
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
app.post('/verify', (req, res) => {
  try {
    const { certificateId, publicKey } = req.body;

    if (!certificateId || !publicKey) {
      return res.status(400).json({ 
        error: 'Missing required fields: certificateId, publicKey' 
      });
    }

    const certificates = readDatabase();
    
    // Find certificate by ID and public key
    const certificate = certificates.find(cert => 
      cert.id === certificateId && cert.publicKey === publicKey
    );

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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Certificate Backend API running on http://0.0.0.0:${PORT}`);
});

module.exports = app;