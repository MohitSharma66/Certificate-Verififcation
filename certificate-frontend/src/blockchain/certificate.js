import Web3 from 'web3';
import CertificateRegistry from '../../../contracts/CertificateRegistry.sol';

const web3 = new Web3(window.ethereum);

const getContractInstance = async () => {
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = CertificateRegistry.networks[networkId];
    return new web3.eth.Contract(
        CertificateRegistry.abi,
        deployedNetwork && deployedNetwork.address
    );
};

export const issueCertificate = async (id, studentName, courseName, institution, issueDate) => {
    const contract = await getContractInstance();
    const accounts = await web3.eth.getAccounts();
    return contract.methods.issueCertificate(id, studentName, courseName, institution, issueDate)
        .send({ from: accounts[0] });
};

export const verifyCertificate = async (id) => {
    const contract = await getContractInstance();
    return contract.methods.verifyCertificate(id).call();
};
