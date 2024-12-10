import Web3 from 'web3';
import CertificateRegistry from '../../../build/contracts/CertificateRegistry.json';

// Explicitly set Ganache as the provider
const web3 = new Web3("http://127.0.0.1:7545"); // Replace window.ethereum with Ganache's RPC URL

const getContractInstance = async () => {
    try {
      const networkId = await web3.eth.net.getId();
      console.log("Network ID:", networkId); // Log network ID for debugging
  
      const deployedNetwork = CertificateRegistry.networks[networkId];
      if (!deployedNetwork) {
        console.error("Contract not deployed on this network.");
        return null;
      }
  
      console.log("Deployed Contract Address:", deployedNetwork.address); // Log contract address
  
      const contract = new web3.eth.Contract(
        CertificateRegistry.abi,
        deployedNetwork.address
      );
  
      return contract; // Return the contract instance
    } catch (error) {
      console.error("Error loading contract instance:", error);
      return null;
    }
  };  

export const issueCertificate = async (id, studentName, courseName, institution, instituteId, year, semester, CGPA) => {
    const contract = await getContractInstance();
    if (!contract) {
        console.error("Failed to load contract instance.");
        return;
    }

    try {
        const accounts = await web3.eth.getAccounts();

        const gasLimit = 6721975;  // Set your custom gas limit here (adjust as needed)
        
        return contract.methods
            .issueCertificate(
                id,               // uint256 _id
                studentName,      // string memory _studentName
                courseName,       // string memory _courseName
                institution,      // string memory _institution
                instituteId,      // uint256 _instituteId
                year,             // uint256 _year
                semester,         // uint256 _semester
                CGPA              // string memory _CGPA
            )
            .send({ 
                from: accounts[0], 
                gas: gasLimit  // Add gas limit here
            });
    } catch (error) {
        console.error("Error issuing certificate:", error);
        throw error;
    }
};

export const verifyCertificate = async (id) => {
    console.log("Inside verifyCertificate function"); // Check if the function is being invoked
    
    const contract = await getContractInstance();
    
    if (!contract) {
      console.error("Failed to load contract instance.");
      return null;
    }
    
    try {
      console.log("Calling verifyCertificate with ID:", id); // Log the certificate ID
      
      // Call the contract method
      const result = await contract.methods.verifyCertificate(id).call();
      console.log("Verification Result:", result); // Log the result returned by the contract
      
      // Return the result
      return result; // This should return [isValid, studentName, institution, id]
      
    } catch (error) {
      console.error("Error verifying certificate:", error); // Log detailed error
      throw error; // Propagate the error for further handling
    }
  };
  
  

  

