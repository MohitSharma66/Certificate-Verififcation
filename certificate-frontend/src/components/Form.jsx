import { useState } from 'react';
import { issueCertificate } from '../blockchain/certificate'; // Import from certificate.js
import QRCode from 'qrcode';
import './Form.css'; // Optional: For styling

const Form = () => {
  const [formData, setFormData] = useState({
    instituteName: '',
    instituteId: '',
    studentName: '',
    year: '',
    semester: '',
    studentUniqueId: '',
    course: '',
    CGPA: '',
    publicKey: '',
  }); 
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setQrCodeUrl('');
    setVerificationUrl('');

    const { instituteName, studentName, year, semester, studentUniqueId, instituteId, CGPA, publicKey } = formData;

    // Validate fields
    if (!/^[a-zA-Z\s]+$/.test(instituteName)) {
      setError('Institute Name must only contain alphabets and spaces.');
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(studentName)) {
      setError('Student Name must only contain alphabets and spaces.');
      return;
    }
    if (!/^\d+$/.test(year) || !/^\d+$/.test(semester) || !/^\d+$/.test(instituteId) || !/^\d+$/.test(studentUniqueId)) {
      setError('Year, Semester, Institute ID, and Certificate Unique ID must be numerical.');
      return;
    }
    if (!/^\d+(\.\d+)?$/.test(CGPA)) {
      setError('CGPA must be a valid decimal number.');
      return;
    }
    if (!publicKey.trim()) {
      setError('Public Key is required.');
      return;
    }

    try {
      // First, store certificate data in backend database
      const backendResponse = await fetch('https://31d857fa-1f00-4133-9edd-7f2a2c228887-00-215xdj2qeu8ir.kirk.replit.dev:3001/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: formData.studentUniqueId,
          studentName: formData.studentName,
          courseName: formData.course,
          institution: formData.instituteName,
          instituteId: parseInt(formData.instituteId),
          year: parseInt(formData.year),
          semester: parseInt(formData.semester),
          CGPA: formData.CGPA,
          publicKey: formData.publicKey
        })
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json();
        throw new Error(errorData.error || 'Failed to store certificate data');
      }

      const backendData = await backendResponse.json();
      console.log('Certificate stored in database:', backendData);

      // Then store the hash on blockchain using the updated contract
      await issueCertificate(
        backendData.certificateHash,  // The hash from backend
        formData.instituteName        // Institute name
      );         

      // Generate verification URL with certificate ID and public key
      const currentUrl = window.location.origin;
      const verifyUrl = `${currentUrl}/verify?id=${formData.studentUniqueId}&key=${encodeURIComponent(formData.publicKey)}`;
      setVerificationUrl(verifyUrl);

      // Generate QR code for the verification URL
      try {
        const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(qrDataUrl);
      } catch (qrError) {
        console.error('Error generating QR code:', qrError);
      }

      setSuccessMessage(`Certificate issued successfully! Certificate Hash: ${backendData.certificateHash}`);

      // Reset form after successful submission
      setFormData({
        instituteName: '',
        instituteId: '',
        studentName: '',
        year: '',
        semester: '',
        studentUniqueId: '',
        course: '',
        CGPA: '',
        publicKey: ''
      });
    } catch (err) {
      setError(`Failed to submit certificate information. Error: ${err.message || err}`);
      console.error(err);
    }
  };

  return (
    <div className="form-container">
      <h2>Certificate Issuance Form</h2>
      {error && <h3 className="error">{error}</h3>}
      {successMessage && (
        <div className="success">
          <h3>{successMessage}</h3>
          {qrCodeUrl && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <h4>📱 QR Code for Certificate Verification</h4>
              <div style={{ background: 'white', padding: '15px', display: 'inline-block', borderRadius: '8px' }}>
                <img src={qrCodeUrl} alt="QR Code for Certificate Verification" style={{ display: 'block' }} />
              </div>
              <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                Scan this QR code to automatically verify the certificate
              </p>
              <div style={{ marginTop: '15px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
                <strong>Verification URL:</strong><br />
                <a href={verificationUrl} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all', fontSize: '12px' }}>
                  {verificationUrl}
                </a>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="two-parts">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="instituteName">Institute Name:</label>
          <input
            type="text"
            id="instituteName"
            name="instituteName"
            value={formData.instituteName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="instituteId">Institute ID:</label>
          <input
            type="number"
            id="instituteId"
            name="instituteId"
            value={formData.instituteId}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="studentName">Student Name:</label>
          <input
            type="text"
            id="studentName"
            name="studentName"
            value={formData.studentName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="year">Year:</label>
          <input
            type="number"
            id="year"
            name="year"
            value={formData.year}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="semester">Semester:</label>
          <input
            type="number"
            id="semester"
            name="semester"
            value={formData.semester}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="studentUniqueId">Certificate Unique ID:</label>
          <input
            type="number"
            id="studentUniqueId"
            name="studentUniqueId"
            value={formData.studentUniqueId}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="course">Department:</label>
          <input
            type="text"
            id="course"
            name="course"
            value={formData.course}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="CGPA">CGPA:</label>
          <input
            type="text"
            id="CGPA"
            name="CGPA"
            value={formData.CGPA}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="publicKey">Institute Public Key:</label>
          <input
            type="text"
            id="publicKey"
            name="publicKey"
            value={formData.publicKey}
            onChange={handleChange}
            placeholder="Enter institute's public key for verification"
            required
          />
        </div>
        <button type="submit">Submit Certificate Information</button>
      </form>
      </div>
    </div>
  );
};

export default Form;
