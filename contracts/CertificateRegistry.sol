// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract CertificateRegistry {
    struct Certificate {
        uint256 id; // Certificate Unique ID
        string studentName; // Name of the Student
        string courseName;  // Course Name
        string institution; // Institute Name
        uint256 instituteId; // Institute ID
        uint256 year; // Year
        uint256 semester; // Semester
        string CGPA; // CGPA
        bool isValid; // Certificate validity status
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
        uint256 _instituteId,
        uint256 _year,
        uint256 _semester,
        string memory _CGPA
    ) public onlyOwner {
        certificates[_id] = Certificate(
            _id,
            _studentName,
            _courseName,
            _institution,
            _instituteId,
            _year,
            _semester,
            _CGPA,
            true // Initially, the certificate is valid
        );
    }

    function verifyCertificate(uint256 _id)
        public
        view
        returns (
            bool,
            string memory,
            string memory,
            uint256
        )
    {
        Certificate memory cert = certificates[_id];
        return (cert.isValid, cert.studentName, cert.institution, cert.id);
    }
}
