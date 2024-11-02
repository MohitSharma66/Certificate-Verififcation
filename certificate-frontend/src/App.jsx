import React, { useContext } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import { AuthContext, AuthProvider } from './components/AuthContext';
import Form from './components/Form';
import Login from './components/Login';
import Verification from './components/Verification';

// ProtectedRoute component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/form"
            element={
              <ProtectedRoute>
                <Form />
              </ProtectedRoute>
            }
          />
          <Route path="/verification" element={<Verification />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
