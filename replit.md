# Overview

This is a blockchain-based certificate verification system that enables educational institutions to issue tamper-proof digital certificates and allows users to verify their authenticity. The system consists of three main components: Ethereum smart contracts for certificate storage, a React frontend for user interaction, and a Node.js backend API for certificate management.

The application leverages blockchain technology to ensure certificate immutability and provides a web interface for both certificate issuance and verification workflows.

# Recent Changes

## November 11, 2025 - Frontend CertificateRegistryV2 Method Updates
- **Fixed contract method calls**: Updated all frontend blockchain methods to use CertificateRegistryV2 instead of SimpleCertificateRegistry
- **Method changes**:
  - `issueCertificate`: Changed from calling `storeHash` to `issueCertificate`
  - `verifyCertificate`: Changed from calling `verifyHash` to `verifyCertificate`
  - `certificateExists`: Changed from calling `hashExists` to `certificateExists`
  - `getCertificateDetails`: Changed from calling `getHashDetails` to `getCertificateDetails`
- **Resolved errors**: Fixed "contract.methods.verifyHash is not a function" error
- Certificate verification now works correctly with CertificateRegistryV2 on Sepolia

## November 11, 2025 - Complete Blockchain Environment Configuration
- **Configured Replit Secrets**: Set up ALCHEMY_API_KEY and PRIVATE_KEY via Replit's secure secret management
- **Automated RPC URL Construction**: Updated `server/auth.js` to automatically build SEPOLIA_RPC_URL from ALCHEMY_API_KEY
- **Frontend Environment Variables**: Configured Vite to inject ALCHEMY_API_KEY into frontend via `vite.config.js`
- **Updated Frontend Contract Reference**: Changed `certificate.js` from SimpleCertificateRegistry to CertificateRegistryV2
- **Removed Hardcoded API Keys**: Eliminated fallback API key from frontend code for better security
- **Contract Addresses Configured**:
  - CertificateRegistryV2: `0xbB9b70BB804AFe74Fb2a9AaC9141a932C153489e`
  - InstituteRegistry: `0x9fd047D340860589FA274B5a07A9AEFec28b56DB`
- System now fully configured to interact with Sepolia testnet blockchain

## November 11, 2025 - CertificateRegistryV2 Integration Fix
- **Fixed ABI mismatch**: Updated `server/auth.js` to load CertificateRegistryV2.json ABI instead of CertificateRegistry.json
- **Corrected function parameters**: Fixed `server/server.js` to call `issueCertificate` with correct signature (certificateHash, instituteName) instead of incorrect 3-parameter call
- **Aligned backend with deployed contract**: Backend now properly interfaces with CertificateRegistryV2 at 0xbB9b70BB804AFe74Fb2a9AaC9141a932C153489e
- **Environment configuration**: Set up all required blockchain environment variables (SEPOLIA_RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS) in Replit Secrets
- Certificate issuance now works correctly with Sepolia testnet blockchain

## November 3, 2025 - Backend Blockchain Integration
- **Fixed blockchain connectivity**: Added `getBlockchainContract` function to `server/auth.js` enabling backend blockchain operations
- **Implemented proper validation**: All three environment variables (SEPOLIA_RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS) now strictly enforced
- **Configured environment secrets**: Set up secure storage for blockchain credentials in Replit Secrets
- **Updated .env.example**: Added comprehensive documentation for blockchain configuration
- Backend can now:
  - Generate unique IDs on blockchain via `/unique-id/generate` endpoint
  - Issue certificates on blockchain via `/certificate/issue` endpoint  
  - Revoke certificates on blockchain via `/certificate/revoke` endpoint
- Uses ethers.js v6 for blockchain interactions with Sepolia testnet

## November 3, 2025 - Sepolia Testnet Migration
- **Migrated from Ganache to Sepolia testnet** for production-ready blockchain deployment
- Deployed all 4 smart contracts to Sepolia testnet (Chain ID: 11155111):
  - InstituteRegistry: 0x9fd047D340860589FA274B5a07A9AEFec28b56DB
  - SimpleCertificateRegistry: 0xe033615aB3FB5Efb9fE3646CBBD51A409B799AdC
  - CertificateRegistry: 0xA31F1A83Acbc44d87cB23a98D9c83e75D10236E5
  - CertificateRegistryV2: 0xbB9b70BB804AFe74Fb2a9AaC9141a932C153489e
