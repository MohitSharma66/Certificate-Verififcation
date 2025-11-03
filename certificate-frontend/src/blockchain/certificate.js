import Web3 from 'web3';
import SimpleCertificateRegistry from '../../../build/contracts/SimpleCertificateRegistry.json';

// Connect to Sepolia testnet via Alchemy (for read operations)
const alchemyWeb3 = new Web3(`https://eth-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY || 'tnJsJ2NM8IO88aZvhZHaU'}`);

// Get MetaMask Web3 instance for transactions
const getMetaMaskWeb3 = async () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const web3 = new Web3(window.ethereum);
    
    const networkId = await web3.eth.net.getId();
    const SEPOLIA_NETWORK_ID = 11155111;
    
    if (Number(networkId) !== SEPOLIA_NETWORK_ID) {
      throw new Error(
        `Wrong network! Please switch to Sepolia testnet in MetaMask.\n\n` +
        `Current network ID: ${networkId}\n` +
        `Required: Sepolia (${SEPOLIA_NETWORK_ID})`
      );
    }
    
    return web3;
  }
  throw new Error("MetaMask not found. Please install MetaMask to use this feature.");
};

const getContractInstance = async (useMetaMask = false) => {
    try {
      const web3Instance = useMetaMask ? await getMetaMaskWeb3() : alchemyWeb3;
      const networkId = await web3Instance.eth.net.getId();
      console.log("Network ID:", networkId); // Log network ID for debugging
      
      const deployedNetwork = SimpleCertificateRegistry.networks[networkId];
      if (!deployedNetwork) {
        console.error("SimpleCertificateRegistry not deployed on this network.");
        return null;
      }
  
      console.log("Deployed Contract Address:", deployedNetwork.address); // Log contract address
  
      const contract = new web3Instance.eth.Contract(
        SimpleCertificateRegistry.abi,
        deployedNetwork.address
      );
  
      return { contract, web3: web3Instance }; // Return both contract and web3 instance
    } catch (error) {
      console.error("Error loading contract instance:", error);
      return null;
    }
  };  

export const issueCertificate = async (certificateHash, instituteName) => {
    const result = await getContractInstance(true); // Use MetaMask for transactions
    if (!result) {
        console.error("Failed to load contract instance.");
        return;
    }

    const { contract, web3 } = result;

    try {
        const accounts = await web3.eth.getAccounts();
        
        if (!accounts || accounts.length === 0) {
            throw new Error("No accounts found. Please connect your MetaMask wallet.");
        }

        console.log("Using account:", accounts[0]);

        const gasLimit = 300000;  // Much lower gas limit for simple hash storage
        
        return contract.methods
            .storeHash(
                certificateHash,  // string memory _hash
                instituteName     // string memory _institution
            )
            .send({ 
                from: accounts[0], 
                gas: gasLimit
            });
    } catch (error) {
        console.error("Error storing certificate hash:", error);
        throw error;
    }
};

export const verifyCertificate = async (certificateHash) => {
    console.log("Inside verifyCertificate function"); // Check if the function is being invoked
    
    const result = await getContractInstance(false); // Use Alchemy for read operations
    
    if (!result) {
      console.error("Failed to load contract instance.");
      return null;
    }
    
    const { contract } = result;
    
    try {
      console.log("Calling verifyHash with hash:", certificateHash); // Log the certificate hash
      
      // Call the simplified contract method with the hash
      const verifyResult = await contract.methods.verifyHash(certificateHash).call();
      console.log("Verification Result:", verifyResult); // Log the result returned by the contract
      
      // Return the result: [exists, institution, timestamp]
      return verifyResult;
      
    } catch (error) {
      console.error("Error verifying certificate:", error); // Log detailed error
      throw error; // Propagate the error for further handling
    }
  };

// Check if a certificate hash exists on the blockchain
export const certificateExists = async (certificateHash) => {
    const result = await getContractInstance(false); // Use Alchemy for read operations
    
    if (!result) {
      console.error("Failed to load contract instance.");
      return false;
    }
    
    const { contract } = result;
    
    try {
      // Use the simplified contract's hashExists method
      const exists = await contract.methods.hashExists(certificateHash).call();
      return exists;
    } catch (error) {
      console.error("Error checking certificate existence:", error);
      return false;
    }
  };

// Get certificate details from blockchain (for simplified contract)
export const getCertificateDetails = async (certificateHash) => {
    const result = await getContractInstance(false); // Use Alchemy for read operations
    
    if (!result) {
      console.error("Failed to load contract instance.");
      return null;
    }
    
    const { contract } = result;
    
    try {
      const details = await contract.methods.getHashDetails(certificateHash).call();
      return {
        institution: details[0],
        timestamp: details[1]
      };
    } catch (error) {
      console.error("Error getting certificate details:", error);
      throw error;
    }
  };