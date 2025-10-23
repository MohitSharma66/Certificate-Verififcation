import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import QRCode from 'qrcode';
import './CertificateIssuance.css';

const CertificateIssuance = () => {
  const { user, token } = useAuth();
  const [formData, setFormData] = useState({
    studentName: '',
    year: '',
    semester: '',
    studentUniqueId: '',
    course: '',
    CGPA: '',
    publicKey: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [loading, setLoading] = useState(false);

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
    setLoading(true);

    const { studentName, year, semester, studentUniqueId, CGPA, publicKey, course } = formData;

    if (!/^[a-zA-Z\s]+$/.test(studentName)) {
      setError('Student Name must only contain alphabets and spaces.');
      setLoading(false);
      return;
    }
    if (!/^\d+$/.test(year) || !/^\d+$/.test(semester) || !/^\d+$/.test(studentUniqueId)) {
      setError('Year, Semester, and Certificate Unique ID must be numerical.');
      setLoading(false);
      return;
    }
    if (!/^\d+(\.\d+)?$/.test(CGPA)) {
      setError('CGPA must be a valid decimal number.');
      setLoading(false);
      return;
    }
    if (!publicKey.trim()) {
      setError('Public Key is required.');
      setLoading(false);
      return;
    }

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      if (!apiBaseUrl) {
        throw new Error('API base URL not configured.');
      }

      const response = await fetch(`${apiBaseUrl}/certificates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: studentUniqueId,
          studentName,
          courseName: course,
          institution: user.instituteName,
          instituteId: user.instituteId,
          year: parseInt(year),
          semester: parseInt(semester),
          CGPA,
          publicKey
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to store certificate data');
      }

      const backendData = await response.json();
      console.log('Certificate stored:', backendData);

      const baseUrl = import.meta.env.VITE_BASE_URL;
      if (!baseUrl) {
        throw new Error('Base URL not configured.');
      }
      
      const verifyUrl = `${baseUrl}/verify?id=${studentUniqueId}&key=${encodeURIComponent(publicKey)}`;
      setVerificationUrl(verifyUrl);

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

      setFormData({
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="certificate-issuance">
      <h2>Issue New Certificate</h2>
      <p className="section-description">
        Fill in the student details to issue a blockchain-verified certificate
      </p>

      {error && <div className="error-message">{error}</div>}
      {successMessage && (
        <div className="success-message">
          <h3>{successMessage}</h3>
          {qrCodeUrl && (
            <div className="qr-section">
              <h4>📱 QR Code for Certificate Verification</h4>
              <div className="qr-image-container">
                <img src={qrCodeUrl} alt="QR Code for Certificate Verification" />
              </div>
              <p className="qr-hint">Scan this QR code to automatically verify the certificate</p>
              <div className="verification-url-box">
                <strong>Verification URL:</strong><br />
                <a href={verificationUrl} target="_blank" rel="noopener noreferrer">
                  {verificationUrl}
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="issuance-form">
        <div className="form-row">
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
        </div>

        <div className="form-row">
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
        </div>

        <div className="form-row">
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
        </div>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Issuing Certificate...' : 'Issue Certificate'}
        </button>
      </form>
    </div>
  );
};

export default CertificateIssuance;
