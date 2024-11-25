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
        console.log("Deployed Network Info:", deployedNetwork); // Log the deployed network info

        const contractAddress = deployedNetwork && deployedNetwork.address;
        if (!contractAddress) {
            console.error("Contract address not found for this network. Is the contract deployed?");
            return null;
        }
        console.log("Contract Address:", contractAddress); // Log the contract address

        const abi = CertificateRegistry.abi;
        console.log("Contract ABI:", abi); // Log the ABI for debugging

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
        console.log("User Account:", accounts[0]); // Log the user account

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
        return;
    }

    try {
        const gasLimit = 6721975;  // Set your custom gas limit here (adjust as needed)
        
        return contract.methods.verifyCertificate(id).call({
            gas: gasLimit  // Add gas limit here
        });
    } catch (error) {
        console.error("Error verifying certificate:", error);
        throw error;
    }
};
