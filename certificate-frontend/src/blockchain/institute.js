import Web3 from 'web3';
import InstituteRegistry from '../../../build/contracts/InstituteRegistry.json';

const getMetaMaskWeb3 = async () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    return new Web3(window.ethereum);
  }
  throw new Error("MetaMask not found. Please install MetaMask to use this feature.");
};

const getLocalWeb3 = () => {
  return new Web3('http://127.0.0.1:8080');
};

const getInstituteContract = async (useMetaMask = false) => {
  try {
    const web3Instance = useMetaMask ? await getMetaMaskWeb3() : getLocalWeb3();
    const networkId = await web3Instance.eth.net.getId();
    
    const deployedNetwork = InstituteRegistry.networks[networkId];
    if (!deployedNetwork) {
      throw new Error("InstituteRegistry not deployed on this network. Please ensure you're connected to the correct network.");
    }

    const contract = new web3Instance.eth.Contract(
      InstituteRegistry.abi,
      deployedNetwork.address
    );

    return { contract, web3: web3Instance };
  } catch (error) {
    console.error("Error loading InstituteRegistry contract:", error);
    throw error;
  }
};

export const connectMetaMask = async () => {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask not installed. Please install MetaMask to continue.");
    }

    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found. Please unlock MetaMask.");
    }

    const web3 = new Web3(window.ethereum);
    const networkId = await web3.eth.net.getId();
    
    if (Number(networkId) !== 5777) {
      throw new Error("Please connect MetaMask to the local Ganache network (Network ID: 5777)");
    }

    return {
      account: accounts[0],
      networkId: networkId.toString()
    };
  } catch (error) {
    console.error("MetaMask connection error:", error);
    throw error;
  }
};

export const registerInstituteOnBlockchain = async (instituteId, instituteName, credentialHash) => {
  try {
    const { contract, web3 } = await getInstituteContract(true);
    const accounts = await web3.eth.getAccounts();

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found. Please connect MetaMask.");
    }

    const credentialHashBytes32 = web3.utils.soliditySha3(credentialHash);

    const tx = await contract.methods
      .registerInstitute(instituteId, instituteName, credentialHashBytes32)
      .send({ 
        from: accounts[0],
        gas: 500000
      });

    return {
      success: true,
      transactionHash: tx.transactionHash,
      blockNumber: tx.blockNumber
    };
  } catch (error) {
    console.error("Blockchain registration error:", error);
    throw error;
  }
};

export const verifyInstituteOnBlockchain = async (instituteId, credentialHash) => {
  try {
    const { contract, web3 } = await getInstituteContract(false);
    
    const credentialHashBytes32 = web3.utils.soliditySha3(credentialHash);
    
    const isValid = await contract.methods
      .verifyInstituteCredentials(instituteId, credentialHashBytes32)
      .call();

    return isValid;
  } catch (error) {
    console.error("Blockchain verification error:", error);
    return false;
  }
};

export const getInstituteInfo = async (instituteId) => {
  try {
    const { contract } = await getInstituteContract(false);
    
    const info = await contract.methods.getInstituteInfo(instituteId).call();
    
    return {
      name: info[0],
      isActive: info[1],
      registrationTime: new Date(Number(info[2]) * 1000)
    };
  } catch (error) {
    console.error("Error getting institute info:", error);
    return null;
  }
};
