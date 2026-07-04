// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccessControl.sol";

/**
 * @title RecordRegistry
 * @dev Manages patient record indexing and logs record access events.
 */
contract RecordRegistry {
    struct Record {
        string recordId;
        string ipfsHash;
        string title;
        string category;
        string facility;
        uint256 timestamp;
        address owner;
        string encryptedOwnerKey; // AES key encrypted with owner's public key
    }

    // Mapping: Record ID => Record details
    mapping(string => Record) private records;

    // Mapping: Patient Address => List of registered Record IDs
    mapping(address => string[]) private patientRecords;

    // AccessControl contract reference
    AccessControl public accessControl;

    // Events
    event RecordUploaded(string indexed recordId, address indexed owner, string ipfsHash, string title);
    event RecordViewed(string indexed recordId, address indexed doctor, uint256 timestamp);

    constructor(address _accessControlAddress) {
        require(_accessControlAddress != address(0), "Invalid AccessControl address");
        accessControl = AccessControl(_accessControlAddress);
    }

    /**
     * @notice Registers a new medical record.
     * @param recordId The unique identifier for the record.
     * @param ipfsHash The IPFS Content Identifier (CID).
     * @param title The title of the record.
     * @param category The record category (e.g. Diagnostic, Lab).
     * @param facility The facility where the record was generated.
     * @param encryptedOwnerKey The record's AES key encrypted with the patient's public key.
     */
    function registerRecord(
        string memory recordId,
        string memory ipfsHash,
        string memory title,
        string memory category,
        string memory facility,
        string memory encryptedOwnerKey
    ) external {
        require(bytes(recordId).length > 0, "Record ID cannot be empty");
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(records[recordId].owner == address(0), "Record already exists");

        records[recordId] = Record({
            recordId: recordId,
            ipfsHash: ipfsHash,
            title: title,
            category: category,
            facility: facility,
            timestamp: block.timestamp,
            owner: msg.sender,
            encryptedOwnerKey: encryptedOwnerKey
        });

        patientRecords[msg.sender].push(recordId);

        emit RecordUploaded(recordId, msg.sender, ipfsHash, title);
    }

    /**
     * @notice Retrieves record metadata. Caller must be owner or authorized doctor.
     * @param recordId The unique record identifier.
     * @return ipfsHash The IPFS CID of the encrypted record.
     * @return title The record title.
     * @return category The record category.
     * @return facility The facility name.
     * @return timestamp The upload timestamp.
     * @return owner The address of the record owner (patient).
     * @return encryptedOwnerKey The AES key encrypted with the owner's public key.
     */
    function getRecord(string memory recordId) external view returns (
        string memory ipfsHash,
        string memory title,
        string memory category,
        string memory facility,
        uint256 timestamp,
        address owner,
        string memory encryptedOwnerKey
    ) {
        Record memory rec = records[recordId];
        require(rec.owner != address(0), "Record does not exist");
        require(
            rec.owner == msg.sender || accessControl.hasAccess(rec.owner, msg.sender, recordId),
            "Not authorized to view this record"
        );

        return (
            rec.ipfsHash,
            rec.title,
            rec.category,
            rec.facility,
            rec.timestamp,
            rec.owner,
            rec.encryptedOwnerKey
        );
    }

    /**
     * @notice Gets all records registered under a patient. Caller must be owner or authorized doctor.
     * @param patient The patient's address.
     * @return An array of record IDs.
     */
    function getPatientRecords(address patient) external view returns (string[] memory) {
        require(
            msg.sender == patient || accessControl.hasGlobalAccess(patient, msg.sender),
            "Not authorized to view patient records list"
        );
        return patientRecords[patient];
    }

    /**
     * @notice Logs a view event for auditing. Must be called by authorized doctor before viewing.
     * @param recordId The unique record identifier.
     */
    function logRecordAccess(string memory recordId) external {
        Record memory rec = records[recordId];
        require(rec.owner != address(0), "Record does not exist");
        require(
            rec.owner == msg.sender || accessControl.hasAccess(rec.owner, msg.sender, recordId),
            "Not authorized to access this record"
        );

        emit RecordViewed(recordId, msg.sender, block.timestamp);
    }
}
