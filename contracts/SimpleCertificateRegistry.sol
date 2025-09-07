// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleCertificateRegistry {
    // Mapping to store certificate hashes
    mapping(string => bool) private certificateHashes;
    mapping(string => uint256) private hashTimestamps;
    mapping(string => string) private hashInstitutions;
    
    address public owner;
    
    event HashStored(string indexed hash, string institution, uint256 timestamp);
    event HashVerified(string indexed hash, bool exists);
    
    constructor() {
        owner = msg.sender;
    }
    
    // Store a certificate hash on the blockchain
    function storeHash(string memory _hash, string memory _institution) public {
        require(bytes(_hash).length > 0, "Hash cannot be empty");
        require(bytes(_institution).length > 0, "Institution cannot be empty");
        
        certificateHashes[_hash] = true;
        hashTimestamps[_hash] = block.timestamp;
        hashInstitutions[_hash] = _institution;
        
        emit HashStored(_hash, _institution, block.timestamp);
    }
    
    // Verify if a certificate hash exists on the blockchain
    function verifyHash(string memory _hash) public view returns (bool exists, string memory institution, uint256 timestamp) {
        exists = certificateHashes[_hash];
        institution = hashInstitutions[_hash];
        timestamp = hashTimestamps[_hash];
        return (exists, institution, timestamp);
    }
    
    // Check if hash exists (simple boolean check)
    function hashExists(string memory _hash) public view returns (bool) {
        return certificateHashes[_hash];
    }
    
    // Get hash details
    function getHashDetails(string memory _hash) public view returns (string memory institution, uint256 timestamp) {
        require(certificateHashes[_hash], "Hash does not exist");
        return (hashInstitutions[_hash], hashTimestamps[_hash]);
    }
}