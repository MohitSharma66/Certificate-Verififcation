# Multi-Institution Authentication System

This blockchain-based certificate verification system now supports multiple institutions with secure authentication and comprehensive certificate management.

## 🎯 Key Features

### Authentication System
- **Traditional Login/Register**: Replace MetaMask with institute ID and password-based authentication
- **Dual Verification**: Every login is verified against both MongoDB AND blockchain ledger
- **Secure Password Storage**: Bcrypt hashing with 12 salt rounds
- **JWT Token Authentication**: Secure session management with 24-hour token expiration
- **Blockchain Credential Verification**: Credential hashes stored immutably on-chain

### Institute Dashboard
After login, institutes have access to three main sections:

#### 1. 📜 Certificate Issuance
- Issue blockchain-verified certificates for students
- Generate QR codes for easy verification
- Automatic hash storage on blockchain
- Track all issued certificates

#### 2. 🔑 Unique ID Generation
- Generate blockchain-backed unique identifiers
- Each ID is recorded on the blockchain ledger
- View all generated IDs with timestamps
- Copy IDs to clipboard for easy use

#### 3. ❌ Certificate Revocation
- View all certificates issued by your institute
- Search by certificate ID, student name, or course
- Revoke certificates (marks as invalid on blockchain)
- Track revocation status and dates

## 🚀 Getting Started

### For Institutes

1. **Registration**
   - Go to the homepage
   - Click "Institute Login" → "Register here"
   - Enter your institute ID, name, and password (min 8 characters)
   - System registers you on blockchain AND database

2. **Login**
   - Enter your institute ID and password
   - System performs dual verification (database + blockchain)
   - Get access to your dashboard

3. **Issue Certificates**
   - Navigate to "Certificate Issuance" tab
   - Fill in student details
   - System generates certificate hash and stores on blockchain
   - Get QR code for verification

4. **Generate Unique IDs**
   - Navigate to "Unique ID Generation" tab
   - Click "Generate New Unique ID"
   - ID is recorded on blockchain ledger
   - Use these IDs for certificate issuance

5. **Revoke Certificates**
   - Navigate to "Certificate Revocation" tab
   - Search for certificate to revoke
   - Click "Revoke" button
   - Certificate marked as invalid on blockchain

### For Students/Verifiers

The verification page remains unchanged:
- Go to "Verification Page" from homepage
- Enter certificate ID and institute public key
- System verifies against database and blockchain

## 🔐 Security Features

1. **Password Security**
   - Bcrypt hashing with salt rounds
   - Passwords never stored in plain text
   - Minimum 8 character requirement

2. **Blockchain Verification**
   - Credential hashes stored on Ethereum blockchain
   - Dual verification on every login
   - Immutable audit trail

3. **JWT Authentication**
   - Secure token-based sessions
   - 24-hour expiration
   - Protected API endpoints

4. **Transaction Rollback**
   - If blockchain operations fail, database changes are rolled back
   - Ensures data consistency

## 📡 API Endpoints

### Authentication
- `POST /auth/register` - Register new institute
- `POST /auth/login` - Login with dual verification
- `GET /auth/me` - Get current institute info (requires auth)

### Unique IDs
- `POST /unique-id/generate` - Generate new unique ID (requires auth)
- `GET /unique-id/list` - List all unique IDs for institute (requires auth)

### Certificates
- `POST /certificates` - Issue new certificate (requires auth)
- `GET /certificates` - List institute's certificates (requires auth)
- `DELETE /certificates/:id` - Revoke certificate (requires auth)
- `POST /verify` - Verify certificate (public)

## 🏗️ Architecture

### Smart Contract (InstituteRegistry.sol)
- `registerInstitute()` - Stores institute credentials on blockchain
- `verifyInstituteCredentials()` - Verifies credentials during login
- `generateUniqueId()` - Records unique ID on ledger
- `issueCertificate()` - Stores certificate hash
- `revokeCertificate()` - Marks certificate as invalid
- `getInstituteInfo()` - Retrieve institute statistics

### Backend (Node.js/Express)
- Dual-layer authentication (MongoDB + Blockchain)
- JWT token generation and validation
- Bcrypt password hashing
- Ethers.js for blockchain interaction
- File-based fallback for development

### Frontend (React)
- React Context for authentication state
- Protected routes with authentication guards
- Three-tab dashboard interface
- QR code generation
- Real-time certificate status

## 🛠️ Setup Requirements

### Blockchain Setup
**IMPORTANT**: To use blockchain features, you need:

1. **Deploy the InstituteRegistry Contract**
   ```bash
   truffle migrate --network development
   ```

2. **Start Ganache** (if using local blockchain)
   - Make sure Ganache is running on `http://127.0.0.1:7545`
   - Network ID should be `5777`

### Environment Variables
Create a `.env` file in the server directory:

```env
# Optional: MongoDB connection (falls back to file storage)
MONGODB_URI=mongodb+srv://...

# Production settings
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.com
JWT_SECRET=your-super-secret-jwt-key
BLOCKCHAIN_PRIVATE_KEY=0x...
```

## ⚠️ Important Notes

1. **Blockchain Dependency**: All critical operations (register, login, certificate issuance, revocation) require blockchain connectivity. If the blockchain is not available, these operations will fail with clear error messages.

2. **Network ID**: The backend uses Truffle's network ID format. Make sure your blockchain network ID matches the deployed contract networks.

3. **File-Based Storage**: In development mode without MongoDB, the system falls back to file-based storage (JSON files) for institutes, certificates, and unique IDs.

4. **Security in Production**:
   - Change the default JWT_SECRET
   - Use a secure blockchain private key
   - Enable HTTPS
   - Set proper CORS origins

## 📊 Data Flow

### Registration Flow
1. User submits institute ID, name, password
2. Backend validates inputs
3. Password hashed with bcrypt
4. Credential hash generated (instituteId:passwordHash)
5. Blockchain transaction: Store credential hash
6. Database: Store institute info with password hash
7. If blockchain fails, database entry is rolled back

### Login Flow
1. User submits institute ID and password
2. Backend checks database for institute
3. Bcrypt compares password with stored hash
4. Generate credential hash from stored password hash
5. Blockchain verification: Check if credential hash matches
6. If both verifications pass, generate JWT token
7. Return token to frontend for session management

### Certificate Issuance Flow
1. Institute submits student details (must be authenticated)
2. Backend generates certificate hash
3. Blockchain transaction: Store certificate hash with institute ID
4. Database: Store certificate details
5. If blockchain fails, database entry is rolled back
6. Return QR code and verification URL

## 🎨 User Interface

### Home Page
- Beautiful gradient background
- Two action cards: Institute Login and Verification Page

### Authentication Page
- Toggle between Login and Register
- Form validation
- Error handling with clear messages
- Back to home button

### Dashboard
- Header with institute info and logout button
- Three tabs for different operations
- Clean, modern design
- Responsive layout

### Tab Sections
- Certificate Issuance: Form with validation and QR code generation
- Unique ID Generation: Simple button with list of generated IDs
- Certificate Revocation: Searchable table with revoke actions

## 🔄 Migration from Old System

The old MetaMask-based login has been completely replaced. The verification page for students remains the same and is backward compatible with previously issued certificates.

## 📝 Next Steps

1. Deploy the InstituteRegistry smart contract to your blockchain
2. Configure environment variables
3. Test the registration and login flow
4. Issue test certificates
5. Verify certificates using the verification page
6. Ready for production deployment!
