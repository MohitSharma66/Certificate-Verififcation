# Sepolia Testnet Deployment

## Deployed Smart Contracts

All contracts have been successfully deployed to the Sepolia testnet (Chain ID: 11155111).

### Contract Addresses

| Contract Name | Sepolia Address |
|--------------|-----------------|
| InstituteRegistry | `0x9fd047D340860589FA274B5a07A9AEFec28b56DB` |
| SimpleCertificateRegistry | `0xe033615aB3FB5Efb9fE3646CBBD51A409B799AdC` |
| CertificateRegistry | `0xA31F1A83Acbc44d87cB23a98D9c83e75D10236E5` |
| CertificateRegistryV2 | `0xbB9b70BB804AFe74Fb2a9AaC9141a932C153489e` |

### Network Configuration

- **Network**: Sepolia Testnet
- **Chain ID**: 11155111
- **RPC Provider**: Alchemy
- **Block Explorer**: https://sepolia.etherscan.io/

### Deployment Details

The deployment was completed successfully on November 3, 2025 using Truffle migration scripts.

Deployment transaction hashes:
- InstituteRegistry: `0xb17c411e8f6f203fbee271f832f6e7c53f447a8149aa3d22192ef0111105d23c`
- SimpleCertificateRegistry: `0x9dbdab5ecc291147587751e251ed9d13a2693601e8f100107d99fdf1784cdaaf`
- CertificateRegistry: `0x9bb14c37b7adcb53a73e8df91c6a4ffb894414e7c75190695075d3bb7f3a0ad6`
- CertificateRegistryV2: `0xb20b5651875632416e69d8734a1cfda8f358bc2abaf09e616d6ba9a2608683f0`

### Frontend Configuration

The frontend is configured to:
1. Validate that users are connected to Sepolia (Chain ID: 11155111)
2. Display clear error messages if users are on the wrong network
3. Use MetaMask for transaction signing
4. Use Alchemy for read-only operations

### Testing

To test the application:
1. Install MetaMask browser extension
2. Switch MetaMask to Sepolia testnet
3. Ensure you have some Sepolia ETH for gas fees (get from faucet)
4. Register an institute through the application
5. Issue certificates and verify them

### View on Block Explorer

- [InstituteRegistry](https://sepolia.etherscan.io/address/0x9fd047D340860589FA274B5a07A9AEFec28b56DB)
- [SimpleCertificateRegistry](https://sepolia.etherscan.io/address/0xe033615aB3FB5Efb9fE3646CBBD51A409B799AdC)
- [CertificateRegistry](https://sepolia.etherscan.io/address/0xA31F1A83Acbc44d87cB23a98D9c83e75D10236E5)
- [CertificateRegistryV2](https://sepolia.etherscan.io/address/0xbB9b70BB804AFe74Fb2a9AaC9141a932C153489e)
