const InstituteRegistry = artifacts.require("InstituteRegistry");

module.exports = function (deployer) {
  deployer.deploy(InstituteRegistry);
};
