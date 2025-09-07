const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { Client } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
let db;

// Initialize PostgreSQL connection
const connectToDatabase = async () => {
  try {
    db = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    await db.connect();
    console.log('Connected to PostgreSQL successfully');
    
    // Create certificates table if it doesn't exist
    await initializeDatabase();
  } catch (error) {
    console.error('Error connecting to PostgreSQL:', error);
    process.exit(1);
  }
};

// Initialize database schema
const initializeDatabase = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS certificates (
      id VARCHAR(255) PRIMARY KEY,
      student_name VARCHAR(255) NOT NULL,
      course_name VARCHAR(255) NOT NULL,
      institution VARCHAR(255) NOT NULL,
      institute_id VARCHAR(255),
      year INTEGER,
      semester VARCHAR(50),
      cgpa DECIMAL(4,2),
      public_key TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_valid BOOLEAN DEFAULT true
    );
  `;
  
  try {
    await db.query(createTableQuery);
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error creating database schema:', error);
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
    const result = await db.query('SELECT * FROM certificates ORDER BY created_at DESC');
    res.json(result.rows);
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
    
    // Check if certificate already exists
    const existingCert = await db.query('SELECT id FROM certificates WHERE id = $1', [id]);
    if (existingCert.rows.length > 0) {
      return res.status(409).json({ error: 'Certificate with this ID already exists' });
    }

    // Generate hash for blockchain storage
    const certificateHash = hashCertificateId(id, publicKey);

    // Insert into PostgreSQL
    const insertQuery = `
      INSERT INTO certificates (id, student_name, course_name, institution, institute_id, year, semester, cgpa, public_key)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, student_name, institution, created_at
    `;
    
    const result = await db.query(insertQuery, [
      id, studentName, courseName, institution, instituteId, year, semester, CGPA, publicKey
    ]);
    
    if (result.rows.length > 0) {
      const insertedCert = result.rows[0];
      res.status(201).json({
        message: 'Certificate stored successfully',
        certificateHash, // This hash should be stored on blockchain
        certificate: {
          id: insertedCert.id,
          studentName: insertedCert.student_name,
          institution: insertedCert.institution,
          createdAt: insertedCert.created_at
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
    
    // Find certificate by ID and public key
    const result = await db.query(
      'SELECT * FROM certificates WHERE id = $1 AND public_key = $2',
      [certificateId, publicKey]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Certificate not found or invalid public key' 
      });
    }

    const certificate = result.rows[0];

    if (!certificate.is_valid) {
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
        studentName: certificate.student_name,
        courseName: certificate.course_name,
        institution: certificate.institution,
        instituteId: certificate.institute_id,
        year: certificate.year,
        semester: certificate.semester,
        CGPA: certificate.cgpa,
        createdAt: certificate.created_at
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