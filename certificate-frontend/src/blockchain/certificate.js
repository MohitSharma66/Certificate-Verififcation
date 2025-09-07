import Web3 from 'web3';
import SimpleCertificateRegistry from '../../../build/contracts/SimpleCertificateRegistry.json';

// Connect to Sepolia testnet via Alchemy
const web3 = new Web3(`https://eth-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY || 'tnJsJ2NM8IO88aZvhZHaU'}`);

const getContractInstance = async () => {
    try {
      const networkId = await web3.eth.net.getId();
      console.log("Network ID:", networkId); // Log network ID for debugging
  
      const deployedNetwork = SimpleCertificateRegistry.networks[networkId];
      if (!deployedNetwork) {
        console.error("SimpleCertificateRegistry not deployed on this network.");
        return null;
      }
  
      console.log("Deployed Contract Address:", deployedNetwork.address); // Log contract address
  
      const contract = new web3.eth.Contract(
        SimpleCertificateRegistry.abi,
        deployedNetwork.address
      );
  
      return contract; // Return the contract instance
    } catch (error) {
      console.error("Error loading contract instance:", error);
      return null;
    }
  };  

export const issueCertificate = async (certificateHash, instituteName) => {
    const contract = await getContractInstance();
    if (!contract) {
        console.error("Failed to load contract instance.");
        return;
    }

    try {
        const accounts = await web3.eth.getAccounts();

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
    
    const contract = await getContractInstance();
    
    if (!contract) {
      console.error("Failed to load contract instance.");
      return null;
    }
    
    try {
      console.log("Calling verifyHash with hash:", certificateHash); // Log the certificate hash
      
      // Call the simplified contract method with the hash
      const result = await contract.methods.verifyHash(certificateHash).call();
      console.log("Verification Result:", result); // Log the result returned by the contract
      
      // Return the result: [exists, institution, timestamp]
      return result;
      
    } catch (error) {
      console.error("Error verifying certificate:", error); // Log detailed error
      throw error; // Propagate the error for further handling
    }
  };

// Check if a certificate hash exists on the blockchain
export const certificateExists = async (certificateHash) => {
    const contract = await getContractInstance();
    
    if (!contract) {
      console.error("Failed to load contract instance.");
      return false;
    }
    
    try {
      // For the existing contract, we'll check if the certificate exists by trying to get it
      const result = await contract.methods.certificates(certificateHash).call();
      return result && result.id && result.id !== '0';
    } catch (error) {
      console.error("Error checking certificate existence:", error);
      return false;
    }
  };

// Get certificate details from blockchain (adapted for existing contract)
export const getCertificateDetails = async (certificateId) => {
    const contract = await getContractInstance();
    
    if (!contract) {
      console.error("Failed to load contract instance.");
      return null;
    }
    
    try {
      const result = await contract.methods.certificates(certificateId).call();
      return result; // Returns certificate struct from existing contract
    } catch (error) {
      console.error("Error getting certificate details:", error);
      throw error;
    }
  };