import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { connectMetaMask, registerInstituteOnBlockchain } from '../blockchain/institute';
import './AuthPage.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    instituteId: '',
    instituteName: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
    setStatus('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('');
    setLoading(true);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      if (!apiBaseUrl) {
        throw new Error('API base URL not configured');
      }

      if (isLogin) {
        const response = await fetch(`${apiBaseUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instituteId: formData.instituteId,
            password: formData.password
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Login failed');
        }

        login(data.token, data.institute);
        navigate('/dashboard');
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        if (formData.password.length < 8) {
          throw new Error('Password must be at least 8 characters long');
        }

        setStatus('Connecting to MetaMask...');
        const walletInfo = await connectMetaMask();
        
        setStatus('Registering on blockchain...');
        const credentialHash = `${formData.instituteId}:${Date.now()}`;
        const blockchainResult = await registerInstituteOnBlockchain(
          formData.instituteId,
          formData.instituteName,
          credentialHash
        );

        setStatus('Completing registration...');
        const response = await fetch(`${apiBaseUrl}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instituteId: formData.instituteId,
            instituteName: formData.instituteName,
            password: formData.password,
            blockchainTxHash: blockchainResult.transactionHash,
            walletAddress: walletInfo.account
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Registration failed');
        }

        alert(`Registration successful!\n\nBlockchain TX: ${blockchainResult.transactionHash}\n\nPlease log in.`);
        setIsLogin(true);
        setFormData({
          instituteId: '',
          instituteName: '',
          password: '',
          confirmPassword: ''
        });
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message);
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{isLogin ? 'Institute Login' : 'Institute Registration'}</h2>
        <p className="auth-subtitle">
          {isLogin 
            ? 'Login to manage certificates and unique IDs' 
            : 'Register your institute to start issuing certificates'}
        </p>
        
        {error && <div className="error-message">{error}</div>}
        {status && <div className="status-message">{status}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="instituteId">Institute ID:</label>
            <input
              type="text"
              id="instituteId"
              name="instituteId"
              value={formData.instituteId}
              onChange={handleChange}
              placeholder="Enter your institute ID"
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="instituteName">Institute Name:</label>
              <input
                type="text"
                id="instituteName"
                name="instituteName"
                value={formData.instituteName}
                onChange={handleChange}
                placeholder="Enter your institute name"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password (min 8 characters)"
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password:</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
            </div>
          )}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? (
            <p>
              Don&apos;t have an account?{' '}
              <button 
                type="button" 
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                  setFormData({
                    instituteId: '',
                    instituteName: '',
                    password: '',
                    confirmPassword: ''
                  });
                }}
                className="toggle-link"
              >
                Register here
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button 
                type="button" 
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                  setFormData({
                    instituteId: '',
                    instituteName: '',
                    password: '',
                    confirmPassword: ''
                  });
                }}
                className="toggle-link"
              >
                Login here
              </button>
            </p>
          )}
        </div>

        <div className="back-link">
          <button onClick={() => navigate('/')} className="link-button">
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
