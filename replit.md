# Overview

This is a blockchain-based certificate verification system that enables educational institutions to issue tamper-proof digital certificates and allows users to verify their authenticity. The system consists of three main components: Ethereum smart contracts for certificate storage, a React frontend for user interaction, and a Node.js backend API for certificate management.

The application leverages blockchain technology to ensure certificate immutability and provides a web interface for both certificate issuance and verification workflows.

# Recent Changes

## October 29, 2025
- Fixed all workflow startup issues by installing missing dependencies
- All three workflows (Frontend, Backend, Blockchain) are now running successfully
- Backend is running on port 3001 using file-based storage (MongoDB not configured for development)
- Blockchain (Ganache) is running on port 8080 with 10 test accounts
- Frontend (Vite) is running on port 5000 and properly serving the application
- Installed all required npm packages for root, server, and certificate-frontend directories

### Architecture Change: MetaMask Integration
- Deployed InstituteRegistry smart contract to Ganache (Network ID: 5777)
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
- **Web3 Integration**: Uses Web3.js library to interact with Ethereum blockchain via Ganache local network
- **Routing**: React Router DOM for client-side navigation between different application views
- **Styling**: CSS modules with component-specific stylesheets for login, forms, verification, and hero sections
- **Security**: Helmet middleware for HTTP security headers

## Smart Contract Architecture
- **Framework**: Truffle development framework for Ethereum smart contract compilation, deployment, and testing
- **Contracts**: 
  - `CertificateRegistry` - Main contract for certificate issuance and storage
  - `CertificateRegistryV2` - Updated version of the registry contract
- **Network**: Configured to work with Ganache local blockchain (port 7545)
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
- **Ganache**: Local Ethereum blockchain development environment (v7.9.2)
- **Truffle Suite**: Smart contract development framework (v5.11.5)
- **Web3.js**: JavaScript library for Ethereum blockchain interaction (v4.14.0)

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