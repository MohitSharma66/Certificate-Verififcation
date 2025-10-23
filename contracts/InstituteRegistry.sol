// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract InstituteRegistry {
    struct Institute {
        string instituteName;
        bytes32 credentialHash;
        uint256 registeredAt;
        bool isActive;
        uint256 certificatesIssued;
        uint256 uniqueIdsGenerated;
    }

    struct UniqueIdRecord {
        string uniqueId;
        string instituteId;
        uint256 generatedAt;
        bool isActive;
    }

    struct CertificateHash {
        string certificateHash;
        string instituteName;
        string instituteId;
        uint256 timestamp;
        bool isValid;
    }

    mapping(string => Institute) public institutes;
    mapping(string => UniqueIdRecord) public uniqueIds;
    mapping(string => CertificateHash) public certificateHashes;
    
    address public owner;
    uint256 public totalInstitutes;
    uint256 public totalUniqueIds;
    uint256 public totalCertificates;

    event InstituteRegistered(string indexed instituteId, string instituteName, uint256 timestamp);
    event UniqueIdGenerated(string indexed uniqueId, string instituteId, uint256 timestamp);
    event CertificateIssued(string indexed certificateHash, string instituteId, string instituteName, uint256 timestamp);
    event CertificateRevoked(string indexed certificateHash);
    event InstituteDeactivated(string indexed instituteId);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    function registerInstitute(
        string memory _instituteId,
        string memory _instituteName,
        bytes32 _credentialHash
    ) public onlyOwner {
        require(bytes(_instituteId).length > 0, "Institute ID cannot be empty");
        require(bytes(_instituteName).length > 0, "Institute name cannot be empty");
        require(_credentialHash != bytes32(0), "Credential hash cannot be empty");
        require(institutes[_instituteId].registeredAt == 0, "Institute already registered");

        institutes[_instituteId] = Institute({
            instituteName: _instituteName,
            credentialHash: _credentialHash,
            registeredAt: block.timestamp,
            isActive: true,
            certificatesIssued: 0,
            uniqueIdsGenerated: 0
        });

        totalInstitutes++;
        emit InstituteRegistered(_instituteId, _instituteName, block.timestamp);
    }

    function verifyInstituteCredentials(
        string memory _instituteId,
        bytes32 _credentialHash
    ) public view returns (bool) {
        Institute memory institute = institutes[_instituteId];
        
        if (institute.registeredAt == 0) {
            return false;
        }
        
        if (!institute.isActive) {
            return false;
        }
        
        return institute.credentialHash == _credentialHash;
    }

    function generateUniqueId(
        string memory _uniqueId,
        string memory _instituteId
    ) public onlyOwner {
        require(bytes(_uniqueId).length > 0, "Unique ID cannot be empty");
        require(bytes(_instituteId).length > 0, "Institute ID cannot be empty");
        require(institutes[_instituteId].registeredAt > 0, "Institute not registered");
        require(institutes[_instituteId].isActive, "Institute is not active");
        require(uniqueIds[_uniqueId].generatedAt == 0, "Unique ID already exists");

        uniqueIds[_uniqueId] = UniqueIdRecord({
            uniqueId: _uniqueId,
            instituteId: _instituteId,
            generatedAt: block.timestamp,
            isActive: true
        });

        institutes[_instituteId].uniqueIdsGenerated++;
        totalUniqueIds++;
        
        emit UniqueIdGenerated(_uniqueId, _instituteId, block.timestamp);
    }

    function issueCertificate(
        string memory _certificateHash,
        string memory _instituteId,
        string memory _instituteName
    ) public onlyOwner {
        require(bytes(_certificateHash).length > 0, "Certificate hash cannot be empty");
        require(bytes(_instituteId).length > 0, "Institute ID cannot be empty");
        require(institutes[_instituteId].registeredAt > 0, "Institute not registered");
        require(institutes[_instituteId].isActive, "Institute is not active");
        require(bytes(certificateHashes[_certificateHash].certificateHash).length == 0, "Certificate hash already exists");

        certificateHashes[_certificateHash] = CertificateHash({
            certificateHash: _certificateHash,
            instituteName: _instituteName,
            instituteId: _instituteId,
            timestamp: block.timestamp,
            isValid: true
        });

        institutes[_instituteId].certificatesIssued++;
        totalCertificates++;
        
        emit CertificateIssued(_certificateHash, _instituteId, _instituteName, block.timestamp);
    }

    function verifyCertificate(string memory _certificateHash)
        public
        view
        returns (
            bool isValid,
            string memory instituteName,
            string memory instituteId,
            uint256 timestamp
        )
    {
        CertificateHash memory certHash = certificateHashes[_certificateHash];
        
        require(bytes(certHash.certificateHash).length > 0, "Certificate not found");
        
        return (
            certHash.isValid,
            certHash.instituteName,
            certHash.instituteId,
            certHash.timestamp
        );
    }

    function revokeCertificate(string memory _certificateHash) public onlyOwner {
        require(bytes(certificateHashes[_certificateHash].certificateHash).length > 0, "Certificate not found");
        
        certificateHashes[_certificateHash].isValid = false;
        emit CertificateRevoked(_certificateHash);
    }

    function getInstituteInfo(string memory _instituteId)
        public
        view
        returns (
            string memory instituteName,
            uint256 registeredAt,
            bool isActive,
            uint256 certificatesIssued,
            uint256 uniqueIdsGenerated
        )
    {
        Institute memory institute = institutes[_instituteId];
        require(institute.registeredAt > 0, "Institute not found");
        
        return (
            institute.instituteName,
            institute.registeredAt,
            institute.isActive,
            institute.certificatesIssued,
            institute.uniqueIdsGenerated
        );
    }

    function verifyUniqueId(string memory _uniqueId)
        public
        view
        returns (
            bool exists,
            string memory instituteId,
            uint256 generatedAt,
            bool isActive
        )
    {
        UniqueIdRecord memory record = uniqueIds[_uniqueId];
        
        if (record.generatedAt == 0) {
            return (false, "", 0, false);
        }
        
        return (true, record.instituteId, record.generatedAt, record.isActive);
    }

    function deactivateInstitute(string memory _instituteId) public onlyOwner {
        require(institutes[_instituteId].registeredAt > 0, "Institute not found");
        institutes[_instituteId].isActive = false;
        emit InstituteDeactivated(_instituteId);
    }

    function certificateExists(string memory _certificateHash) public view returns (bool) {
        return bytes(certificateHashes[_certificateHash].certificateHash).length > 0;
    }
}
