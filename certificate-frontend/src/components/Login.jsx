import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Updated import for navigation
import Web3 from 'web3';
import './Login.css'; // Optional: For styling

const Login = () => {
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Hook for navigation

  const handleLogin = async () => {
    setError('');

    // Check if MetaMask is installed
    if (window.ethereum) {
      try {
        // Request account access if needed
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Initialize Web3 with MetaMask's provider
        const web3 = new Web3(window.ethereum);
        
        // Get the logged-in account
        const accounts = await web3.eth.getAccounts();
        
        if (accounts.length > 0) {
          // Successful login - navigate to form page
          navigate('/form');
        } else {
          setError('No account found. Please log into MetaMask.');
        }
      } catch (err) {
        setError('MetaMask connection was declined. Please try again.');
      }
    } else {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
    }
  };

  return (
    <div className="login-container">
      <h2>Institute Login</h2>
      {error && <p className="error">{error}</p>}
      
      {/* Button to initiate MetaMask login */}
      <button onClick={handleLogin}>Login with MetaMask</button>
    </div>
  );
};

export default Login;
