// src/AuthContext.js
import { createContext, useEffect, useState } from 'react';
import Web3 from 'web3';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if MetaMask is connected and update authentication state
    const checkMetaMaskConnection = async () => {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        const accounts = await web3.eth.getAccounts();
        setIsAuthenticated(accounts.length > 0);
      }
    };
    checkMetaMaskConnection();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
