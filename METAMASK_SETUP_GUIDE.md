# MetaMask Setup Guide for Certificate Verification System

## Prerequisites
1. Install MetaMask browser extension from https://metamask.io
2. Ensure Ganache is running on port 8080 (Network ID: 5777)

## MetaMask Network Configuration

### Add Local Ganache Network to MetaMask

1. Open MetaMask and click on the network dropdown (top center)
2. Click "Add Network" → "Add a network manually"
3. Enter the following details:
   - **Network Name**: Ganache Local
   - **RPC URL**: http://127.0.0.1:8080
   - **Chain ID**: 5777
   - **Currency Symbol**: ETH
4. Click "Save"

### Import a Ganache Test Account

1. Copy one of the private keys from Ganache (check the Blockchain workflow logs)
2. In MetaMask, click the account icon → "Import Account"
3. Paste the private key
4. Click "Import"

Example private key from Ganache (first account):
```
0xf5f1b8b9845d38c168ff676be2518419a174f471ef81dc663a417489038fadf8
```

## Testing Institute Registration

1. Navigate to the registration page (click "Login/Register" → "Register here")
2. Fill in the form:
   - Institute ID: e.g., "MIT001"
   - Institute Name: e.g., "Massachusetts Institute of Technology"
   - Password: min 8 characters
   - Confirm Password: same as password
3. Click "Register"
4. MetaMask will prompt you to:
   - Connect your wallet (click "Next" → "Connect")
   - Sign the blockchain transaction (click "Confirm")
5. Wait for the transaction to complete
6. You'll see a success message with the blockchain transaction hash
7. Click to switch to login and use your credentials

## Troubleshooting

### "MetaMask not installed"
- Install the MetaMask browser extension
- Refresh the page

### "Please connect MetaMask to the local Ganache network"
- Make sure MetaMask is connected to the "Ganache Local" network
- Check that Ganache is running on port 8080

### "insufficient funds for intrinsic transaction cost"
- Import a Ganache account that has ETH balance
- Each Ganache account starts with 1000 ETH

### Transaction stuck or fails
- Check that the smart contract is deployed (InstituteRegistry at network 5777)
- Restart Ganache and redeploy contracts if needed: `npx truffle migrate --reset --network development`
