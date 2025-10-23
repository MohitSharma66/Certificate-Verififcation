import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './UniqueIdGeneration.css';

const UniqueIdGeneration = () => {
  const { token } = useAuth();
  const [uniqueIds, setUniqueIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchUniqueIds = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/unique-id/list`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch unique IDs');
      }

      const data = await response.json();
      setUniqueIds(data.uniqueIds || []);
    } catch (err) {
      console.error('Error fetching unique IDs:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchUniqueIds();
  }, [token]);

  const generateNewId = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/unique-id/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate unique ID');
      }

      const data = await response.json();
      setSuccessMessage(`Unique ID generated successfully: ${data.uniqueId}`);
      
      await fetchUniqueIds();
    } catch (err) {
      console.error('Error generating unique ID:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Unique ID copied to clipboard!');
  };

  return (
    <div className="unique-id-generation">
      <h2>Unique ID Generation</h2>
      <p className="section-description">
        Generate blockchain-backed unique identifiers for certificates
      </p>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <button 
        onClick={generateNewId} 
        className="generate-button"
        disabled={loading}
      >
        {loading ? 'Generating...' : '🔑 Generate New Unique ID'}
      </button>

      <div className="unique-ids-list">
        <h3>Generated Unique IDs ({uniqueIds.length})</h3>
        {uniqueIds.length === 0 ? (
          <p className="no-data">No unique IDs generated yet. Click the button above to generate one.</p>
        ) : (
          <div className="ids-grid">
            {uniqueIds.map((item, index) => (
              <div key={index} className="id-card">
                <div className="id-header">
                  <span className="id-number">#{uniqueIds.length - index}</span>
                  <span className="id-date">
                    {new Date(item.generatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="id-value">
                  <code>{item.uniqueId}</code>
                  <button 
                    onClick={() => copyToClipboard(item.uniqueId)}
                    className="copy-button"
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                </div>
                <div className="id-status">
                  <span className={`status-badge ${item.isActive ? 'active' : 'inactive'}`}>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UniqueIdGeneration;
