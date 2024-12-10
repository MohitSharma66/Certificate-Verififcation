import { useState } from 'react';
import { verifyCertificate } from '../blockchain/certificate'; // Import from certificate.js
import './Verification.css'; // Optional: For styling

const Verification = () => {
  const [certificateId, setCertificateId] = useState('');
  const [verificationResult, setVerificationResult] = useState(null); // Changed to null to handle both valid and invalid cases
  const [error, setError] = useState('');

  const handleVerification = async (e) => {
    e.preventDefault();
    setError('');
    setVerificationResult(null); // Reset verification result

    try {
      // Call the verifyCertificate function from blockchain
      const isValid = await verifyCertificate(certificateId);

      setVerificationResult(isValid); // Set the validity status
    } catch (err) {
      setError('Verification failed. Please try again.');
    }
  };

  return (
    <div className="verification-container">
      <h2>Certificate Verification</h2>
      <p>Enter the certificate ID to verify its authenticity.</p>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleVerification}>
        <div className="form-group">
          <label htmlFor="certificateId" style={{ marginLeft: '10px' }}>Certificate ID:</label>
          <input
            type="text"
            id="certificateId"
            value={certificateId}
            onChange={(e) => setCertificateId(e.target.value)}
            required
          />
        </div>
        <button type="submit">Verify Certificate</button>
      </form>

      {verificationResult ? (
        <div className="verification-result">
          <h3>Verification Result:</h3>
          <p>
              Certificate is Valid and exists on the BlockChain
          </p>
        </div>) : (
          <div className="failure">
            <h3>Verification Result:</h3>
            <p>
              Certificate is Invalid or not issued by authorized institution
            </p>
          </div>
        )}
    </div>
  );
};

export default Verification;