- Added network validation in frontend to enforce Sepolia connections
- Configured Alchemy API for Sepolia RPC endpoint
- Updated environment configuration for Replit deployment
- Created documentation: SEPOLIA_DEPLOYMENT.md and CONTRACT_ARTIFACTS_VERIFICATION.md
- Removed Ganache workflow (no longer needed)
- Frontend now displays clear error messages if user is on wrong network

## October 29, 2025
- Fixed all workflow startup issues by installing missing dependencies
- Backend is running on port 3001 using file-based storage (MongoDB not configured for development)
- Frontend (Vite) is running on port 5000 and properly serving the application
- Installed all required npm packages for root, server, and certificate-frontend directories

### Architecture Change: MetaMask Integration
- Updated frontend to use MetaMask for blockchain transactions instead of backend
- Created new blockchain helper module (institute.js) for MetaMask wallet connection and institute registration
- Removed blockchain transaction code from backend auth.js (no more hardcoded private keys)
- Backend now only stores metadata (instituteId, instituteName, passwordHash, blockchainTxHash, walletAddress)
- Registration flow now: Connect MetaMask → Sign blockchain transaction → Store metadata in backend
- Login flow simplified: Only verify instituteId and password (no blockchain verification needed)

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Technology Stack**: React 18 with Vite as the build tool and development server
- **Web3 Integration**: Uses Web3.js library to interact with Ethereum blockchain via MetaMask and Alchemy
- **Network**: Connects to Sepolia testnet with network validation to ensure correct chain ID
- **Routing**: React Router DOM for client-side navigation between different application views
- **Styling**: CSS modules with component-specific stylesheets for login, forms, verification, and hero sections
- **Security**: Helmet middleware for HTTP security headers

## Smart Contract Architecture
- **Framework**: Truffle development framework for Ethereum smart contract compilation, deployment, and testing
- **Contracts**: 
  - `InstituteRegistry` - Contract for institute registration and verification on blockchain
  - `SimpleCertificateRegistry` - Simplified contract for certificate hash storage
  - `CertificateRegistry` - Main contract for certificate issuance and storage
  - `CertificateRegistryV2` - Updated version of the registry contract
- **Network**: Deployed to Sepolia testnet (Chain ID: 11155111)
- **Migration Scripts**: Automated deployment scripts for contract versioning

## Backend Architecture
- **Technology**: Node.js with Express.js framework
- **Data Storage**: File-based JSON storage for certificate metadata
- **API Design**: RESTful endpoints for certificate operations
- **Security**: CORS middleware for cross-origin requests, crypto module for hash generation
- **File System**: Local file operations for database management using fs module

## Certificate Management
- **Hashing Strategy**: SHA-256 hashing of certificate ID and public key combinations
- **Data Structure**: JSON-based certificate storage with fields for student info, course details, and institutional data
- **Verification Process**: Hash-based verification system linking off-chain metadata with on-chain certificate hashes

# External Dependencies

## Blockchain Infrastructure
- **Sepolia Testnet**: Ethereum testnet for production-ready smart contract deployment
- **Alchemy**: RPC provider for Sepolia blockchain access
- **Truffle Suite**: Smart contract development framework (v5.11.5)
- **Web3.js**: JavaScript library for Ethereum blockchain interaction (v4.14.0)
- **MetaMask**: Web3 wallet for transaction signing and network switching

## Frontend Dependencies
- **React Ecosystem**: React 18.3.1 with React DOM and React Router DOM for SPA functionality
- **Build Tools**: Vite for fast development and optimized production builds
- **Development Tools**: ESLint for code quality with React-specific plugins

## Backend Dependencies
- **Express.js**: Web application framework for API endpoints
- **CORS**: Cross-Origin Resource Sharing middleware
- **Node.js Built-ins**: Crypto, fs, and path modules for core functionality
- **Development Tools**: Nodemon for automatic server restart during development

## Security
- **Helmet**: HTTP security headers middleware for both frontend and backend protection
- **Crypto Module**: Built-in Node.js cryptographic functionality for hash generation