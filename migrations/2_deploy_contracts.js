const CertificateRegistry = artifacts.require("CertificateRegistry");

module.exports = async function (deployer) {
  await deployer.deploy(CertificateRegistry);
};