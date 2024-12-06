import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import './Login.css';
import BigText from "./BigText"

const Login = () => {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    setError('');

    // Check if MetaMask is installed
    if (window.ethereum) {
      try {
        // Request MetaMask login
        await login();
        
        // Navigate to form page upon successful login
        navigate('/form');
      } catch (err) {
        setError('MetaMask connection was declined. Please try again.');
      }
    } else {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
    }
  };

  return (
    <>
    <BigText/>
    <div className="login-container">
      <h2>Institute Login</h2>
      {error && <p className="error">{error}</p>}
      <button id="login_btn" onClick={handleLogin}>Login with MetaMask</button>
    </div>
    </>
  );
};

export default Login;
