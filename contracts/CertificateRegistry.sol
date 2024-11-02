// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract CertificateRegistry {
    struct Certificate {
        uint256 id;
        string studentName;
        string courseName;
        string institution;
        string issueDate;
        bool isValid;
    }

    mapping(uint256 => Certificate) public certificates;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the Owner can issue the Certificate");
        _;
    }

    function issueCertificate(
        uint256 _id,
        string memory _studentName,
        string memory _courseName,
        string memory _institution,
        string memory _issueDate
    ) public onlyOwner {
        certificates[_id] = Certificate(_id, _studentName, _courseName, _institution, _issueDate, true);
    }

    function verifyCertificate(uint256 _id) public view returns (bool) {
        return certificates[_id].isValid;
    }
}