import Web3 from 'web3';
import CertificateRegistry from '../../../build/contracts/CertificateRegistry.json';

// Explicitly set Ganache as the provider
const web3 = new Web3("http://127.0.0.1:7545"); // Replace window.ethereum with Ganache's RPC URL

const getContractInstance = async () => {
    try {
        const networkId = await web3.eth.net.getId();
        console.log("Network ID:", networkId); // Log the network ID

        // Parse the networkId as an integer to avoid issues with string format
        if (parseInt(networkId) !== 5777) {
            console.error("Unexpected Network ID. Expected 5777 (Ganache), but got", networkId);
            return null;
        }

        const deployedNetwork = CertificateRegistry.networks[networkId];

        const contractAddress = deployedNetwork && deployedNetwork.address;
        if (!contractAddress) {
            console.error("Contract address not found for this network. Is the contract deployed?");
            return null;
        }

        const abi = CertificateRegistry.abi;

        return new web3.eth.Contract(abi, contractAddress);
    } catch (error) {
        console.error("Error in getContractInstance:", error);
        return null;
    }
};

export const issueCertificate = async (id, studentName, courseName, institution, issueDate) => {
    const contract = await getContractInstance();
    if (!contract) {
        console.error("Failed to load contract instance.");
        return;
    }

    try {
        const accounts = await web3.eth.getAccounts();

        const gasLimit = 6721975;  // Set your custom gas limit here (adjust as needed)
        
        return contract.methods
            .issueCertificate(id, studentName, courseName, institution, issueDate)
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
    const contract = await getContractInstance();
    if (!contract) {
      console.error("Failed to load contract instance.");
      return false;
    }
  
    try {
      // Assuming verifyCertificate returns a boolean indicating validity
      const isValid = await contract.methods.verifyCertificate(id).call();
      console.log(`Certificate with ID ${id} is valid: ${isValid}`);
      return isValid;
    } catch (error) {
      console.error("Error verifying certificate:", error);
      return false; // Return false in case of an error
    }
};

  

