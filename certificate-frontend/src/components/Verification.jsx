import { useState, useEffect } from 'react';
import { verifyCertificate } from '../blockchain/certificate'; // Import from certificate.js
import './Verification.css'; // Optional: For styling

const Verification = () => {
  const [certificateId, setCertificateId] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [verificationResult, setVerificationResult] = useState(null); // Holds verification details
  const [error, setError] = useState('');
  const [isAutoVerifying, setIsAutoVerifying] = useState(false);

  // Check for URL parameters and auto-verify on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    const keyParam = urlParams.get('key');

    if (idParam && keyParam) {
      console.log('Auto-verification triggered from URL parameters');
      setCertificateId(idParam);
      setPublicKey(keyParam);
      setIsAutoVerifying(true);
      
      // Auto-trigger verification
      autoVerify(idParam, keyParam);
    }
  }, []);

  const autoVerify = async (id, key) => {
    setError('');
    setVerificationResult(null);

    try {
      await performVerification(id, key);
    } catch (err) {
      console.error("Auto-verification failed:", err);
      setError(`Auto-verification failed: ${err.message}`);
    } finally {
      setIsAutoVerifying(false);
    }
  };

  const performVerification = async (id, key) => {
    console.log("Handling certificate verification with new flow");
    
    // Step 1: Verify with backend API and get certificate details
    console.log("Step 1: Verifying with backend API");
    const backendResponse = await fetch('https://31d857fa-1f00-4133-9edd-7f2a2c228887-00-215xdj2qeu8ir.kirk.replit.dev:3001/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        certificateId: id,
        publicKey: key
      })
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      throw new Error(errorData.error || 'Certificate not found in database');
    }

    const backendData = await backendResponse.json();
    console.log("Backend verification successful:", backendData);

    // Step 2: Verify the hash exists on blockchain
    console.log("Step 2: Verifying hash on blockchain");
    const blockchainResponse = await verifyCertificate(backendData.certificateHash);
    console.log("Blockchain verification response:", blockchainResponse);
    
    if (blockchainResponse) {
      // Handle different response formats
      let isValid, instituteName, timestamp;
      
      if (Array.isArray(blockchainResponse)) {
        // If it's an array (tuple response)
        [isValid, instituteName, timestamp] = blockchainResponse;
      } else if (typeof blockchainResponse === 'object') {
        // If it's an object
        isValid = blockchainResponse[0] || blockchainResponse.exists;
        instituteName = blockchainResponse[1] || blockchainResponse.institution;
        timestamp = blockchainResponse[2] || blockchainResponse.timestamp;
      }
      
      console.log("Parsed blockchain data:", { isValid, instituteName, timestamp });
      
      if (isValid) {
        setVerificationResult({
          message: (
            <div>
              <h4>✅ Certificate Verified Successfully!</h4>
              <div style={{ textAlign: 'left', marginTop: '15px' }}>
                <p><strong>Student Name:</strong> {backendData.certificate.studentName}</p>
                <p><strong>Course:</strong> {backendData.certificate.courseName}</p>
                <p><strong>Institution:</strong> {backendData.certificate.institution}</p>
                <p><strong>Year:</strong> {backendData.certificate.year}</p>
                <p><strong>Semester:</strong> {backendData.certificate.semester}</p>
                <p><strong>CGPA:</strong> {backendData.certificate.CGPA}</p>
                <p><strong>Institute ID:</strong> {backendData.certificate.instituteId}</p>
                <p><strong>Certificate ID:</strong> {backendData.certificate.id}</p>
                <p><strong>Issued On:</strong> {new Date(backendData.certificate.createdAt).toLocaleDateString()}</p>
                <p><strong>Blockchain Timestamp:</strong> {new Date(parseInt(timestamp) * 1000).toLocaleDateString()}</p>
                <p><strong>Certificate Hash:</strong> <code>{backendData.certificateHash}</code></p>
              </div>
            </div>
          ),
          isValid: true,
        });
      } else {
        setVerificationResult({
          message: 'Certificate hash found in database but not verified on blockchain. This may indicate tampering.',
          isValid: false,
        });
      }
    } else {
      setError("Certificate exists in database but hash not found on blockchain");
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    setError('');
    setVerificationResult(null); // Reset verification result
    
    if (!certificateId.trim() || !publicKey.trim()) {
      setError('Please provide both Certificate ID and Public Key');
      return;
    }
    
    try {
      await performVerification(certificateId, publicKey);
    } catch (err) {
      console.error("Verification failed:", err);
      setError(`Verification failed: ${err.message}`);
    }
  };  

  return (
    <div className="verification-container">
      <h2>Certificate Verification</h2>
      {isAutoVerifying ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h3>🔍 Auto-verifying certificate from QR code...</h3>
          <p>Please wait while we verify the certificate authenticity.</p>
        </div>
      ) : (
        <p>Enter the certificate ID and public key to verify authenticity using blockchain technology.</p>
      )}
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleVerification}>
        <div className="form-group">
          <label htmlFor="certificateId" style={{ marginLeft: '10px' }}>
            Certificate ID:
          </label>
          <input
            type="text"
            id="certificateId"
            value={certificateId}
            onChange={(e) => setCertificateId(e.target.value)}
            placeholder="Enter certificate unique ID"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="publicKey" style={{ marginLeft: '10px' }}>
            Institute Public Key:
          </label>
          <input
            type="text"
            id="publicKey"
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
            placeholder="Enter institute's public key"
            required
          />
        </div>
        <button type="submit">Verify Certificate</button>
      </form>

      {verificationResult && (
  <div
    className={`${verificationResult.isValid ? 'success' : 'failure'}`}
  >
    <h3>Verification Result:</h3>
    <h3 style={{color: `${verificationResult.isValid ? 'green': 'red'}`, fontSize: `${verificationResult.isValid ? '1.1rem': '1.2rem'}`}}>{verificationResult.message}</h3>
  </div>
)}

    </div>
  );
};

export default Verification;
