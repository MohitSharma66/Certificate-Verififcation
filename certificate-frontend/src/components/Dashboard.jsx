import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CertificateIssuance from './CertificateIssuance';
import UniqueIdGeneration from './UniqueIdGeneration';
import CertificateRevocation from './CertificateRevocation';
import './Dashboard.css';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('issuance');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Institute Dashboard</h1>
          <div className="user-info">
            <span className="institute-name">{user?.instituteName}</span>
            <span className="institute-id">ID: {user?.instituteId}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-body">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'issuance' ? 'active' : ''}`}
            onClick={() => setActiveTab('issuance')}
          >
            📜 Certificate Issuance
          </button>
          <button
            className={`tab ${activeTab === 'uniqueid' ? 'active' : ''}`}
            onClick={() => setActiveTab('uniqueid')}
          >
            🔑 Unique ID Generation
          </button>
          <button
            className={`tab ${activeTab === 'revocation' ? 'active' : ''}`}
            onClick={() => setActiveTab('revocation')}
          >
            ❌ Certificate Revocation
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'issuance' && <CertificateIssuance />}
          {activeTab === 'uniqueid' && <UniqueIdGeneration />}
          {activeTab === 'revocation' && <CertificateRevocation />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
