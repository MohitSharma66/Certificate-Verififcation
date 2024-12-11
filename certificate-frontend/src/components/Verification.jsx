import { useState } from 'react';
import { verifyCertificate } from '../blockchain/certificate'; // Import from certificate.js
import './Verification.css'; // Optional: For styling

const Verification = () => {
  const [certificateId, setCertificateId] = useState('');
  const [verificationResult, setVerificationResult] = useState(null); // Holds verification details
  const [error, setError] = useState('');

  const handleVerification = async (e) => {
    e.preventDefault();
    setError('');
    setVerificationResult(null); // Reset verification result
    
    console.log("Handling certificate verification"); // Check if function is being called
    
    try {
      console.log("Submitting Certificate ID for verification:", certificateId); // Log the ID being submitted
      
      const id = parseInt(certificateId); // Ensure the certificate ID is an integer
      console.log("Parsed Certificate ID:", id); // Log the parsed ID
      
      // Call verifyCertificate from blockchain
      const response = await verifyCertificate(id);
      console.log("Verification Response:", response); // Log the full response from the contract
  
      if (response) {
        // Access properties of the response object directly
        const isValid = response[0];  // Boolean value for validity
        const studentName = response[1];  // Student's name
        const institution = response[2];  // Institution name
        const certificateId = response[3];  // Certificate ID
  
        console.log("isValid:", isValid, "studentName:", studentName, "institution:", institution, "certificateId:", certificateId); // Log the extracted data
  
        if (isValid) {
          setVerificationResult({
            message: (
              <pre>
                {`Certificate is valid and issued under:
  Student: ${studentName}
  Institution: ${institution}
  Certificate ID: ${certificateId}.`}
              </pre>
            ),
            isValid,
          });
                   
        } else {
          setVerificationResult({
            message: 'Certificate is invalid or not issued by an authorized institution.',
            isValid,
          });
        }
      } else {
        setError("No certificate data returned");
      }
    } catch (err) {
      console.error("Verification failed:", err);
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
          <label htmlFor="certificateId" style={{ marginLeft: '10px' }}>
            Certificate ID:
          </label>
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

      {verificationResult && (
  <div
    className={`${verificationResult.isValid ? 'success' : 'failure'}`}
  >
    <h3>Verification Result:</h3>
    <p>{verificationResult.message}</p>
  </div>
)}

    </div>
  );
};

export default Verification;
