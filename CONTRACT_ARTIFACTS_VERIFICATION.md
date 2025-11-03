# Contract Artifacts Verification

## Sepolia Network Entries Confirmed

All contract artifacts contain the Sepolia network (11155111) deployment information.

### InstituteRegistry Networks Object
```json
{
  "5777": {
    "events": {},
    "links": {},
    "address": "0x3459c8C25e14fabaF2157adb6d74d5976DD4DFB9",
    "transactionHash": "0x5f834d97330c179cb34ee121094e0708e56c90ce422224ed5945d2f61d4d98a6"
  },
  "11155111": {
    "events": {},
    "links": {},
    "address": "0x9fd047D340860589FA274B5a07A9AEFec28b56DB",
    "transactionHash": "0xb17c411e8f6f203fbee271f832f6e7c53f447a8149aa3d22192ef0111105d23c"
  }
}
```

### All Contract Sepolia Addresses Verified

Extracted from `build/contracts/*.json` files:

- **InstituteRegistry**: `0x9fd047D340860589FA274B5a07A9AEFec28b56DB`
- **SimpleCertificateRegistry**: `0xe033615aB3FB5Efb9fE3646CBBD51A409B799AdC`
- **CertificateRegistry**: `0xA31F1A83Acbc44d87cB23a98D9c83e75D10236E5`
- **CertificateRegistryV2**: `0xbB9b70BB804AFe74Fb2a9AaC9141a932C153489e`

All contracts contain `networks["11155111"]` entries with the deployed contract addresses.

## Frontend Integration

The frontend code in `institute.js` and `certificate.js` correctly:
1. Loads contract ABIs from the build artifacts
2. Accesses `networks[networkId]` to get the deployment address
3. Validates that networkId is 11155111 (Sepolia)
4. Throws clear errors if contracts are not deployed on the connected network

## Verification Command

Run this to verify all contracts have Sepolia deployments:
```bash
node -e "const fs=require('fs'); ['InstituteRegistry','SimpleCertificateRegistry','CertificateRegistry','CertificateRegistryV2'].forEach(c => { const data=JSON.parse(fs.readFileSync('build/contracts/'+c+'.json')); console.log(c+':', data.networks['11155111']?.address || 'NOT FOUND'); })"
```

Expected output:
```
InstituteRegistry: 0x9fd047D340860589FA274B5a07A9AEFec28b56DB
SimpleCertificateRegistry: 0xe033615aB3FB5Efb9fE3646CBBD51A409B799AdC
CertificateRegistry: 0xA31F1A83Acbc44d87cB23a98D9c83e75D10236E5
CertificateRegistryV2: 0xbB9b70BB804AFe74Fb2a9AaC9141a932C153489e
```

✅ All contracts verified with Sepolia network entries in build artifacts.
