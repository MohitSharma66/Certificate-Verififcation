// src/AuthContext.jsx
import { createContext, useEffect, useState } from 'react';
import Web3 from 'web3';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check MetaMask connection when the app loads
  useEffect(() => {
    const checkMetaMaskConnection = async () => {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        const accounts = await web3.eth.getAccounts();
        setIsAuthenticated(accounts.length > 0);
      }
      setLoading(false);
    };
    checkMetaMaskConnection();
  }, []);

  // Function to log in via MetaMask and update isAuthenticated
  const login = async () => {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.requestAccounts();
      if (accounts.length > 0) {
        setIsAuthenticated(true); // Update authentication state
      }
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <AuthContext.Provider value={{ isAuthenticated, login }}>
      {children}
    </AuthContext.Provider>
  );
};
