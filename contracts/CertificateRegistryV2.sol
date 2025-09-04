// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract CertificateRegistryV2 {
    struct CertificateHash {
        string certificateHash; // Hash of certificate ID + public key
        string instituteName; // Institute name for verification display
        uint256 timestamp; // When the certificate was issued
        bool isValid; // Certificate validity status
    }

    mapping(string => CertificateHash) public certificateHashes;
    mapping(address => bool) public authorizedInstitutes; // Authorized institutes that can issue certificates
    address public owner;

    event CertificateIssued(string indexed certificateHash, string instituteName, uint256 timestamp);
    event CertificateRevoked(string indexed certificateHash);
    event InstituteAuthorized(address indexed institute);
    event InstituteRevoked(address indexed institute);

    constructor() {
        owner = msg.sender;
        authorizedInstitutes[msg.sender] = true; // Owner is automatically authorized
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedInstitutes[msg.sender], "Only authorized institutes can issue certificates");
        _;
    }

    // Add authorized institute
    function authorizeInstitute(address _institute) public onlyOwner {
        authorizedInstitutes[_institute] = true;
        emit InstituteAuthorized(_institute);
    }

    // Remove authorized institute
    function revokeInstitute(address _institute) public onlyOwner {
        authorizedInstitutes[_institute] = false;
        emit InstituteRevoked(_institute);
    }

    // Issue certificate with hash
    function issueCertificate(
        string memory _certificateHash,
        string memory _instituteName
    ) public onlyAuthorized {
        require(bytes(_certificateHash).length > 0, "Certificate hash cannot be empty");
        require(bytes(_instituteName).length > 0, "Institute name cannot be empty");
        require(bytes(certificateHashes[_certificateHash].certificateHash).length == 0, "Certificate hash already exists");

        certificateHashes[_certificateHash] = CertificateHash(
            _certificateHash,
            _instituteName,
            block.timestamp,
            true // Initially valid
        );

        emit CertificateIssued(_certificateHash, _instituteName, block.timestamp);
    }

    // Verify certificate by hash
    function verifyCertificate(string memory _certificateHash)
        public
        view
        returns (
            bool isValid,
            string memory instituteName,
            uint256 timestamp
        )
    {
        CertificateHash memory certHash = certificateHashes[_certificateHash];
        
        // Check if certificate exists
        require(bytes(certHash.certificateHash).length > 0, "Certificate not found");
        
        return (
            certHash.isValid,
            certHash.instituteName,
            certHash.timestamp
        );
    }

    // Revoke certificate
    function revokeCertificate(string memory _certificateHash) public onlyAuthorized {
        require(bytes(certificateHashes[_certificateHash].certificateHash).length > 0, "Certificate not found");
        
        certificateHashes[_certificateHash].isValid = false;
        emit CertificateRevoked(_certificateHash);
    }

    // Check if certificate exists (returns boolean)
    function certificateExists(string memory _certificateHash) public view returns (bool) {
        return bytes(certificateHashes[_certificateHash].certificateHash).length > 0;
    }

    // Get certificate details
    function getCertificateDetails(string memory _certificateHash)
        public
        view
        returns (
            string memory certificateHash,
            string memory instituteName,
            uint256 timestamp,
            bool isValid
        )
    {
        CertificateHash memory certHash = certificateHashes[_certificateHash];
        require(bytes(certHash.certificateHash).length > 0, "Certificate not found");
        
        return (
            certHash.certificateHash,
            certHash.instituteName,
            certHash.timestamp,
            certHash.isValid
        );
    }
}