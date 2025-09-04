const CertificateRegistryV2 = artifacts.require("CertificateRegistryV2");

module.exports = function (deployer) {
  deployer.deploy(CertificateRegistryV2);
};