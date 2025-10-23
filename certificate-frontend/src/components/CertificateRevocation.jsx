import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './CertificateRevocation.css';

const CertificateRevocation = () => {
  const { token } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/certificates`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch certificates');
      }

      const data = await response.json();
      setCertificates(data.certificates || []);
    } catch (err) {
      console.error('Error fetching certificates:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [token]);

  const revokeCertificate = async (certificateId) => {
    if (!confirm(`Are you sure you want to revoke certificate ${certificateId}? This action cannot be undone.`)) {
      return;
    }

    setError('');
    setSuccessMessage('');

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/certificates/${certificateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to revoke certificate');
      }

      setSuccessMessage(`Certificate ${certificateId} has been revoked successfully`);
      await fetchCertificates();
    } catch (err) {
      console.error('Error revoking certificate:', err);
      setError(err.message);
    }
  };

  const filteredCertificates = certificates.filter(cert =>
    cert.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.courseName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="certificate-revocation">
      <h2>Certificate Revocation</h2>
      <p className="section-description">
        View and revoke certificates issued by your institute
      </p>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="search-box">
        <input
          type="text"
          placeholder="🔍 Search by certificate ID, student name, or course..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <p className="loading-message">Loading certificates...</p>
      ) : (
        <div className="certificates-list">
          <p className="results-count">
            Showing {filteredCertificates.length} of {certificates.length} certificates
          </p>
          
          {filteredCertificates.length === 0 ? (
            <p className="no-data">
              {searchTerm ? 'No certificates match your search' : 'No certificates issued yet'}
            </p>
          ) : (
            <div className="certificates-table-container">
              <table className="certificates-table">
                <thead>
                  <tr>
                    <th>Certificate ID</th>
                    <th>Student Name</th>
                    <th>Course</th>
                    <th>Year/Sem</th>
                    <th>CGPA</th>
                    <th>Issued Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCertificates.map((cert) => (
                    <tr key={cert.id} className={!cert.isValid ? 'revoked-row' : ''}>
                      <td><code>{cert.id}</code></td>
                      <td>{cert.studentName}</td>
                      <td>{cert.courseName}</td>
                      <td>{cert.year}/{cert.semester}</td>
                      <td>{cert.CGPA}</td>
                      <td>{new Date(cert.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge ${cert.isValid ? 'valid' : 'revoked'}`}>
                          {cert.isValid ? 'Valid' : 'Revoked'}
                        </span>
                      </td>
                      <td>
                        {cert.isValid ? (
                          <button
                            onClick={() => revokeCertificate(cert.id)}
                            className="revoke-button"
                          >
                            Revoke
                          </button>
                        ) : (
                          <span className="revoked-text">
                            Revoked on {new Date(cert.revokedAt).toLocaleDateString()}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CertificateRevocation;
