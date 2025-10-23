import { useNavigate } from 'react-router-dom';
import "./BigText.css"

const BigText = () => {
  const navigate = useNavigate();

  return (
    <div className="hero-container">
      <div className="hero-text">
        <h1>Secure. Transparent. Verified – Certificates for the <span className="highlight">Future</span></h1>
        <p className="sub-text">Empowering institutions with blockchain-driven certificate issuance and verification – secure, immutable, and future-ready.</p>
      </div>
      
      <div className="action-cards">
        <div className="action-card">
          <h2>Institute Login</h2>
          <p>Login to manage certificates and unique IDs</p>
          <button onClick={() => navigate('/auth')} className="action-button">
            Login/Register
          </button>
        </div>
        
        <div className="action-card">
          <h2>Verification Page</h2>
          <p>Verify the authenticity of a certificate</p>
          <button onClick={() => navigate('/verify')} className="action-button">
            Go to Verification Page
          </button>
        </div>
      </div>
    </div>
  );
}

export default BigText;
